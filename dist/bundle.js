(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cell_1 = require("./Cell");
class Board {
    constructor(size) {
        this.Rows = size;
        this.Columns = size;
        this.Cells = new Map();
        //initialize cells
        for (var i = 0; i < this.Rows; i++) {
            for (var j = 0; j < this.Columns; j++) {
                var newCell = new Cell_1.Cell(`${i}_${j}`, i, j);
                this.Cells.set(newCell.Id, newCell);
            }
        }
    }
    UpdateInitialCells(cell) {
        cell.currentIsAlive = !cell.currentIsAlive;
        cell.nextIsAlive = cell.currentIsAlive;
        var cellElement = document.getElementById(cell.Id);
        if (cell.currentIsAlive) {
            cellElement.setAttribute('class', 'cell alive');
        }
        else {
            cellElement.setAttribute('class', 'cell');
        }
    }
    Setup() {
        //do things that only need to happen once here - like draw the board the first time (so we can let the draw function just update css classes), or build useful variables ahead of time
        var boardElement = document.getElementById('board');
        var boardSize = this.Rows * 10;
        boardElement.setAttribute('style', 'width:' + boardSize + 'px; height:' + boardSize + 'px;');
        var fragment = document.createDocumentFragment();
        this.Cells.forEach((value, key, map) => {
            var cellElement = document.createElement('div');
            cellElement.setAttribute('id', key);
            cellElement.setAttribute('class', 'cell');
            cellElement.innerText = '(' + value.X + ',' + value.Y + ')';
            fragment.appendChild(cellElement);
        });
        boardElement.appendChild(fragment);
    }
}
exports.Board = Board;
},{"./Cell":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cell {
    constructor(id, x, y) {
        this.currentIsAlive = false;
        this.nextIsAlive = false;
        this.liveNeighbors = 0;
        this.Id = id;
        this.X = x;
        this.Y = y;
    }
    Next() {
        if (this.currentIsAlive) {
            //if alive, and fewer than 2 neighbors, cell dies
            //if alive with two or three live neighbors -> stays alive
            //if alive with more than three live neighbors -> dies
            if (this.liveNeighbors < 2 || this.liveNeighbors > 3) {
                this.nextIsAlive = !this.currentIsAlive;
            }
            else {
                this.nextIsAlive = true;
            }
        }
        else {
            //any dead cell with exactly three live neighbors becomes alive
            if (this.liveNeighbors === 3) {
                this.nextIsAlive = !this.currentIsAlive;
            }
        }
        this.liveNeighbors = 0;
    }
}
exports.Cell = Cell;
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Board_1 = require("./Board");
class Game {
    constructor(boardSize) {
        this.generation = 0;
        //http://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
        this.lastFrameTimeMs = 0;
        this.maxFPS = 60;
        this.fps = 60;
        this.delta = 0;
        this.timestep = 1000 / 60;
        this.framesThisSecond = 0;
        this.lastFpsUpdate = 0;
        this.running = false;
        this.started = false;
        this.frameID = 0;
        this.MainLoop = (timestamp) => {
            // Throttle the frame rate.
            // console.log('mainloop', this.lastFrameTimeMs);
            if (timestamp < this.lastFrameTimeMs + (1000 / this.maxFPS)) {
                this.frameID = requestAnimationFrame(this.MainLoop);
                return;
            }
            this.delta += timestamp - this.lastFrameTimeMs;
            this.lastFrameTimeMs = timestamp;
            this.Begin(timestamp, this.delta);
            if (timestamp > this.lastFpsUpdate + 1000) {
                this.fps = 0.25 * this.framesThisSecond + 0.75 * this.fps;
                this.lastFpsUpdate = timestamp;
                this.framesThisSecond = 0;
            }
            this.framesThisSecond++;
            var numUpdateSteps = 0;
            while (this.delta >= this.timestep) {
                this.Update(this.timestep);
                this.delta -= this.timestep;
                if (++numUpdateSteps >= 240) {
                    this.Panic();
                    break;
                }
            }
            this.Draw(this.delta / this.timestep);
            this.End(this.fps);
            this.frameID = requestAnimationFrame(this.MainLoop);
        };
        this.Begin = (timestamp, delta) => {
            //processing input before the updates run
            // console.log('begin', this.fps);
        };
        this.Update = (delta) => {
            //update variables
            // console.log('update', this.fps);
            this.changedCells = new Map();
            var aliveCellElements = document.getElementsByClassName('cell alive');
            this.liveCells = aliveCellElements.length;
            if (aliveCellElements.length > 500) {
                this.Board.Cells.forEach((value, key, map) => {
                    this.GetNeighbors(value);
                    value.Next();
                    if (value.currentIsAlive !== value.nextIsAlive) {
                        this.changedCells.set(value.Id, value);
                    }
                });
            }
            else {
                for (var i = 0; i < aliveCellElements.length; i++) {
                    var cell = this.Board.Cells.get(aliveCellElements[i].id);
                    var neighbors = this.GetNeighbors(cell);
                    neighbors.forEach((value, key, map) => {
                        this.GetNeighbors(value);
                        value.Next();
                        if (value.currentIsAlive !== value.nextIsAlive) {
                            if (!this.changedCells.has(value.Id)) {
                                this.changedCells.set(value.Id, value);
                            }
                        }
                    });
                    cell.Next();
                    if (cell.currentIsAlive !== cell.nextIsAlive) {
                        if (!this.changedCells.has(cell.Id)) {
                            this.changedCells.set(cell.Id, cell);
                        }
                    }
                }
            }
        };
        this.Panic = () => {
            //If a player drifts too far away from the authoritative state, as would be the case in a panic, then the player needs to be snapped back to the authoritative state.
            // console.log('panic', this.fps);
            this.delta = 0;
        };
        this.Draw = (interp) => {
            //update the visualization
            // console.log('draw', this.fps);
            this.generation++;
            document.getElementById('fps').innerText = 'FPS: ' + this.fps;
            document.getElementById('generation').innerText = 'Generation: ' + this.generation;
            document.getElementById('liveCells').innerText = 'Live Cells: ' + this.liveCells + ' of ' + this.Board.Cells.size;
            this.changedCells.forEach((value, key, map) => {
                if (value.currentIsAlive === value.nextIsAlive) {
                    return;
                }
                var cellElement = document.getElementById(value.Id);
                if (value.nextIsAlive) {
                    cellElement.setAttribute('class', 'cell alive');
                }
                else {
                    cellElement.setAttribute('class', 'cell');
                }
                value.currentIsAlive = value.nextIsAlive;
            });
        };
        this.End = (fps) => {
            //incrementally performing long-running updates that aren't time-sensitive, as well as for adjusting to changes in FPS
            // console.log('end', this.fps);
        };
        this.Board = new Board_1.Board(boardSize);
        this.boardElement = document.getElementById('board');
    }
    Start() {
        if (!this.started) {
            this.started = true;
            this.changedCells = this.Board.Cells;
            this.frameID = requestAnimationFrame(timestamp => {
                this.Draw(1);
                this.running = true;
                this.lastFrameTimeMs = timestamp;
                this.lastFpsUpdate = timestamp;
                this.framesThisSecond = 0;
                this.frameID = requestAnimationFrame(this.MainLoop);
            });
        }
    }
    Stop() {
        this.running = false;
        this.started = false;
        this.generation = 0;
        cancelAnimationFrame(this.frameID);
    }
    GetNeighbors(cell) {
        var neighbors = new Map();
        var x = cell.X;
        var minusX = cell.X - 1;
        var plusX = cell.X + 1;
        var y = cell.Y;
        var minusY = cell.Y - 1;
        var plusY = cell.Y + 1;
        var neighborCount = 0;
        if (minusX >= 0 && minusY >= 0) {
            var upperLeft = this.Board.Cells.get(minusX + '_' + minusY);
            if (upperLeft.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upperLeft.Id, upperLeft);
        }
        if (minusY >= 0) {
            var upper = this.Board.Cells.get(x + '_' + minusY);
            if (upper.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upper.Id, upper);
        }
        if (plusX < this.Board.Rows && minusY >= 0) {
            var upperRight = this.Board.Cells.get(plusX + '_' + minusY);
            if (upperRight.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upperRight.Id, upperRight);
        }
        if (minusX >= 0) {
            var left = this.Board.Cells.get(minusX + '_' + y);
            if (left.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(left.Id, left);
        }
        if (plusX < this.Board.Rows) {
            var right = this.Board.Cells.get(plusX + '_' + y);
            if (right.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(right.Id, right);
        }
        if (minusX >= 0 && plusY < this.Board.Columns) {
            var lowerLeft = this.Board.Cells.get(minusX + '_' + plusY);
            if (lowerLeft.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lowerLeft.Id, lowerLeft);
        }
        if (plusY < this.Board.Columns) {
            var lower = this.Board.Cells.get(x + '_' + plusY);
            if (lower.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lower.Id, lower);
        }
        if (plusX < this.Board.Rows && plusY < this.Board.Columns) {
            var lowerRight = this.Board.Cells.get(plusX + '_' + plusY);
            if (lowerRight.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lowerRight.Id, lowerRight);
        }
        cell.liveNeighbors = neighborCount;
        return neighbors;
    }
}
exports.Game = Game;
},{"./Board":1}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Game_1 = require("./Models/Game");
class Main {
    constructor() {
        this.bindBoardEvents = () => {
            var classname = document.getElementsByClassName("cell");
            for (var i = 0; i < classname.length; i++) {
                classname[i].addEventListener('click', (e) => {
                    if (!this.game.started) {
                        var id = e.srcElement.getAttribute("id");
                        var cell = this.game.Board.Cells.get(id);
                        this.game.Board.UpdateInitialCells(cell);
                    }
                }, false);
            }
        };
    }
    Run() {
        this.SetupGame();
        this.bindPageEvents();
    }
    SetupGame() {
        this.boardSize = parseInt(document.getElementById('boardSize').value, 10);
        this.game = new Game_1.Game(this.boardSize);
        this.game.Board.Setup();
        this.bindBoardEvents();
    }
    bindPageEvents() {
        document.getElementById('start').addEventListener('click', (e) => {
            document.getElementById('start').setAttribute('disabled', 'disabled');
            document.getElementById('stop').removeAttribute('disabled');
            this.game.Start();
        });
        document.getElementById('stop').addEventListener('click', (e) => {
            document.getElementById('stop').setAttribute('disabled', 'disabled');
            document.getElementById('start').removeAttribute('disabled');
            this.game.Stop();
        });
        document.getElementById('random').addEventListener('click', (e) => {
            document.getElementById('stop').setAttribute('disabled', 'disabled');
            document.getElementById('start').removeAttribute('disabled');
            this.game.Stop();
            var boardElement = document.getElementById("board");
            while (boardElement.firstChild) {
                boardElement.removeChild(boardElement.firstChild);
            }
            this.SetupGame();
            var density = parseFloat(document.getElementById('density').value);
            for (var i = 0; i < this.game.Board.Rows; i++) {
                for (var j = 0; j < this.game.Board.Columns; j++) {
                    if (Math.random() <= density) {
                        var tmp = this.game.Board.Cells.get(`${i}_${j}`);
                        this.game.Board.UpdateInitialCells(tmp);
                    }
                }
            }
        });
        document.getElementById('updateBoardSize').addEventListener('click', (e) => {
            document.getElementById('stop').setAttribute('disabled', 'disabled');
            document.getElementById('start').removeAttribute('disabled');
            this.game.Stop();
            var boardElement = document.getElementById("board");
            while (boardElement.firstChild) {
                boardElement.removeChild(boardElement.firstChild);
            }
            this.SetupGame();
        });
    }
}
exports.Main = Main;
var main = new Main();
main.Run();
},{"./Models/Game":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvTW9kZWxzL0JvYXJkLnRzIiwic3JjL01vZGVscy9DZWxsLnRzIiwic3JjL01vZGVscy9HYW1lLnRzIiwic3JjL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBLGlDQUE4QjtBQUU5QjtJQUNJLFlBQVksSUFBWTtRQUNwQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxFQUFnQixDQUFDO1FBRXJDLGtCQUFrQjtRQUNsQixHQUFHLENBQUEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUNoQyxHQUFHLENBQUEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDbkMsSUFBSSxPQUFPLEdBQUcsSUFBSSxXQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3hDLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVNLGtCQUFrQixDQUFDLElBQVU7UUFDaEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUM7UUFDM0MsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQ3ZDLElBQUksV0FBVyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUUs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LEVBQUUsQ0FBQSxDQUFDLE1BQU0sSUFBSSxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDNUQsRUFBRSxDQUFBLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQzFCLGFBQWEsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDM0MsQ0FBQztRQUVELEVBQUUsQ0FBQSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2IsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7WUFDbkQsRUFBRSxDQUFBLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RCLGFBQWEsRUFBRSxDQUFDO1lBQ3BCLENBQUM7WUFDRCxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELEVBQUUsQ0FBQSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQztZQUM1RCxFQUFFLENBQUEsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsYUFBYSxFQUFFLENBQUM7WUFDcEIsQ0FBQztZQUNELFNBQVMsQ0FB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VUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3JFLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRTdELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFakIsSUFBSSxZQUFZLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNwRCxPQUFPLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDN0IsWUFBWSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEQsQ0FBQztZQUVELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FlSjtBQS9FRCxvQkErRUM7QUFFRCxJQUFJLElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQ3RCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgeyBDZWxsIH0gZnJvbSAnLi9DZWxsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBCb2FyZCB7XHJcbiAgICBjb25zdHJ1Y3RvcihzaXplOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLlJvd3MgPSBzaXplO1xyXG4gICAgICAgIHRoaXMuQ29sdW1ucyA9IHNpemU7XHJcbiAgICAgICAgdGhpcy5DZWxscyA9IG5ldyBNYXA8c3RyaW5nLCBDZWxsPigpO1xyXG5cclxuICAgICAgICAvL2luaXRpYWxpemUgY2VsbHNcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5Sb3dzOyBpKyspIHtcclxuICAgICAgICAgICAgZm9yKHZhciBqID0gMDsgaiA8IHRoaXMuQ29sdW1uczsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3Q2VsbCA9IG5ldyBDZWxsKGAke2l9XyR7an1gLCBpLCBqKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuQ2VsbHMuc2V0KG5ld0NlbGwuSWQsIG5ld0NlbGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBVcGRhdGVJbml0aWFsQ2VsbHMoY2VsbDogQ2VsbCkge1xyXG4gICAgICAgIGNlbGwuY3VycmVudElzQWxpdmUgPSAhY2VsbC5jdXJyZW50SXNBbGl2ZTtcclxuICAgICAgICBjZWxsLm5leHRJc0FsaXZlID0gY2VsbC5jdXJyZW50SXNBbGl2ZTtcclxuICAgICAgICB2YXIgY2VsbEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjZWxsLklkKTtcclxuICAgICAgICBpZihjZWxsLmN1cnJlbnRJc0FsaXZlKSB7XHJcbiAgICAgICAgICAgIGNlbGxFbGVtZW50LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2VsbCBhbGl2ZScpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNlbGxFbGVtZW50LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2VsbCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgUm93czogbnVtYmVyO1xyXG4gICAgcHVibGljIENvbHVtbnM6IG51bWJlcjtcclxuICAgIHB1YmxpYyBDZWxsczogTWFwPHN0cmluZywgQ2VsbD47XHJcblxyXG4gICAgcHVibGljIFNldHVwKCkge1xyXG4gICAgICAgIC8vZG8gdGhpbmdzIHRoYXQgb25seSBuZWVkIHRvIGhhcHBlbiBvbmNlIGhlcmUgLSBsaWtlIGRyYXcgdGhlIGJvYXJkIHRoZSBmaXJzdCB0aW1lIChzbyB3ZSBjYW4gbGV0IHRoZSBkcmF3IGZ1bmN0aW9uIGp1c3QgdXBkYXRlIGNzcyBjbGFzc2VzKSwgb3IgYnVpbGQgdXNlZnVsIHZhcmlhYmxlcyBhaGVhZCBvZiB0aW1lXHJcbiAgICAgICAgdmFyIGJvYXJkRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib2FyZCcpO1xyXG4gICAgICAgIHZhciBib2FyZFNpemUgPSB0aGlzLlJvd3MgKiAxMDtcclxuICAgICAgICBib2FyZEVsZW1lbnQuc2V0QXR0cmlidXRlKCdzdHlsZScsICd3aWR0aDonKyBib2FyZFNpemUgICsgJ3B4OyBoZWlnaHQ6JyArIGJvYXJkU2l6ZSArICdweDsnKTtcclxuICAgICAgICB2YXIgZnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICAgICAgdGhpcy5DZWxscy5mb3JFYWNoKCh2YWx1ZSwga2V5LCBtYXApID0+IHtcclxuICAgICAgICAgICAgdmFyIGNlbGxFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIGNlbGxFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBrZXkpXHJcbiAgICAgICAgICAgIGNlbGxFbGVtZW50LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2VsbCcpO1xyXG4gICAgICAgICAgICBjZWxsRWxlbWVudC5pbm5lclRleHQgPSAnKCcgKyB2YWx1ZS5YICsgJywnICsgdmFsdWUuWSArICcpJztcclxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoY2VsbEVsZW1lbnQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGJvYXJkRWxlbWVudC5hcHBlbmRDaGlsZChmcmFnbWVudCk7XHJcbiAgICB9ICAgIFxyXG59IiwiZXhwb3J0IGNsYXNzIENlbGwge1xyXG4gICAgY29uc3RydWN0b3IoaWQ6IHN0cmluZywgeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLklkID0gaWQ7XHJcbiAgICAgICAgdGhpcy5YID0geDtcclxuICAgICAgICB0aGlzLlkgPSB5O1xyXG4gICAgfVxyXG4gICAgcHVibGljIElkOiBzdHJpbmc7XHJcbiAgICBwdWJsaWMgWDogbnVtYmVyO1xyXG4gICAgcHVibGljIFk6IG51bWJlcjtcclxuICAgIHB1YmxpYyBjdXJyZW50SXNBbGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHVibGljIG5leHRJc0FsaXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgbGl2ZU5laWdoYm9yczogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBOZXh0KCkge1xyXG4gICAgICAgIGlmKHRoaXMuY3VycmVudElzQWxpdmUpIHtcclxuICAgICAgICAgICAgLy9pZiBhbGl2ZSwgYW5kIGZld2VyIHRoYW4gMiBuZWlnaGJvcnMsIGNlbGwgZGllc1xyXG4gICAgICAgICAgICAvL2lmIGFsaXZlIHdpdGggdHdvIG9yIHRocmVlIGxpdmUgbmVpZ2hib3JzIC0+IHN0YXlzIGFsaXZlXHJcbiAgICAgICAgICAgIC8vaWYgYWxpdmUgd2l0aCBtb3JlIHRoYW4gdGhyZWUgbGl2ZSBuZWlnaGJvcnMgLT4gZGllc1xyXG4gICAgICAgICAgICBpZih0aGlzLmxpdmVOZWlnaGJvcnMgPCAyIHx8IHRoaXMubGl2ZU5laWdoYm9ycyA+IDMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dElzQWxpdmUgPSAhdGhpcy5jdXJyZW50SXNBbGl2ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubmV4dElzQWxpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9hbnkgZGVhZCBjZWxsIHdpdGggZXhhY3RseSB0aHJlZSBsaXZlIG5laWdoYm9ycyBiZWNvbWVzIGFsaXZlXHJcbiAgICAgICAgICAgIGlmKHRoaXMubGl2ZU5laWdoYm9ycyA9PT0gMykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5uZXh0SXNBbGl2ZSA9ICF0aGlzLmN1cnJlbnRJc0FsaXZlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGl2ZU5laWdoYm9ycyA9IDA7XHJcbiAgICB9XHJcbn0iLCJpbXBvcnQgeyBCb2FyZCB9IGZyb20gJy4vQm9hcmQnO1xyXG5pbXBvcnQgeyBDZWxsIH0gZnJvbSAnLi9DZWxsJztcclxuXHJcbmV4cG9ydCBjbGFzcyBHYW1lIHtcclxuICAgIGNvbnN0cnVjdG9yKGJvYXJkU2l6ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy5Cb2FyZCA9IG5ldyBCb2FyZChib2FyZFNpemUpO1xyXG4gICAgICAgIHRoaXMuYm9hcmRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JvYXJkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIEJvYXJkOiBCb2FyZDtcclxuICAgIHB1YmxpYyBib2FyZEVsZW1lbnQ6IEhUTUxFbGVtZW50O1xyXG4gICAgcHVibGljIGdlbmVyYXRpb246IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgYm9hcmRTaXplOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgY2hhbmdlZENlbGxzOiBNYXA8c3RyaW5nLCBDZWxsPjtcclxuICAgIHB1YmxpYyBsaXZlQ2VsbHM6IG51bWJlcjtcclxuXHJcbiAgICAvL2h0dHA6Ly9pc2FhY3N1a2luLmNvbS9uZXdzLzIwMTUvMDEvZGV0YWlsZWQtZXhwbGFuYXRpb24tamF2YXNjcmlwdC1nYW1lLWxvb3BzLWFuZC10aW1pbmdcclxuICAgIHB1YmxpYyBsYXN0RnJhbWVUaW1lTXM6IG51bWJlciA9IDA7XHJcbiAgICBwdWJsaWMgbWF4RlBTOiBudW1iZXIgPSA2MDtcclxuICAgIHB1YmxpYyBmcHM6IG51bWJlciA9IDYwO1xyXG4gICAgcHVibGljIGRlbHRhOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHRpbWVzdGVwOiBudW1iZXIgPSAxMDAwIC8gNjA7XHJcbiAgICBwdWJsaWMgZnJhbWVzVGhpc1NlY29uZDogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBsYXN0RnBzVXBkYXRlOiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHJ1bm5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHB1YmxpYyBzdGFydGVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwdWJsaWMgZnJhbWVJRDogbnVtYmVyID0gMDtcclxuXHJcbiAgICBwdWJsaWMgU3RhcnQoKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VkQ2VsbHMgPSB0aGlzLkJvYXJkLkNlbGxzO1xyXG4gICAgICAgICAgICB0aGlzLmZyYW1lSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGltZXN0YW1wID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuRHJhdygxKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RGcmFtZVRpbWVNcyA9IHRpbWVzdGFtcDtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdEZwc1VwZGF0ZSA9IHRpbWVzdGFtcDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZnJhbWVzVGhpc1NlY29uZCA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZyYW1lSUQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5NYWluTG9vcCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgU3RvcCgpIHtcclxuICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnN0YXJ0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmdlbmVyYXRpb24gPSAwO1xyXG4gICAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuZnJhbWVJRCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIE1haW5Mb29wID0gKHRpbWVzdGFtcDogbnVtYmVyKSA9PiB7XHJcbiAgICAgICAgLy8gVGhyb3R0bGUgdGhlIGZyYW1lIHJhdGUuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ21haW5sb29wJywgdGhpcy5sYXN0RnJhbWVUaW1lTXMpO1xyXG4gICAgICAgIGlmICh0aW1lc3RhbXAgPCB0aGlzLmxhc3RGcmFtZVRpbWVNcyArICgxMDAwIC8gdGhpcy5tYXhGUFMpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnJhbWVJRCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLk1haW5Mb29wKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRlbHRhICs9IHRpbWVzdGFtcCAtIHRoaXMubGFzdEZyYW1lVGltZU1zO1xyXG4gICAgICAgIHRoaXMubGFzdEZyYW1lVGltZU1zID0gdGltZXN0YW1wO1xyXG5cclxuICAgICAgICB0aGlzLkJlZ2luKHRpbWVzdGFtcCwgdGhpcy5kZWx0YSk7XHJcblxyXG4gICAgICAgIGlmICh0aW1lc3RhbXAgPiB0aGlzLmxhc3RGcHNVcGRhdGUgKyAxMDAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZnBzID0gMC4yNSAqIHRoaXMuZnJhbWVzVGhpc1NlY29uZCArIDAuNzUgKiB0aGlzLmZwcztcclxuXHJcbiAgICAgICAgICAgIHRoaXMubGFzdEZwc1VwZGF0ZSA9IHRpbWVzdGFtcDtcclxuICAgICAgICAgICAgdGhpcy5mcmFtZXNUaGlzU2Vjb25kID0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5mcmFtZXNUaGlzU2Vjb25kKys7XHJcblxyXG4gICAgICAgIHZhciBudW1VcGRhdGVTdGVwcyA9IDA7XHJcbiAgICAgICAgd2hpbGUgKHRoaXMuZGVsdGEgPj0gdGhpcy50aW1lc3RlcCkge1xyXG4gICAgICAgICAgICB0aGlzLlVwZGF0ZSh0aGlzLnRpbWVzdGVwKTtcclxuICAgICAgICAgICAgdGhpcy5kZWx0YSAtPSB0aGlzLnRpbWVzdGVwO1xyXG4gICAgICAgICAgICBpZiAoKytudW1VcGRhdGVTdGVwcyA+PSAyNDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuUGFuaWMoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLkRyYXcodGhpcy5kZWx0YSAvIHRoaXMudGltZXN0ZXApO1xyXG5cclxuICAgICAgICB0aGlzLkVuZCh0aGlzLmZwcyk7XHJcblxyXG4gICAgICAgIHRoaXMuZnJhbWVJRCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLk1haW5Mb29wKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgQmVnaW4gPSAodGltZXN0YW1wOiBudW1iZXIsIGRlbHRhOiBudW1iZXIpID0+IHtcclxuICAgICAgICAvL3Byb2Nlc3NpbmcgaW5wdXQgYmVmb3JlIHRoZSB1cGRhdGVzIHJ1blxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdiZWdpbicsIHRoaXMuZnBzKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgR2V0TmVpZ2hib3JzKGNlbGw6IENlbGwpOiBNYXA8c3RyaW5nLCBDZWxsPiB7XHJcbiAgICAgICAgdmFyIG5laWdoYm9ycyA9IG5ldyBNYXA8c3RyaW5nLCBDZWxsPigpO1xyXG4gICAgICAgIHZhciB4ID0gY2VsbC5YO1xyXG4gICAgICAgIHZhciBtaW51c1ggPSBjZWxsLlggLSAxO1xyXG4gICAgICAgIHZhciBwbHVzWCA9IGNlbGwuWCArIDE7XHJcblxyXG4gICAgICAgIHZhciB5ID0gY2VsbC5ZO1xyXG4gICAgICAgIHZhciBtaW51c1kgPSBjZWxsLlkgLSAxO1xyXG4gICAgICAgIHZhciBwbHVzWSAgPSBjZWxsLlkgKyAxO1xyXG5cclxuICAgICAgICB2YXIgbmVpZ2hib3JDb3VudCA9IDA7XHJcbiAgICAgICAgaWYobWludXNYID49IDAgJiYgbWludXNZID49IDApIHtcclxuICAgICAgICAgICAgdmFyIHVwcGVyTGVmdCA9IHRoaXMuQm9hcmQuQ2VsbHMuZ2V0KG1pbnVzWCArICdfJyArIG1pbnVzWSk7XHJcbiAgICAgICAgICAgIGlmKHVwcGVyTGVmdC5jdXJyZW50SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3JDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5laWdoYm9ycy5zZXQodXBwZXJMZWZ0LklkLCB1cHBlckxlZnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYobWludXNZID49IDApIHtcclxuICAgICAgICAgICAgdmFyIHVwcGVyID0gdGhpcy5Cb2FyZC5DZWxscy5nZXQoeCArICdfJyArIG1pbnVzWSk7XHJcbiAgICAgICAgICAgIGlmKHVwcGVyLmN1cnJlbnRJc0FsaXZlKSB7XHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvckNvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmVpZ2hib3JzLnNldCh1cHBlci5JZCwgdXBwZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYocGx1c1ggPCB0aGlzLkJvYXJkLlJvd3MgJiYgbWludXNZID49IDApIHtcclxuICAgICAgICAgICAgdmFyIHVwcGVyUmlnaHQgPSB0aGlzLkJvYXJkLkNlbGxzLmdldChwbHVzWCArICdfJyArIG1pbnVzWSk7XHJcbiAgICAgICAgICAgIGlmKHVwcGVyUmlnaHQuY3VycmVudElzQWxpdmUpIHtcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yQ291bnQrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZWlnaGJvcnMuc2V0KHVwcGVyUmlnaHQuSWQsIHVwcGVyUmlnaHQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYobWludXNYID49IDApIHtcclxuICAgICAgICAgICAgdmFyIGxlZnQgPSB0aGlzLkJvYXJkLkNlbGxzLmdldChtaW51c1ggKyAnXycgKyB5KTtcclxuICAgICAgICAgICAgaWYobGVmdC5jdXJyZW50SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3JDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5laWdoYm9ycy5zZXQobGVmdC5JZCwgbGVmdCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihwbHVzWCA8IHRoaXMuQm9hcmQuUm93cykge1xyXG4gICAgICAgICAgICB2YXIgcmlnaHQgPSB0aGlzLkJvYXJkLkNlbGxzLmdldChwbHVzWCArICdfJyArIHkpO1xyXG4gICAgICAgICAgICBpZihyaWdodC5jdXJyZW50SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3JDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5laWdoYm9ycy5zZXQocmlnaHQuSWQsIHJpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKG1pbnVzWCA+PSAwICYmIHBsdXNZIDwgdGhpcy5Cb2FyZC5Db2x1bW5zKSB7XHJcbiAgICAgICAgICAgIHZhciBsb3dlckxlZnQgPSB0aGlzLkJvYXJkLkNlbGxzLmdldChtaW51c1ggKyAnXycgKyBwbHVzWSk7XHJcbiAgICAgICAgICAgIGlmKGxvd2VyTGVmdC5jdXJyZW50SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3JDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG5laWdoYm9ycy5zZXQobG93ZXJMZWZ0LklkLCBsb3dlckxlZnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYocGx1c1kgPCB0aGlzLkJvYXJkLkNvbHVtbnMpIHtcclxuICAgICAgICAgICAgdmFyIGxvd2VyID0gdGhpcy5Cb2FyZC5DZWxscy5nZXQoeCArICdfJyArIHBsdXNZKTtcclxuICAgICAgICAgICAgaWYobG93ZXIuY3VycmVudElzQWxpdmUpIHtcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yQ291bnQrKztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBuZWlnaGJvcnMuc2V0KGxvd2VyLklkLCBsb3dlcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihwbHVzWCA8IHRoaXMuQm9hcmQuUm93cyAmJiBwbHVzWSA8IHRoaXMuQm9hcmQuQ29sdW1ucykge1xyXG4gICAgICAgICAgICB2YXIgbG93ZXJSaWdodCA9IHRoaXMuQm9hcmQuQ2VsbHMuZ2V0KHBsdXNYICsgJ18nICsgcGx1c1kpO1xyXG4gICAgICAgICAgICBpZihsb3dlclJpZ2h0LmN1cnJlbnRJc0FsaXZlKSB7XHJcbiAgICAgICAgICAgICAgICBuZWlnaGJvckNvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmVpZ2hib3JzLnNldChsb3dlclJpZ2h0LklkLCBsb3dlclJpZ2h0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNlbGwubGl2ZU5laWdoYm9ycyA9IG5laWdoYm9yQ291bnQ7XHJcbiAgICAgICAgcmV0dXJuIG5laWdoYm9ycztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgVXBkYXRlID0gKGRlbHRhOiBudW1iZXIpID0+IHtcclxuICAgICAgICAvL3VwZGF0ZSB2YXJpYWJsZXNcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygndXBkYXRlJywgdGhpcy5mcHMpO1xyXG5cclxuICAgICAgICB0aGlzLmNoYW5nZWRDZWxscyA9IG5ldyBNYXA8c3RyaW5nLCBDZWxsPigpO1xyXG4gICAgICAgIHZhciBhbGl2ZUNlbGxFbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NlbGwgYWxpdmUnKTtcclxuICAgICAgICB0aGlzLmxpdmVDZWxscyA9IGFsaXZlQ2VsbEVsZW1lbnRzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgaWYoYWxpdmVDZWxsRWxlbWVudHMubGVuZ3RoID4gNTAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuQm9hcmQuQ2VsbHMuZm9yRWFjaCgodmFsdWUsIGtleSwgbWFwKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLkdldE5laWdoYm9ycyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS5OZXh0KCk7XHJcbiAgICAgICAgICAgICAgICBpZih2YWx1ZS5jdXJyZW50SXNBbGl2ZSAhPT0gdmFsdWUubmV4dElzQWxpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZWRDZWxscy5zZXQodmFsdWUuSWQsIHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGFsaXZlQ2VsbEVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuQm9hcmQuQ2VsbHMuZ2V0KGFsaXZlQ2VsbEVsZW1lbnRzW2ldLmlkKTtcclxuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvcnMgPSB0aGlzLkdldE5laWdoYm9ycyhjZWxsKTtcclxuICAgICAgICAgICAgICAgIG5laWdoYm9ycy5mb3JFYWNoKCh2YWx1ZSwga2V5LCBtYXApID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLkdldE5laWdoYm9ycyh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUuTmV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHZhbHVlLmN1cnJlbnRJc0FsaXZlICE9PSB2YWx1ZS5uZXh0SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighdGhpcy5jaGFuZ2VkQ2VsbHMuaGFzKHZhbHVlLklkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VkQ2VsbHMuc2V0KHZhbHVlLklkLCB2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgY2VsbC5OZXh0KCk7XHJcbiAgICAgICAgICAgICAgICBpZihjZWxsLmN1cnJlbnRJc0FsaXZlICE9PSBjZWxsLm5leHRJc0FsaXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIXRoaXMuY2hhbmdlZENlbGxzLmhhcyhjZWxsLklkKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZWRDZWxscy5zZXQoY2VsbC5JZCwgY2VsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBQYW5pYyA9ICgpID0+IHtcclxuICAgICAgICAvL0lmIGEgcGxheWVyIGRyaWZ0cyB0b28gZmFyIGF3YXkgZnJvbSB0aGUgYXV0aG9yaXRhdGl2ZSBzdGF0ZSwgYXMgd291bGQgYmUgdGhlIGNhc2UgaW4gYSBwYW5pYywgdGhlbiB0aGUgcGxheWVyIG5lZWRzIHRvIGJlIHNuYXBwZWQgYmFjayB0byB0aGUgYXV0aG9yaXRhdGl2ZSBzdGF0ZS5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncGFuaWMnLCB0aGlzLmZwcyk7XHJcbiAgICAgICAgdGhpcy5kZWx0YSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIERyYXcgPSAoaW50ZXJwOiBudW1iZXIpID0+IHtcclxuICAgICAgICAvL3VwZGF0ZSB0aGUgdmlzdWFsaXphdGlvblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdkcmF3JywgdGhpcy5mcHMpO1xyXG4gICAgICAgIHRoaXMuZ2VuZXJhdGlvbisrO1xyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmcHMnKS5pbm5lclRleHQgPSAnRlBTOiAnICsgdGhpcy5mcHM7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dlbmVyYXRpb24nKS5pbm5lclRleHQgPSAnR2VuZXJhdGlvbjogJyArIHRoaXMuZ2VuZXJhdGlvbjtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGl2ZUNlbGxzJykuaW5uZXJUZXh0ID0gJ0xpdmUgQ2VsbHM6ICcgKyB0aGlzLmxpdmVDZWxscyArICcgb2YgJyArIHRoaXMuQm9hcmQuQ2VsbHMuc2l6ZTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGFuZ2VkQ2VsbHMuZm9yRWFjaCgodmFsdWUsIGtleSwgbWFwKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHZhbHVlLmN1cnJlbnRJc0FsaXZlID09PSB2YWx1ZS5uZXh0SXNBbGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBjZWxsRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHZhbHVlLklkKTtcclxuICAgICAgICAgICAgaWYodmFsdWUubmV4dElzQWxpdmUpIHtcclxuICAgICAgICAgICAgICAgIGNlbGxFbGVtZW50LnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnY2VsbCBhbGl2ZScpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY2VsbEVsZW1lbnQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdjZWxsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFsdWUuY3VycmVudElzQWxpdmUgPSB2YWx1ZS5uZXh0SXNBbGl2ZTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBFbmQgPSAoZnBzOiBudW1iZXIpID0+IHtcclxuICAgICAgICAvL2luY3JlbWVudGFsbHkgcGVyZm9ybWluZyBsb25nLXJ1bm5pbmcgdXBkYXRlcyB0aGF0IGFyZW4ndCB0aW1lLXNlbnNpdGl2ZSwgYXMgd2VsbCBhcyBmb3IgYWRqdXN0aW5nIHRvIGNoYW5nZXMgaW4gRlBTXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ2VuZCcsIHRoaXMuZnBzKTtcclxuICAgIH1cclxufSIsImltcG9ydCB7IEdhbWUgfSBmcm9tICcuL01vZGVscy9HYW1lJztcclxuXHJcbmV4cG9ydCBjbGFzcyBNYWluIHtcclxuICAgIHB1YmxpYyBib2FyZFNpemU6IG51bWJlcjtcclxuICAgIHB1YmxpYyBnYW1lOiBHYW1lO1xyXG4gICAgcHVibGljIFJ1bigpIHtcclxuICAgICAgICB0aGlzLlNldHVwR2FtZSgpO1xyXG4gICAgICAgIHRoaXMuYmluZFBhZ2VFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgU2V0dXBHYW1lKCkge1xyXG4gICAgICAgIHRoaXMuYm9hcmRTaXplID0gcGFyc2VJbnQoKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib2FyZFNpemUnKSkudmFsdWUsIDEwKTtcclxuICAgICAgICB0aGlzLmdhbWUgPSBuZXcgR2FtZSh0aGlzLmJvYXJkU2l6ZSk7XHJcbiAgICAgICAgdGhpcy5nYW1lLkJvYXJkLlNldHVwKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kQm9hcmRFdmVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmluZFBhZ2VFdmVudHMoKSB7XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZTogRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0Jykuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RvcCcpLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgdGhpcy5nYW1lLlN0YXJ0KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdG9wJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZTogRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0b3AnKS5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydCcpLnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgdGhpcy5nYW1lLlN0b3AoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JhbmRvbScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGU6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdG9wJykuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhcnQnKS5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdhbWUuU3RvcCgpO1xyXG5cclxuICAgICAgICAgICAgdmFyIGJvYXJkRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYm9hcmRcIik7XHJcbiAgICAgICAgICAgIHdoaWxlIChib2FyZEVsZW1lbnQuZmlyc3RDaGlsZCkge1xyXG4gICAgICAgICAgICAgICAgYm9hcmRFbGVtZW50LnJlbW92ZUNoaWxkKGJvYXJkRWxlbWVudC5maXJzdENoaWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5TZXR1cEdhbWUoKTtcclxuICAgICAgICAgICAgdmFyIGRlbnNpdHkgPSBwYXJzZUZsb2F0KCg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVuc2l0eScpKS52YWx1ZSk7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpIDwgdGhpcy5nYW1lLkJvYXJkLlJvd3M7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBqPTA7IGogPCB0aGlzLmdhbWUuQm9hcmQuQ29sdW1uczsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoTWF0aC5yYW5kb20oKSA8PSBkZW5zaXR5KXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMuZ2FtZS5Cb2FyZC5DZWxscy5nZXQoYCR7aX1fJHtqfWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuQm9hcmQuVXBkYXRlSW5pdGlhbENlbGxzKHRtcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1cGRhdGVCb2FyZFNpemUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlOiBFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RvcCcpLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0JykucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nYW1lLlN0b3AoKTtcclxuXHJcbiAgICAgICAgICAgIHZhciBib2FyZEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImJvYXJkXCIpO1xyXG4gICAgICAgICAgICB3aGlsZSAoYm9hcmRFbGVtZW50LmZpcnN0Q2hpbGQpIHtcclxuICAgICAgICAgICAgICAgIGJvYXJkRWxlbWVudC5yZW1vdmVDaGlsZChib2FyZEVsZW1lbnQuZmlyc3RDaGlsZCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuU2V0dXBHYW1lKCk7XHJcbiAgICAgICAgfSk7ICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYmluZEJvYXJkRXZlbnRzID0gKCkgPT4ge1xyXG4gICAgICAgIHZhciBjbGFzc25hbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiY2VsbFwiKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc25hbWUubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY2xhc3NuYW1lW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGU6IEV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5nYW1lLnN0YXJ0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSBlLnNyY0VsZW1lbnQuZ2V0QXR0cmlidXRlKFwiaWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLmdhbWUuQm9hcmQuQ2VsbHMuZ2V0KGlkKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhbWUuQm9hcmQuVXBkYXRlSW5pdGlhbENlbGxzKGNlbGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG52YXIgbWFpbiA9IG5ldyBNYWluKCk7XHJcbm1haW4uUnVuKCk7Il19
