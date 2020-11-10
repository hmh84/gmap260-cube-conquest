var background;
var scissors;
var scissors2;
var hitbox;
var wire;
var wireToCut;
var idealCut;
var goLeft;
var goRight;
var minigame_timer;
var timerDisplay;
var bombIcon;
var isWireCut;
var isTimerOn;
var isGameOn;

function arm_bomb() {
    toggle_modal('modal_bomb');

    if (isGameOn) {
        bombGame.stop();
        bombGame.clear();
    }
    isGameOn = true;
    bombGame.start();
    background = new component(bombGame.canvas.width, bombGame.canvas.height, "assets/graphics/BackGround.png", 0, 0, "image");
    wire = new component(bombGame.canvas.width + 40, 69, "assets/graphics/Uncut_Wire.png", 0 - 27, bombGame.canvas.height * 0.18, "image");
    scissors = new component(270, 270, "assets/graphics/Scissors3DStationBlade_0.png", 10, bombGame.canvas.height * 0.01, "image");
    scissors2 = new component(270, 270, "assets/graphics/Scissors3DMoveableBlade_0.png", 10, bombGame.canvas.height * 0.01, "image");
    hitbox = new component(scissors.width * 0.05, scissors.height * 0.42, "", scissors.x + scissors.width * 0.6, scissors.y, "hidden");
    wireToCut = new component(Math.random() * 20 + 20, wire.height - 35, "green", Math.random() * (bombGame.canvas.width - 60), wire.y + 9, "transparent");
    idealCut = new component(22, wireToCut.height, "assets/graphics/IdealCut.png", wireToCut.x + wireToCut.width * 0.5 - 11, wireToCut.y, "image")
    prompt = new component("18px", "mainFont", "white", 48, 360, "text", "center");
    prompt2 = new component("18px", "mainFont", "white", 350, 375, "text", "center");
    prompt3 = new component("18px", "mainFont", "white", 48, 375, "text", "center");
    prompt4 = new component("18px", "mainFont", "white", 350, 390, "text", "center");
    prompt5 = new component("18px", "mainFont", "white", 48, 390, "text", "center");
    timerDisplay = new component("90px", "timerFont", "white", 102, 390, "text", "left");
    bombIcon = new component(100, 100, "assets/graphics/bomb_3.png", 305, 250, "image");
    minigame_timer = 7;
    goLeft = true;
    isWireCut = false;
    isTimerOn = true;
}

var bombGame = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.context = this.canvas.getContext("2d");
        // modal_bomb.appendChild(this.canvas);
        modal_bomb.insertBefore(this.canvas, modal_bomb.childNodes[0]);
        this.interval = setInterval(updateBombGame, 20);
        window.addEventListener('keydown', function(e) {
            bombGame.key = e.keyCode;
        })
        window.addEventListener('keyup', function(e) {
            bombGame.key = false;
        })
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop: function() {
        clearInterval(this.interval);
    }
}

