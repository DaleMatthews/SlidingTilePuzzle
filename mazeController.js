"use strict";

var HORIZONTAL = 0;
var VERTICAL = 1;
var WALL = 2;
var NO_WALL = 3;

function Maze(mazeSize) {
    var lineGraphic = new createjs.Graphics().beginStroke('black').beginFill('#b3b3b3').drawRect(0, 0, 10, 250);
    var lineShape = new createjs.Shape(lineGraphic);
    lineShape.x = 20;
    lineShape.y = 10;
    var lineShape2 = new createjs.Shape(lineGraphic);
    lineShape2.x = 70;
    lineShape2.y = 10;
    this.addChild(lineShape, lineShape2);

    this.vLines = [];
    this.hLines = [];

    // Add walls around the sides
    this.vLines.push({
        x: 0,
        y1: 0,
        y2: mazeSize
    });
    this.vLines.push({
        x: mazeSize,
        y1: 0,
        y2: mazeSize
    });
    this.hLines.push({
        y: 0,
        x1: 0,
        x2: mazeSize
    });
    this.hLines.push({
        y: mazeSize,
        x1: 0,
        x2: mazeSize
    });

    this.addMazeLine(0, 0, mazeSize, mazeSize);
}

Maze.prototype = new createjs.Container();

Maze.prototype.chooseOrientation = function(width, height) {
    if (width < height)
        return HORIZONTAL;
    else if (height < width)
        return VERTICAL;
    else
        return Math.floor(Math.random()*2) === 0 ? HORIZONTAL : VERTICAL;
}

// Adds a wall to the maze within the square (xStart, yStart) -> (xStop, yStop)
Maze.prototype.addMazeLine = function(xStart, yStart, xStop, yStop) {
    var width = xStop - xStart;
    var height = yStop - yStart;
    if (this.chooseOrientation(width, height) === HORIZONTAL) {
        if (width === 1) {
            return;
        }
        var yWall = Math.floor(Math.random() * (height-1)) + yStart+1;
        var xSpace = Math.floor(Math.random() * width) + xStart;
        if (xSpace !== xStart) { // don't want a wall of length 0
            this.hLines.push({
                y: yWall,
                x1: xStart,
                x2: xSpace
            });
        }
        if (xStop !== xSpace+1) { // don't want a wall of length 0
            this.hLines.push({
                y: yWall,
                x1: xSpace+1,
                x2: xStop
            });
        }
        this.addMazeLine(xStart, yStart, xStop, yWall);
        this.addMazeLine(xStart, yWall, xStop, yStop);
    } else { // VERTICAL
        if (height === 1) {
            return;
        }
        var xWall = Math.floor(Math.random() * (width-1)) + xStart+1;
        var ySpace = Math.floor(Math.random() * height) + yStart;
        if (ySpace !== yStart) { // don't want a wall of length 0
            this.vLines.push({
                x: xWall,
                y1: yStart,
                y2: ySpace
            });
        }
        if (yStop !== ySpace+1) { // don't want a wall of length 0
            this.vLines.push({
                x: xWall,
                y1: ySpace+1,
                y2: yStop
            });
        }
        this.addMazeLine(xStart, yStart, xWall, yStop);
        this.addMazeLine(xWall, yStart, xStop, yStop);
    }
}

function MazeController() {
    this.characterSheet = new Image();
    this.characterSheet.src = './images/maze-runner.png';
    this.dimensions = {x: 300, y: 300};
}

var mazeController = new MazeController();

MazeController.prototype.onLoad = function() {
    this.stage = new createjs.Stage('mazeCanvas');

    // create spritesheet and assign the associated data.
    var spriteSheet = new createjs.SpriteSheet({
        // image to use
        images: [this.characterSheet],
        // width, height & registration point of each sprite
        frames: {width: 48, height: 48, regX: 24, regY: 24, spacing: 0, margin: 0},
        animations: {
            downStand: 0,
            down: {
                frames: [0, 4, 8, 12],
                speed: 0.6
            },
            leftStand: 1,
            left: {
                frames: [1, 5, 9, 13],
                speed: 0.6
            },
            upStand: 2,
            up: {
                frames: [2, 6, 10, 14],
                speed: 0.6
            },
            rightStand: 3,
            right: {
                frames: [3, 7, 11, 15],
                speed: 0.6
            }
        }
    });

    this.hero = new createjs.Sprite(spriteSheet);
    this.hero.scaleX = 0.9;
    this.hero.scaleY = 0.9;
    this.hero.gotoAndPlay('downStand'); // animate
    this.lastAnimation = 'down'; // save the direction

    this.hero.name = 'hero'; // used for debugging
    this.hero.x = this.dimensions.x / 2;
    this.hero.y = this.dimensions.y / 2;
    this.hero.shadow = new createjs.Shadow('#454', -2, -4, 2);
    this.stage.addChild(this.hero);

    this.maze = new Maze(5);
    this.stage.addChild(this.maze);

    createjs.Ticker.setFPS(20);
    createjs.Ticker.addEventListener('tick', this.tick.bind(this));
},

MazeController.prototype.tick = function(e) {
    // e.delta = time passed in ms since last tick
    if (key.isPressed('up') || key.isPressed('w')) {
        this.move(e.delta, 0, -1, 'up');
    } else if (key.isPressed('down') || key.isPressed('s')) {
        this.move(e.delta, 0, 1, 'down');
    } else if (key.isPressed('left') || key.isPressed('a')) {
        this.move(e.delta, -1, 0, 'left');
    } else if (key.isPressed('right') || key.isPressed('d')) {
        this.move(e.delta, 1, 0, 'right');
    } else {
        this.noMove();
    }

    this.stage.update(e);
},

MazeController.prototype.move = function(delta, xDir, yDir, animation) {
    var pt = this.hero.localToLocal(0, 0, this.maze);
    var xMove = xDir*delta/5;
    var yMove = yDir*delta/5;
    if (!this.maze.hitTest(pt.x + xMove, pt.y + yMove)) { // '+' because we're testing if the hero moved
        this.maze.x = this.maze.x - xMove; // '-' because we're actually moving the maze instead of the hero
        this.maze.y = this.maze.y - yMove;
        if (this.hero.currentAnimation !== animation) {
            this.lastAnimation = animation;
            this.hero.gotoAndPlay(animation);
        }
    }
},

MazeController.prototype.noMove = function () {
    var animation = this.lastAnimation + 'Stand';
    if (this.hero.currentAnimation !== animation) {
        this.hero.gotoAndPlay(animation);
    }
},

MazeController.prototype.renderSettings = function() { // Display the configuration UI
    this.element.innerHTML = ConfigTemplate.render(this);
},

MazeController.prototype.onConfig = function(e) {
    // Update the persisted data
    //this.options.selection = Number(e.target.alt);
    //this.options.complexity = Number(this.$('#puzzleComplexitySelect')[0].value);
    // Optionally save or close the widget configuration
    this.trigger('complete:edit'); // Save and close
}
