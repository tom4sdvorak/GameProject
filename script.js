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
let gameRunning = false;
let timeToNextEnemy = 0;
let enemyInterval = 1000;
let lastTime = 0;
let score = 0;
let lives = 5;
ctx.font = "50px Impact";
ctx.textBaseline = "middle";
let gameSpeed = 1;

let ghosts = [];
class Ghost{
    constructor(){     
        this.sizeModifier = Math.random() * 0.3 + 0.2;     
        this.x = canvas.width;
        this.directionX = Math.random() + 1;
        this.speedModifier = 1;
        this.markedForDel = false;
        this.frame = 0;
        this.timeSinceAnim = 0;
        this.randomColors = [Math.floor(Math.random()*255),Math.floor(Math.random()*255),Math.floor(Math.random()*255)];
        this.color = "rgb(" + this.randomColors[0] + "," + this.randomColors[1] + "," + + this.randomColors[2] + ")";
    }
    update(deltaTime){            
        this.x -= this.directionX * this.speedModifier * gameSpeed;
        if (this.x < 0 - this.width){
            this.markedForDel = true;
            if (this instanceof BadGhost){
                lives--;
                if (lives < 0){
                    lives = 0;
                }
            }
            else {
                score += 2;
            }
        }
        // Handles sprite animation
        this.timeSinceAnim += deltaTime;
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
        this.directionY = (Math.random() * 1 - 0.5) * this.directionX;
        this.y = Math.random() * (canvas.height - this.height);
        this.image = new Image();
        this.image.src = "assets/ghost_sprite.png";
        this.value = 1;
        this.animInterval = 70;
    }
    update(deltaTime){
        super.update(deltaTime);
        // Simple random vertical direction movement pattern that bounces ghosts off the canvas edge
        if (this.y < 0 || this.y > canvas.height - this.height){
            this.directionY = this.directionY * -1;
        }
        this.y += this.directionY*gameSpeed;
    }
}

class GoodGhost extends Ghost{
    constructor(){
        super();
        this.spriteWidth = 439;
        this.spriteHeight = 582;
        this.width = this.spriteWidth*this.sizeModifier;
        this.height = this.spriteHeight*this.sizeModifier;
        this.maxFrame = 27;
        this.y = 400; //Math.random() * (canvas.height - this.height);
        this.image = new Image();
        this.image.src = "assets/good_sprite.png";
        this.value = -5;
        this.speedModifier = 0.5;
        this.angle = Math.random() * 2;
        this.angleSpeed = Math.random() * 0.01;
        this.animInterval = 50;
    }
    update(deltaTime){
        super.update(deltaTime);
        // Sinus wave movement pattern that bounces ghost off the top or bottom edge of canvas
        if (this.y < 0){
            this.angle = 1.74;
        }
        else if(this.y > canvas.height - this.height){
            this.angle = 3.31;
        }      
        this.y += Math.sin(this.angle);
        this.angle += this.angleSpeed*gameSpeed;
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
        this.width = 1536;
        this.height = 768;
        this.speedModifier = speedModifier;
        this.speed = this.speedModifier * gameSpeed;
    }
    // Handles endless horizontal movement of background
    update(deltaTime){
        this.speed = this.speedModifier * gameSpeed;
        this.x -= this.speed;
        if(this.x < 0-this.width+1){
            this.x = 0;
        }
    }
    draw(){
        ctx.drawImage(this.image, this.x, 0, this.width, this.height);
        ctx.drawImage(this.image, this.x+this.width-1, 0, this.width, this.height);
    }
}

let backgrounds = [new Background("assets/bg/1.png", 0), new Background("assets/bg/2.png", 0.02), new Background("assets/bg/3.png", 0.2),
 new Background("assets/bg/4.png", 0.4), new Background("assets/bg/5.png", 0.8), new Background("assets/bg/6.png", 1)
];


function drawScore(){
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.fillText("Score: " + score, 50, 75);
    ctx.strokeText("Score: " + score, 50, 75);
}

function drawLives(){
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    let heart = "❤";
    ctx.fillText(heart.repeat(lives), 50, canvas.height-75);
    ctx.strokeText(heart.repeat(lives), 50, canvas.height-75);
}

function drawGameOver(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "100px Impact";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/4);
    ctx.font = "50px Impact";
    ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2);
}

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
        gameSpeed = Math.round((gameSpeed+0.1) * 100) / 100;
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
    if (lives > 0){
        requestAnimationFrame(animate);
    }
    else{
        drawGameOver();
    }
}

window.addEventListener("click", function(e){
    if(!gameRunning){
        gameRunning = true;
        animate(0);
    }
    else{
        /* Detects collision (shot) by comparing pixel color of mouse coordinates with randomly colored (invisible)
        rectangles rendered behind each ghost*/
        const detectPixelColor = collisionCtx.getImageData(e.x - canvasPosition.left, e.y - canvasPosition.top, 1, 1);
        const pc = detectPixelColor.data;
        ghosts.forEach(object => {
            if (object.randomColors[0] === pc[0] && object.randomColors[1] === pc[1] && object.randomColors[2] === pc[2]){
                object.markedForDel = true;
                score += object.value;
                puffs.push(new Puff(object.x, object.y, object.height));
            }
        });
    }
});

// Renders game intor until clicked away
function gameStart(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("SHOOT", canvas.width/4, canvas.height/4);
    ctx.fillText("SPARE", canvas.width/4*3, canvas.height/4);
    let ghost1 = new Image();
    let ghost2 = new Image();
    ghost1.src = "assets/ghost_sprite.png";
    ghost2.src = "assets/good_sprite.png";
    ctx.drawImage(ghost1, 0, 0, 396, 582, canvas.width*0.25-(396*0.5*0.5), canvas.height*0.3, 396*0.5, 582*0.5);
    ctx.drawImage(ghost2, 0, 0, 439, 582, canvas.width*0.25*3-(439*0.5*0.25), canvas.height*0.3, 439*0.5, 582*0.5);
    ctx.font = "100px Impact";
    ctx.fillText("READY?", canvas.width/2, canvas.height/2);
    ctx.font = "50px Impact";
    ctx.textAlign = "left";
    if(!gameRunning){
        requestAnimationFrame(gameStart);
    } 
}

gameStart();