function component(width, height, color, x, y, type, alignment) {
    this.type = type;
    if (this.type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.speedX = 0;
    this.speedY = 0;
    this.x = x;
    this.y = y;
    this.color = color;
    this.update = function() {
        ctx = bombGame.context;
        if (this.type == "text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = this.color;
            ctx.textAlign = alignment;
            ctx.fillText(this.text, this.x, this.y);
        } else if (this.type == "image") {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else if (this.type == "hidden") {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        } else if (this.type == "transparent") {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.7;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
    this.overlap = function(otherComponent) {
        var thisLeftSide = this.x;
        var thisRightSide = this.x + this.width;
        var thisTopSide = this.y;
        var thisBottomSide = this.y + this.height;
        var otherLeftSide = otherComponent.x;
        var otherRightSide = otherComponent.x + otherComponent.width;
        var otherTopSide = otherComponent.y;
        var otherBottomSide = otherComponent.y + otherComponent.height;
        var overlap = true;
        if ((thisLeftSide > otherRightSide) || (thisRightSide < otherLeftSide) || (thisBottomSide < otherTopSide) || (thisTopSide > otherBottomSide)) {
            overlap = false;
        }
        // Checks if the main component is away from the other component's side
        // If the scissors are directly to the left of the wire, thisRight < otherLeft is true, but everything else is false
        return overlap;
    }
}

function updateBombGame() {

    if (isWireCut || !isTimerOn) {
        bombGame.stop();
    }

    if (bombGame.key && bombGame.key == 32) {
        if (hitbox.overlap(wireToCut)) {
            prompt.text = "";
            prompt2.text = "The bomb was";
            prompt3.text = "";
            prompt4.text = "defused";
            prompt5.text = "";
            isWireCut = true;
            wireToCut.type = "hidden";
            scissors2.image.src = "assets/graphics/Scissors3DMoveableBlade_2.png";
            wire.image.src = "assets/graphics/Cut_Wire.png";
            wire.width = 912;
            wire.x = hitbox.x + hitbox.width - wire.width * 0.5;
            idealCut.type = "hidden";
            bombGame.key = false;

            defuse_bomb();
        } else {
            prompt.text = "You";
            prompt2.text = "The bomb";
            prompt3.text = "prematurely";
            prompt4.text = "detonated!";
            prompt5.text = "cut the wire!";
            isWireCut = true;
            scissors2.image.src = "assets/graphics/Scissors3DMoveableBlade_2.png";

            detonate_bomb();
        }
    }
    //Once the scissors and wire overlap, user presses the space bar to cut
    //The alert can be replaced with whatever we want the game to do when
    //the wire is cut. If the game is put into a pop up, it can close
    //the pop-up or something along those lines

    bombGame.clear();
    stopMove();

    if (hitbox.x < 0) {
        goLeft = false;
        goRight = true;
    } else if (hitbox.x > bombGame.canvas.width - hitbox.width) {
        goLeft = true;
        goRight = false;
    }
    if (goLeft) {
        moveleft();
    } else if (goRight) {
        moveright();
    }
    //This'll keep the scissors going back and forth
    //maybe implement random initial placement of the scissors

    background.update();
    scissors2.newPos();
    scissors2.update();
    bombIcon.update();
    wire.update();
    wireToCut.update();
    idealCut.update();

    hitbox.newPos();
    hitbox.update();
    scissors.newPos();
    scissors.update();

    if (minigame_timer >= 0 && isWireCut == false) {
        prompt.text = "Defuse the";
        prompt3.text = "bomb before";
        prompt2.text = "Hit SPACE to";
        prompt4.text = "cut the wire!";
        prompt5.text = "time runs out!";

        timerString = minigame_timer.toString();
        if (parseInt(timerString.substring(2, 3)) % 2 == 0) {
            scissors2.image.src = "assets/graphics/Scissors3DMoveableBlade_1.png";
        } else {
            scissors2.image.src = "assets/graphics/Scissors3DMoveableBlade_0.png";
        }
        if (Math.round(minigame_timer) == 4) {
            bombIcon.image.src = "assets/graphics/bomb_2.png";
        } else if (Math.round(minigame_timer) == 1) {
            bombIcon.image.src = "assets/graphics/bomb_1.png";
        }
        timerDisplay.text = "0" + timerString.substring(0, 1) + ":" + timerString.substring(2, 4);
        minigame_timer = minigame_timer - 0.013;
    } else if (minigame_timer < 0) {
        isTimerOn = false;
        prompt.text = "Time's up";
        prompt2.text = "The bomb";
        prompt3.text = "";
        prompt4.text = "detonated";
        prompt5.text = "";
        bombIcon.image.src = "assets/graphics/bomb_0.png";

        detonate_bomb();
    }
    //Timer that lasts about 10 seconds.
    //To keep the game running smoothly, I just
    //picked the rate of change that looked most
    //accurate to displaying one second passing.

    prompt.update();
    prompt2.update();
    prompt3.update();
    prompt4.update();
    prompt5.update();
    timerDisplay.update();
}

function moveleft() {
    scissors.speedX -= 4;
    scissors2.speedX -= 4;
    hitbox.speedX -= 4;
}

function moveright() {
    scissors.speedX += 4;
    scissors2.speedX += 4;
    hitbox.speedX += 4;
}

function stopMove() {
    scissors.speedX = 0;
    scissors2.speedX = 0;
    hitbox.speedX = 0;
}

function autoDefuseWindow() {
    if (confirm("50-50 chance of this working... you sure?")) {
        const x = Math.random().toFixed(2);
        if (x <= 0.5) { // 50% chance
            prompt.text = "";
            prompt2.text = "The bomb was";
            prompt3.text = "";
            prompt4.text = "defused";
            prompt5.text = "";
            isWireCut = true;

            defuse_bomb();
        } else {
            detonate_bomb();
        }
    }
}

function defuse_bomb() {
    // APP_JS.....
    active_cell.dataset.bomb = false;
    push_diffuse(active_cell);
    setTimeout(function() {
        // I am delayed
        toggle_modal('close');
    }, 1000);
}

function detonate_bomb() {
    // APP_JS.....
    kill_player(active_cell);
    setTimeout(function() {
        // I am delayed
        toggle_modal('close');
    }, 2000); // 2s
}