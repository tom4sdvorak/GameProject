/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvasArea");
const ctx = canvas.getContext("2d");
canvas.width = 1366;
canvas.height = 768;
let canvasPosition = canvas.getBoundingClientRect();

/** @type {HTMLCanvasElement} */
const collisionCanvas = document.getElementById("collisionCanvasArea");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = 1366;
collisionCanvas.height = 768;

let timeToNextEnemy = 0;
let enemyInterval = 1000;
let lastTime = 0;
let score = 0;
let lives = 5;
ctx.font = "50px Impact";
let gameSpeed = 1;

let ghosts = [];
class Ghost{
    constructor(){     
        this.sizeModifier = Math.random() * 0.3 + 0.2;     
        this.x = canvas.width;
        this.directionX = Math.random() * 2 + 3;
        this.directionY = Math.random() * 5 -5;
        this.speedModifier = 1;
        this.markedForDel = false;
        this.frame = 0;
        this.timeSinceAnim = 0;
        this.animInterval = this.directionX*10;
        this.randomColors = [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)];
        this.color = "rgb(" + this.randomColors[0] + "," + this.randomColors[1] + "," + + this.randomColors[2] + ")";
    }
    update(deltaTime){
        if (this.y < 0 || this.y > canvas.height - 0.7*this.height){
            this.directionY = this.directionY * -1;
        }
        this.x -= this.directionX*this.speedModifier*gameSpeed;
        this.y += this.directionY*this.speedModifier*gameSpeed;
        if (this.x < 0 - this.width){
            this.markedForDel = true;
            if (this instanceof BadGhost){
                lives--;
                if (lives < 0){
                    lives = 0;
                }
            }
        }
        this.timeSinceAnim += deltaTime*2;
        if (this.timeSinceAnim > this.animInterval){
            if (this.frame > this.maxFrame){
                this.frame = 0;
            }
            else{
                this.frame++;
            }
            this.timeSinceAnim = 0;
        }
    }
    draw(){
        collisionCtx.fillStyle = this.color;
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.frame*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
    }
}

class BadGhost extends Ghost{
    constructor(){
        super();
        this.spriteWidth = 396;
        this.spriteHeight = 582;
        this.width = this.spriteWidth*this.sizeModifier;
        this.height = this.spriteHeight*this.sizeModifier;
        this.maxFrame = 9;
        this.y = Math.random() * (canvas.height - this.height);
        this.image = new Image();
        this.image.src = "assets/ghost_sprite.png";
        this.value = 1;
    }
}

class GoodGhost extends Ghost{
    constructor(){
        super();
        this.spriteWidth = 439;
        this.spriteHeight = 582;
        this.width = this.spriteWidth*this.sizeModifier;
        this.height = this.spriteHeight*this.sizeModifier;
        this.maxFrame = 28;
        this.y = Math.random() * (canvas.height - this.height);
        this.image = new Image();
        this.image.src = "assets/good_sprite.png";
        this.value = -5;
        this.speedModifier = 0.5;
    }
}

let puffs = [];
class Puff{
    constructor(x, y, size){
        this.image = new Image();
        this.image.src = "assets/boom.png";
        this.spriteWidth = 200;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = "assets/boom.wav";
        this.sound.volume = Math.round((size/canvas.height)*100)*0.01; // Set volume of sound dependant on size
        this.timeSinceAnim = 0;
        this.animInterval = 100;
        this.markedForDel = false;
    }
    update(deltaTime){
        if (this.frame == 0){
            this.sound.play();
        }
        this.timeSinceAnim += deltaTime;
        if(this.timeSinceAnim > this.animInterval){
            this.frame++;
            this.timeSinceAnim = 0;
            if (this.frame > 5){
                this.markedForDel = true;
            }
        }
    }
    draw(){
        ctx.drawImage(this.image, this.frame*this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.size, this.size);
    }
}


class Background{
    constructor(path, speedModifier){
        this.image = new Image();
        this.image.src = path;
        this.x = 0;
        this.width = 1920;
        this.height = 1080;
        this.speed = speedModifier;
        this.speedCounter = 0;
    }
    update(deltaTime){
        this.x -= this.speed;
        if(this.x < 0-this.width){
            this.x = 0;
        }
    }
    draw(){
        ctx.drawImage(this.image, this.x, 0, this.width, this.height);
        ctx.drawImage(this.image, this.x+this.width, 0, this.width, this.height);
    }
}

let backgrounds = [new Background("assets/bg/1.png", 1), new Background("assets/bg/2.png", 2), new Background("assets/bg/3.png", 3),
 new Background("assets/bg/4.png", 4), new Background("assets/bg/5.png", 5), new Background("assets/bg/6.png", 6),
 new Background("assets/bg/7.png", 7), new Background("assets/bg/8.png", 8), new Background("assets/bg/9.png",  9)
];


function drawScore(){
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 50, 75);
}

function drawLives(){
    ctx.fillStyle = "black";
    let heart = "❤";
    ctx.fillText(heart.repeat(lives), 50, canvas.height-75);
}

function drawGameOver(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER [" + score + " points]", canvas.width/2, canvas.height/2);
}

window.addEventListener("click", function(e){
    const detectPixelColor = collisionCtx.getImageData(e.x - canvasPosition.left, e.y - canvasPosition.top, 1, 1);
    const pc = detectPixelColor.data;
    console.log(pc);
    ghosts.forEach(object => {
        if (object.randomColors[0] === pc[0] && object.randomColors[1] === pc[1] && object.randomColors[2] === pc[2]){
            object.markedForDel = true;
            score += object.value;
            puffs.push(new Puff(object.x, object.y, object.height));
        }
    });
});


function animate(timestamp){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    timeToNextEnemy += deltaTime;
    if (timeToNextEnemy > enemyInterval){
        // Randomly choose which ghost to spawn, with Bad Ghosts spawning roughly 4 times more often
        if (Math.random() > 0.2){
            ghosts.push(new BadGhost());
        }
        else{
            ghosts.push(new GoodGhost());
        }
        // Also slightly increase gamespeed with every new enemy
        gameSpeed += 0.1;
        timeToNextEnemy = 0;
        ghosts.sort(function(a,b){
            return a.height - b.height;
        });
    }
    [...backgrounds, ...ghosts, ...puffs].forEach(object => object.update(deltaTime));
    [...backgrounds, ...ghosts, ...puffs].forEach(object => object.draw());
    drawScore();
    drawLives();
    ghosts = ghosts.filter(object => !object.markedForDel);
    puffs = puffs.filter(object => !object.markedForDel);
    if (true){
        requestAnimationFrame(animate);
    }
    else{
        drawGameOver();
    }
}
animate(0);
