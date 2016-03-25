"use strict";

var options = {};
options.selection = options.selection || 0;
options.complexity = options.complexity || 3;

var imgNames = [
    'haunter.png',
    'pokemon-map.png',
    'calvin_and_hobbes.png'
]

var images = [];
for (var i=0; i<imgNames.length; ++i) {
    var img = new Image();
    img.src = './images/' + imgNames[i];
    images.push(img);
}

var tileImage = images[options.selection];

var tiles = [];
var dimensions = { x: 300, y: 300 };
var numRows = options.complexity;
var numColumns = options.complexity;
var frameDimensions = {
    x: dimensions.x / numColumns,
    y: dimensions.y / numRows
};

var emptyTile;
var liveGame;
var renderTween;
var winText;
var stage;

function initPuzzle() {
    var j = numRows * numColumns - numColumns; // bottom left
    emptyTile = {
        index: j,
        originalIndex: j,
        bitmap: { x: 0, y: (numRows - 1) / numRows * dimensions.y } //fix dis
    };

    var spriteSheet = new createjs.SpriteSheet({
        images: [tileImage],
        frames: {
            width: frameDimensions.x,
            height: frameDimensions.y,
            regX: frameDimensions.x / 2,
            regY: frameDimensions.y / 2,
            spacing: 0,
            margin: 0
        }
    });

    liveGame = true;
    renderTween = false;

    stage = new createjs.Stage('tilePuzzleCanvas');

    for (var i = 0; i < spriteSheet.getNumFrames(); ++i) {
        if (i == emptyTile.index) {
            tiles.push(emptyTile);
            continue;
        }
        var frame = spriteSheet.getFrame(i);
        var bitmap = new createjs.Bitmap(frame.image);
        bitmap.sourceRect = frame.rect;
        bitmap.x = bitmap.x + frame.rect.x;
        bitmap.y = bitmap.y + frame.rect.y;
        bitmap.shadow = new createjs.Shadow('#000', 0, 0, 2);

        bitmap.on('mousedown', handleClick, this, false, { index: i });

        tiles.push({
            bitmap: bitmap,
            originalIndex: i,
            index: i
        });
        stage.addChild(bitmap);
    }

    winText = new createjs.Text('COMPLETE', '42px Futura', '#000');
    winText.x = dimensions.x / 2;
    winText.y = dimensions.y / 2;
    winText.textAlign = 'center';
    winText.textBaseline = 'middle';
    winText.shadow = new createjs.Shadow("#fff", 0, 0, 5);
    resetWinText();
    stage.addChild(winText);

    stage.update();
    renderTween = false;
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener('tick', tick);

    readyForShuffle();
}

function resetWinText() {
    winText.scaleX = 0.4;
    winText.scaleY = 0.4;
    winText.alpha = 0;
}

function readyForShuffle() {
    liveGame = false;
    stage.on('mousedown', shuffleTiles);
}

function tick(e) {
    if (renderTween) {
        stage.update(e);
    }
}

function handleClick(evt, data) {
    if (liveGame) {
        moveTile(tiles[data.index], checkForWin);
    }
}

function checkForWin() {
    var win = tiles.every(function(tile) {
        return tile.index === tile.originalIndex;
    });

    if (win) {
        winText.alpha = 1;
        renderTween = true;
        createjs.Tween.get(winText).to({ scaleX: 1, scaleY: 1 }, 1200, createjs.Ease.elasticOut).call(function() {
            renderTween = false;
            stage.update();
        });
        readyForShuffle();
    }
}

function moveTile(tile, callback) {
    if (!validMove(tile.bitmap.x, tile.bitmap.y, emptyTile.bitmap.x, emptyTile.bitmap.y)) {
        console.log('invalid move');
        return false;
    }

    var targetX = emptyTile.bitmap.x;
    var targetY = emptyTile.bitmap.y;
    var targetIndex = emptyTile.index;

    emptyTile.bitmap.x = tile.bitmap.x;
    emptyTile.bitmap.y = tile.bitmap.y;
    emptyTile.index = tile.index;

    tile.index = targetIndex;
    renderTween = true;
    var self = this;
    createjs.Tween.get(tile.bitmap).to({ x: targetX, y: targetY }, 50).call(function() {
        renderTween = false;
        stage.update();
        if (callback) {
            callback();
        }
    });

    return true;
}

function validMove(x1, y1, x2, y2) {
    var xDif = Math.abs(x1 - x2);
    var yDif = Math.abs(y1 - y2);

    if (xDif + yDif === frameDimensions.x) { // fix for non-square
        return true;
    } else {
        return false;
    }
}

function shuffleTiles(e) {
    e.remove(); // remove stage 'click' listener
    resetWinText();

    var self = this;
    var stopShuffle = false;
    stage.on('mousedown', function(e) {
        stopShuffle = true;
        e.remove();
        liveGame = true;
    })

    var prevTile = null;
    var i = 0;

    function shuffle() {
        if (stopShuffle) {
            return;
        } else {
            ++i;
            var moves = getValidMoves();
            var move = prevTile;
            while (move === prevTile) {
                move = moves[Math.floor(Math.random() * moves.length)];
            }
            prevTile = move;
            moveTile(move, shuffle);
        }
    }

    shuffle();
}

function getValidMoves() {
    var validMoves = [];
    tiles.forEach(function(tile) {
        if (validMove(tile.bitmap.x, tile.bitmap.y, emptyTile.bitmap.x, emptyTile.bitmap.y)) {
            validMoves.push(tile);
        }
    });
    return validMoves;
}

function renderSettings() {
}

function onPuzzleSelect(e) {
    //options.selection = Number(e.target.alt);
    //options.complexity = Number($('#puzzleComplexitySelect')[0].value);
}
