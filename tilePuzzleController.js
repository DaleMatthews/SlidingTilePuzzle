
        //'click img': 'onPuzzleSelect'

        initialize: function(options) {
            this.options = options;
            this.options.selection = this.options.selection || 0;
            this.options.complexity = this.options.complexity || 3;

            var imgNames = [
                'haunter.png',
                'pokemon-map.png',
                'calvin_and_hobbes.png',
                'lexmark-logo.png'
            ]

            this.images = [];
            for (var i=0; i<imgNames.length; ++i) {
                var img = new Image();
                img.src = require.toUrl('./../images/' + imgNames[i]);
                this.images.push(img);
            }
        },

        render: function() {
            this.tileImage = this.images[this.options.selection];

            this.tiles = [];
            this.dimensions = { x: 300, y: 300 };
            this.numRows = this.options.complexity;
            this.numColumns = this.options.complexity;
            this.frameDimensions = {
                x: this.dimensions.x / this.numColumns,
                y: this.dimensions.y / this.numRows
            };
            var i = this.numRows * this.numColumns - this.numColumns; // bottom left
            this.emptyTile = {
                index: i,
                originalIndex: i,
                bitmap: { x: 0, y: (this.numRows - 1) / this.numRows * this.dimensions.y } //fix dis
            };
            this.liveGame = true;

            //setTimeout(this.onLoad.bind(this), 100);
        },

        onLoad: function() {
            var spriteSheet = new createjs.SpriteSheet({
                images: [this.tileImage],
                frames: {
                    width: this.frameDimensions.x,
                    height: this.frameDimensions.y,
                    regX: this.frameDimensions.x / 2,
                    regY: this.frameDimensions.y / 2,
                    spacing: 0,
                    margin: 0
                }
            });

            this.stage = new createjs.Stage(this.element.firstChild);

            for (var i = 0; i < spriteSheet.getNumFrames(); ++i) {
                if (i == this.emptyTile.index) {
                    this.tiles.push(this.emptyTile);
                    continue;
                }
                var frame = spriteSheet.getFrame(i);
                var bitmap = new createjs.Bitmap(frame.image);
                bitmap.sourceRect = frame.rect;
                bitmap.x = bitmap.x + frame.rect.x;
                bitmap.y = bitmap.y + frame.rect.y;
                bitmap.shadow = new createjs.Shadow('#000', 0, 0, 2);

                var listener = bitmap.on('mousedown', this.handleClick, this, false, { index: i });

                this.tiles.push({
                    bitmap: bitmap,
                    originalIndex: i,
                    index: i
                });
                this.stage.addChild(bitmap);
            }

            this.winText = new createjs.Text('COMPLETE', '42px Futura', '#000');
            this.winText.x = this.dimensions.x / 2;
            this.winText.y = this.dimensions.y / 2;
            this.winText.textAlign = 'center';
            this.winText.textBaseline = 'middle';
            this.winText.shadow = new createjs.Shadow("#fff", 0, 0, 5);
            this.resetWinText();
            this.stage.addChild(this.winText);


            this.stage.update();
            this.renderTween = false;
            createjs.Ticker.setFPS(60);
            createjs.Ticker.addEventListener('tick', this.tick.bind(this));

            this.readyForShuffle();
        },

        resetWinText: function () {
            this.winText.scaleX = 0.4;
            this.winText.scaleY = 0.4;
            this.winText.alpha = 0;
        },

        readyForShuffle: function () {
            this.liveGame = false;
            this.stageListener = this.stage.on('mousedown', this.shuffleTiles.bind(this));
        },

        tick: function(e) {
            if (this.renderTween) {
                this.stage.update(e);
            }
        },

        handleClick: function(evt, data) {
            if (this.liveGame) {
                this.moveTile(this.tiles[data.index], this.checkForWin.bind(this));
            }
        },

        checkForWin: function() {
            var win = this.tiles.every(function(tile) {
                return tile.index === tile.originalIndex;
            });

            if (win) {
                var self = this;
                this.winText.alpha = 1;
                this.renderTween = true;
                createjs.Tween.get(self.winText).to({ scaleX: 1, scaleY: 1 }, 1200, createjs.Ease.elasticOut).call(function() {
                    self.renderTween = false;
                    self.stage.update();
                });
                this.readyForShuffle();
            }
        },

        moveTile: function(tile, callback) {
            if (!this.validMove(tile.bitmap.x, tile.bitmap.y, this.emptyTile.bitmap.x, this.emptyTile.bitmap.y)) {
                console.log('invalid move');
                return false;
            }

            var targetX = this.emptyTile.bitmap.x;
            var targetY = this.emptyTile.bitmap.y;
            var targetIndex = this.emptyTile.index;

            this.emptyTile.bitmap.x = tile.bitmap.x;
            this.emptyTile.bitmap.y = tile.bitmap.y;
            this.emptyTile.index = tile.index;

            tile.index = targetIndex;
            this.renderTween = true;
            var self = this;
            createjs.Tween.get(tile.bitmap).to({ x: targetX, y: targetY }, 50).call(function() {
                self.renderTween = false;
                self.stage.update();
                if (callback) {
                    callback();
                }
            });

            return true;
        },

        validMove: function(x1, y1, x2, y2) {
            var xDif = Math.abs(x1 - x2);
            var yDif = Math.abs(y1 - y2);

            if (xDif + yDif === this.frameDimensions.x) { // fix for non-square
                return true;
            } else {
                return false;
            }
        },

        shuffleTiles: function(e) {
            e.remove(); // remove stage 'click' listener
            this.resetWinText();

            var self = this;
            var stopShuffle = false;
            this.stage.on('mousedown', function(e) {
                stopShuffle = true;
                e.remove();
                self.liveGame = true;
            })

            var prevTile = null;
            var i = 0;

            function shuffle() {
                if (stopShuffle) {
                    return;
                } else {
                    ++i;
                    var moves = self.getValidMoves();
                    var move = prevTile;
                    while (move === prevTile) {
                        move = moves[Math.floor(Math.random() * moves.length)];
                    }
                    prevTile = move;
                    self.moveTile(move, shuffle);
                }
            }

            shuffle();
        },

        getValidMoves: function() {
            var self = this;
            var validMoves = [];
            this.tiles.forEach(function(tile) {
                if (self.validMove(tile.bitmap.x, tile.bitmap.y, self.emptyTile.bitmap.x, self.emptyTile.bitmap.y)) {
                    validMoves.push(tile);
                }
            });
            return validMoves;
        },

        renderSettings: function() {
        },

        onPuzzleSelect: function(e) {
            // Update the persisted data
            this.options.selection = Number(e.target.alt);
            this.options.complexity = Number(this.$('#puzzleComplexitySelect')[0].value);
            // Optionally save or close the widget configuration
            this.trigger('complete:edit'); // Save and close
        }