window.onload = function(){

// Playgama Bridge Initialization
if (typeof bridge !== 'undefined') {
    bridge.initialize()
        .then(() => {
            console.log("Playgama Bridge initialized");
            bridge.platform.sendMessage('game_ready');

            // Load Saved High Score
            bridge.storage.get('bestScore')
                .then(value => {
                    if (value) {
                        bestScore = parseInt(value);
                        document.getElementById("best").innerHTML = bestScore;
                        console.log("Loaded high score:", bestScore);
                    }
                })
                .catch(err => console.error("Error loading score:", err));

            // Handle Game Visibility (Pause/Resume Sound)
            bridge.game.on('visibility_state_changed', (state) => {
                if (state === 'hidden') {
                    if (bgSound) bgSound.pause();
                } else {
                    if (bgSound && !isMuted && runCount > 0) bgSound.play().catch(e => {});
                }
            });
        })
        .catch(error => console.error("Playgama Bridge init failed:", error));
}

var isMuted = false;
var muteBtn = document.getElementById("muteBtn");

muteBtn.addEventListener("click", function() {
    if (!isMuted) clickSound.play().catch(e => {});
    isMuted = !isMuted;
    muteBtn.innerHTML = isMuted ? "🔇" : "🔊";
    
    // Update all audio objects
    var sounds = [startSound, shootSound, hitSound, bgSound, endSound, successSound, highScoreSound, clickSound];
    sounds.forEach(s => {
        if (s) s.muted = isMuted;
    });

    if (isMuted) {
        if (bgSound) bgSound.pause();
    } else {
        if (runCount > 0 && bgSound && bgSound.paused) bgSound.play().catch(e => {});
    }
});

String.prototype.repeat =  String.prototype.repeat ||
  function(c){
    var r= '';
    for(var i=0; i<c; ++i)
        r += this;
    return r;
}

var asrcd = "toky";
var startPage = document.getElementById("startMenu");
var startBtn = document.getElementById("startBtn");
var rewardBtn = document.getElementById("rewardBtn");
var storyOverlay = document.getElementById("storyOverlay");
var storyTextContainer = document.getElementById("storyText");
var skipStoryBtn = document.getElementById("skipStoryBtn");

// Story content
var storyLines = [
    "Deep in the Misty Forest, a legend awaits...",
    "You are the Chosen Archer, the only one who can master the shifting winds.",
    "Your mission is simple: Hit the target to prove your skill.",
    "The closer you hit to the gold, the more points you earn.",
    "Score 7+ points to earn bonus arrows and keep the legend alive.",
    "Tap or press any key to shoot. The forest is watching...",
    "Are you ready?"
];

var storyIndex = 0;
var charIndex = 0;
var typingSpeed = 50;

function typeWriter() {
    if (storyIndex < storyLines.length) {
        if (charIndex < storyLines[storyIndex].length) {
            storyTextContainer.innerHTML += storyLines[storyIndex].charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            // Line finished, wait and then clear for next line
            setTimeout(() => {
                storyTextContainer.innerHTML = "";
                charIndex = 0;
                storyIndex++;
                if (storyIndex < storyLines.length) {
                    typeWriter();
                } else {
                    // Story finished
                    endStory();
                }
            }, 2000);
        }
    }
}

function startStory() {
    startPage.style.display = "none";
    storyOverlay.style.display = "flex";
    storyIndex = 0;
    charIndex = 0;
    storyTextContainer.innerHTML = "";
    typeWriter();
}

function endStory() {
    storyOverlay.style.display = "none";
    startGameActual();
}

skipStoryBtn.addEventListener("click", endStory);

// Ensure reward button is hidden at start
rewardBtn.style.display = "none";

// Only restart game when the start button is specifically clicked
startBtn.addEventListener("click", function(e) {
    if (!isMuted) clickSound.play().catch(e => {});
    startStory(); // Start story instead of immediate game
});

// Rename original startGame to startGameActual
function startGameActual(){
    startPage.style.display = "none";
    rewardBtn.style.display = "none"; // Hide reward button when starting
    loadGame();
    try{
        if (!isMuted) {
            startSound.play().catch(function(e){});
            
            // Start BG music from beginning when game starts
            if (bgSound) {
                bgSound.currentTime = 0;
                bgSound.play().catch(function(e){});
            }
        }
        if(runCount == 0){
        endSound.play().catch(function(e){})
        hitSound.play().catch(function(e){});
        successSound.play().catch(function(e){});
        highScoreSound.play().catch(function(e){});
        runCount++;
        }
    }catch(err){}

}

rewardBtn.addEventListener("click", function(e) {
    if (!isMuted) clickSound.play().catch(e => {});
    showRewardedAd(e);
});

function startGame() {
    // This is now handled by startBtn -> startStory -> endStory -> startGameActual
}

var bestScore = 0;
var runCount = 0;

var startSound = new Audio();
startSound.src = "start.mp3";
startSound.volume = 0.6;

var shootSound = new Audio();
shootSound.src = "arrow.mp3";

var hitSound = new Audio();
hitSound.src = "hit.mp3";

var bgSound = new Audio();
bgSound.src = "bg.mp3";
bgSound.loop = false; // We'll handle looping manually

// Custom loop: When music ends, restart from 5 seconds
bgSound.addEventListener('ended', function() {
    this.currentTime = 5;
    if (!isMuted) {
        this.play().catch(e => {});
    }
});
//bgSound.volume = 0.8;

var endSound = new Audio();
endSound.src = "gameover.mp3";
endSound.volume = 0.6;

var clickSound = new Audio();
clickSound.src = "click.mp3";

var successSound = new Audio();
successSound.src = "bell.ogg";

var highScoreSound = new Audio();
highScoreSound.src = "crowdcheer.ogg";


function showRewardedAd(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    console.log("Attempting to show rewarded ad...");
    
    if (typeof bridge !== 'undefined' && bridge.advertisement) {
        // Pause audio while ad is playing
        if (bgSound) bgSound.pause();
        
        bridge.advertisement.showRewarded()
            .then(() => {
                // IMPORTANT: In Playgama Bridge, .then() is called ONLY if the ad was successfully watched to completion.
                // If the user closes the ad early, it will trigger the .catch() block or won't reach here.
                console.log("Rewarded ad watched to completion. Granting reward.");
                
                rewardBtn.style.display = "none";
                startPage.style.display = "none";
                
                // Add 5 more arrows to the existing session
                window.continueGame(5);
                
                // Resume audio if not muted
                if (!isMuted && bgSound) bgSound.play().catch(e => {});
            })
            .catch(error => {
                // This block is triggered if the ad fails to load OR if the user closes it early.
                console.error("Rewarded ad failed or was closed early by user:", error);
                alert("You must watch the full ad to receive +5 arrows!");
                
                // Show the reward button again just in case, and keep the menu open
                rewardBtn.style.display = "block";
                startPage.style.display = "flex";
                
                // Resume audio if not muted
                if (!isMuted && bgSound) bgSound.play().catch(e => {});
            });
    } else {
        console.warn("Bridge SDK not found. Simulating reward for testing.");
        window.continueGame(5);
        rewardBtn.style.display = "none";
        startPage.style.display = "none";
    }
}

function loadGame(){
"use strict";


    var countTimeOut;
    function countTime(){
    var container = document.getElementById("timerDiv");
    container.innerHTML = "<div class='timer'></div>";
    countTimeOut = setTimeout(shoot,5500);
    }
    countTime();


    var gameScore = document.getElementById("score");
    var totalScore = 0;
    var autoMove = false;
    
    // New Mechanics: Wind and Combo
    var windSpeed = 0;
    var comboCount = 0;
    var multiplier = 1;
    var windDisplay = document.getElementById("wind-display");
    var comboDisplay = document.getElementById("combo-display");

    function updateWind() {
        // Random wind between -2 and 2
        windSpeed = (Math.random() * 4 - 2).toFixed(1);
        var direction = windSpeed > 0 ? "⬇️" : "⬆️";
        windDisplay.innerHTML = "Wind: " + Math.abs(windSpeed) + " " + direction;
    }
    updateWind();

    var w = window.innerWidth;
    var h = window.innerHeight;

    if(h > w){
        document.getElementById("mainContainer").style.transform = "translateX("+(w)+"px) rotate(90deg)";
        document.getElementById("mainContainer").style.width = h+"px";
        var nh = h;
        h = w;
        w = nh;

    }


    var updatePointArea = document.getElementById("showPoint");
    updatePointArea.style.height = h+"px";
    updatePointArea.style.width = w+"px";
    var uScore = document.querySelector("#showPoint .u");
    var arrs = document.getElementById("arrs");

    function updArr(arrNum){
        var arr = "&uarr;";
        arr = arr.repeat(arrNum);
        arrs.innerHTML = arr;
    }

    function animateScore(scr,arrNum){
        if(scr >= 7) uScore.innerHTML = "&uarr; +"+scr;
        else uScore.innerHTML = "+"+scr;
        updArr(arrNum);
        var t = 50, l = 70, o = 1;
        var animIntv = setInterval(function(){
            uScore.style.top = t + "%";
            uScore.style.left = l + "%";
            uScore.style.opacity = o;
            t-=4;
            l-=3;
            o-=0.1;
        },100)
        setTimeout(function(){
            clearInterval(animIntv);
            uScore.style.opacity = 0;
            uScore.style.top = "50%";
            uScore.style.left = "70%";
        },1000);
    }


    var c2 = document.getElementById("animCanvas");
    c2.height = h;
    c2.width = w;
    var ctx2 = c2.getContext("2d");

    var fwBuilder = function(n,x,y,speed){
        this.n = n;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.balls = [];
    }

    fwBuilder.prototype.ready = function(){
        for(var i = 0; i < this.n; i++){
            this.balls[i] = {
                x:this.x,
                y:this.y,
                dx:this.speed*Math.sin(i*Math.PI*2/this.n),
                dy:this.speed*Math.cos(i*Math.PI*2/this.n),
                u:this.speed*Math.cos(i*Math.PI*2/this.n),
                t:0
            }
        }
    }

    fwBuilder.prototype.draw = function(){
        for(var i = 0; i < this.n; i++){
            ctx2.beginPath();
            ctx2.arc(this.balls[i].x,this.balls[i].y,7,0,Math.PI*2);
            ctx2.fill();
            ctx2.closePath();
            this.balls[i].x += this.balls[i].dx;
            this.balls[i].y += this.balls[i].dy;

            this.balls[i].dy += .025;
        }

        if(this.balls[Math.round(this.n/2)].y > h){
            clearInterval(intvA);
            running = false;
            ctx2.clearRect(0,0,w,h);
        }
    }

    var fw1 = new fwBuilder(40,w/5,h,3);
    var fw2 = new fwBuilder(40,4*w/5,h,3);

    var intvA;
    var running = false;

    function newF(){
        if(!running){
            fw1.ready();
            fw2.ready();
            running = true;
            intvA = setInterval(function(){
                ctx2.clearRect(0,0,w,h);
                fw1.draw();
                fw2.draw();
            },15)
        }
    }

    newF();
    //c2.addEventListener("click",newF)


    var c = document.getElementById("myCanvas");

    c.height = h;
    c.width = w;

    var ctx = c.getContext("2d");

    var checkArrowMoveWithBoard1 = false;
    var checkArrowMoveWithBoard2 = false;

    // Objects...

    var arc = {
        x:30,
        y:100,
        dy:3,
          r:50,
          color:"#8B4513",
          lw:3,
          start:Math.PI+Math.PI/2,
          end:Math.PI-Math.PI/2
    }

    var rope = {
        h:arc.r*2,
          lw:1,
          x:arc.x-25,
          color:"#ddd",
          status:true
    }

    var board = {
        x:w-40,
        y:h/2,
        dy:4,
        height:150,
        width:7
    }

    var boardY;
    var boardMove = false;
    var totalArr = 10;
    updArr(totalArr);

    // Global function to continue game after reward
    window.continueGame = function(extraArrows) {
        totalArr += extraArrows;
        updArr(totalArr);
        
        // Restart the game loop if it was stopped
        if (totalArr > 0) {
            intv = setInterval(function(){
                move();
                drawArc();
                drawRope();
                arrow1.drawArrow();
                arrow2.drawArrow();
                drawBoard();
            }, 15);
            
            // Re-add event listeners
            document.getElementById("animCanvas").addEventListener("click",shoot);
            document.body.addEventListener("keydown",shoot);
        }
    };

    function drawBoard() {
        // Draw the wooden back of the board
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(board.x + board.width, board.y - board.height/2, 5, board.height);

        // Draw multi-colored target rings (White, Black, Blue, Red, Gold/Yellow)
        var colors = ["#fff", "#000", "#36e", "#e44", "#ed4"];
        var bh = board.height;
        for(var i=0; i<colors.length; i++) {
            ctx.fillStyle = colors[i];
            ctx.fillRect(board.x, board.y - bh/2, board.width, bh);
            bh -= board.height/5;
        }

        if(board.y >= h || board.y <= 0){
            board.dy *= -1;
        }


        if(autoMove){
            board.y += board.dy;
            if(checkArrowMoveWithBoard1){
                arrow1.moveArrowWithBoard(1);
            }
            else if(checkArrowMoveWithBoard2){
                arrow2.moveArrowWithBoard(1);
            }
        }
        else{

            if(boardMove){
                if(Math.abs(board.y - boardY) > 5){
                    board.y += board.dy;
                    arrow1.moveArrowWithBoard(1);
                    arrow2.moveArrowWithBoard(1);
                }
            }
            else{
                if(Math.abs(board.y - boardY) > 5){
                    board.y -= board.dy;
                    arrow1.moveArrowWithBoard(-1);
                    arrow2.moveArrowWithBoard(-1);
                }
            }
        }
    }

    function Arrow(){
        this.w = 85;
        this.x = arc.x-25;
        this.dx = 20;
        this.status = false;
        this.vis = true;
        this.fy = arc.y;
    }

    Arrow.prototype.drawArrow = function() {
        if(this.vis) {
            if(this.status) {
                ctx.fillStyle = "#8B4513";
                ctx.fillRect(this.x,this.fy-3,10,6);
                ctx.fillStyle = "#555";
                ctx.fillRect(this.x,this.fy-1,this.w,2);
                ctx.beginPath();
                ctx.moveTo(this.x+this.w,this.fy-4);
                ctx.lineTo(this.x+this.w+12,this.fy);
                ctx.lineTo(this.x+this.w,this.fy+4);
                ctx.fillStyle = "#aaa";
                ctx.fill();

                if(moveArrowCheck) {
                    // Apply wind effect to arrow flight
                    this.fy += parseFloat(windSpeed);

                    if(this.x < w-155){
                        this.x += this.dx;
                    }
                    else {
                        if(!(this.fy <= board.y-board.height/2 || this.fy >= board.y+board.height/2) || this.x > w){
                            if(this.x > w-110){
                                if(this == arrow1){
                                    arrow2.vis = true;
                                    checkArrowMoveWithBoard1 = true;
                                    checkArrowMoveWithBoard2 = false;
                                }
                                else {
                                    arrow1.vis = true;
                                    checkArrowMoveWithBoard1 = false;
                                    checkArrowMoveWithBoard2 = true;
                                }
                                moveArrowCheck = false;
                                score++;
                                
                                // Update wind every shot
                                updateWind();

                                if(this.fy >= board.y-board.height/2 && this.fy <= board.y+board.height/2) {
                                    // HIT Logic
                                    comboCount++;
                                    multiplier = Math.min(5, 1 + Math.floor(comboCount/3)); // Max x5 multiplier
                                    comboDisplay.innerHTML = "Combo: x" + multiplier + " (" + comboCount + ")";
                                    comboDisplay.style.color = "#ffeb3b";

                                    try{
                                        hitSound.play().catch(function(e){});
                                    }catch(err){}
                                    var scores = this.fy - board.y;
                                    var currentScore = (Math.round(board.height/20)-Math.round(Math.abs(scores/10))) * multiplier;
                                    
                                    if(currentScore/multiplier >= 7){
                                        newF();
                                        totalArr+=2;
                                        try{
                                            successSound.play().catch(function(e){});
                                        }catch(err){
                                    }
                                }

                                totalScore += currentScore;
                                gameScore.innerHTML = totalScore;

                                // Increase difficulty based on score
                                if (totalScore > 50 && !autoMove) {
                                    autoMove = true;
                                    board.dy = 5;
                                }
                                if (totalScore > 150) {
                                    board.dy = 7;
                                }

                                animateScore(currentScore,totalArr);

                                boardY = board.y + scores;
                                if(scores>=0){
                                    boardMove = true;
                                }
                                else {
                                    boardMove = false;
                                }
                            }
                            else {
                                // MISS Logic
                                comboCount = 0;
                                multiplier = 1;
                                comboDisplay.innerHTML = "Combo: x1";
                                comboDisplay.style.color = "#fff";
                                updArr(totalArr);
                            }
                                if(totalArr <= 0){
                                    // Stop BG sound on Game Over
                                    if (bgSound) {
                                        bgSound.pause();
                                        bgSound.currentTime = 0;
                                    }

                                    // Show Reward Button and Interstitial Ad on Game Over
                                    if (typeof bridge !== 'undefined' && bridge.advertisement) {
                                        rewardBtn.style.display = "block"; // Show reward button
                                        bridge.advertisement.showInterstitial();
                                    }
                                    clearInterval(intv);
                                    try{
                                        //bgSound.pause();
                                        endSound.play().catch(function(e){});
                                    }catch(err){
                                }
                                document.getElementById("animCanvas").removeEventListener("click",shoot);
                                document.body.removeEventListener("keydown",shoot);
                                startPage.style.display = "flex";
                                document.getElementById("title").innerHTML = "Your Score<br>"+totalScore;
                                if(bestScore < totalScore){
                                    bestScore = totalScore;
                                    // Save High Score to Playgama Storage
                                    if (typeof bridge !== 'undefined') {
                                        bridge.storage.set('bestScore', bestScore.toString())
                                            .then(() => console.log("Score saved successfully"))
                                            .catch(err => console.error("Error saving score:", err));
                                    }
                                    try{
                                        highScoreSound.play().catch(function(e){});
                                    }catch(err){
                                }
                            }
                            document.getElementById("score").innerHTML = 0;
                            document.getElementById("best").innerHTML = bestScore;
                            }

                            }
                            else {
                                this.x += this.dx;
                            }
                        }
                        else {
                            this.x += this.dx;
                        }
                    }
                }
            }
            else {
                ctx.fillStyle = "#8B4513";
                ctx.fillRect(rope.x,arc.y-3,10,6);
                ctx.fillStyle = "#555";
                ctx.fillRect(rope.x,arc.y-1,this.w,2);
                ctx.beginPath();
                ctx.moveTo(rope.x+this.w,arc.y-4);
                ctx.lineTo(rope.x+this.w+12,arc.y);
                ctx.lineTo(rope.x+this.w,arc.y+4);
                ctx.fillStyle = "#aaa";
                ctx.fill();
            }
        }
    }

    // Arrow Move With Board

    Arrow.prototype.moveArrowWithBoard = function(dir) {
        if(this == arrow1){
            arrow1.fy += board.dy*dir;
        }
        else {
            arrow2.fy += board.dy*dir;
        }
    }




    var arrow1 = new Arrow();
    var arrow2 = new Arrow();

    var arrows = 0;
    var moveArrowCheck = false;
    var score = 0;

    // Drawing functions...

    function drawArc() {
        ctx.beginPath();
          ctx.arc(arc.x,arc.y,arc.r,arc.start,arc.end);
          ctx.strokeStyle = arc.color;
          ctx.lineWidth = arc.lw;
          ctx.stroke();
          ctx.closePath();
    }

    function drawRope() {
        ctx.beginPath();
          ctx.moveTo(arc.x,arc.y-arc.r);
          if(arrow1.vis && arrow2.vis){
            ctx.lineTo(rope.x,arc.y);
          }
          ctx.lineTo(arc.x,arc.y+arc.r);
          ctx.lineWidth = rope.lw;
          ctx.strokeStyle = rope.color;
          ctx.stroke();
          ctx.closePath();
    }

    // Moving function...

    function move () {
          ctx.clearRect(0,0,w,h);
          if(arc.y>h-50 || arc.y<50){
            arc.dy*=-1;
          }
          arc.y+=arc.dy;
    }

    function shoot(){
          if(arrow1.vis && arrow2.vis && arrows != -1){
            moveArrowCheck = true;
            clearTimeout(countTimeOut);
    countTime();
            if(arrows%2===0){
                  arrow1.status = true;
                  arrow1.fy = arc.y;
                  arrow2.status = false;
                  arrow2.x = rope.x;
                  arrow2.vis = false;
                }
            else{
                  arrow1.status = false;
                  arrow2.fy = arc.y;
                  arrow2.status = true;
                  arrow1.x = rope.x;
                  arrow1.vis = false;
            }
            totalArr--;
            try{
                shootSound.play().catch(function(e){});
                }catch(err){}
          }
          arrows++;
    }

    document.getElementById("animCanvas").addEventListener("click",shoot);
     document.body.addEventListener("keydown",shoot);

    var intv = setInterval(function(){
          move();
          drawArc();
          drawRope();
          arrow1.drawArrow();
          arrow2.drawArrow();
          drawBoard();
    },15)
}
}
//window.onload = setTimeout(loadGame,2000);
