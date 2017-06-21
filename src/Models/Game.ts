import { Board } from './Board';
import { Cell } from './Cell';

export class Game {
    constructor(boardSize: number) {
        this.Board = new Board(boardSize);
        this.boardElement = document.getElementById('board');
    }

    public Board: Board;
    public boardElement: HTMLElement;
    public generation: number = 0;
    public boardSize: number;
    public changedCells: Map<string, Cell>;
    public liveCells: number;

    //http://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
    public lastFrameTimeMs: number = 0;
    public maxFPS: number = 60;
    public fps: number = 60;
    public delta: number = 0;
    public timestep: number = 1000 / 60;
    public framesThisSecond: number = 0;
    public lastFpsUpdate: number = 0;
    public running: boolean = false;
    public started: boolean = false;
    public frameID: number = 0;

    public Start() {
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

    public Stop() {
        this.running = false;
        this.started = false;
        this.generation = 0;
        cancelAnimationFrame(this.frameID);
    }

    public MainLoop = (timestamp: number) => {
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
    }

    public Begin = (timestamp: number, delta: number) => {
        //processing input before the updates run
        // console.log('begin', this.fps);
    }

    public GetNeighbors(cell: Cell): Map<string, Cell> {
        var neighbors = new Map<string, Cell>();
        var x = cell.X;
        var minusX = cell.X - 1;
        var plusX = cell.X + 1;

        var y = cell.Y;
        var minusY = cell.Y - 1;
        var plusY  = cell.Y + 1;

        var neighborCount = 0;
        if(minusX >= 0 && minusY >= 0) {
            var upperLeft = this.Board.Cells.get(minusX + '_' + minusY);
            if(upperLeft.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upperLeft.Id, upperLeft);
        }

        if(minusY >= 0) {
            var upper = this.Board.Cells.get(x + '_' + minusY);
            if(upper.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upper.Id, upper);
        }

        if(plusX < this.Board.Rows && minusY >= 0) {
            var upperRight = this.Board.Cells.get(plusX + '_' + minusY);
            if(upperRight.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(upperRight.Id, upperRight);
        }

        if(minusX >= 0) {
            var left = this.Board.Cells.get(minusX + '_' + y);
            if(left.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(left.Id, left);
        }

        if(plusX < this.Board.Rows) {
            var right = this.Board.Cells.get(plusX + '_' + y);
            if(right.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(right.Id, right);
        }

        if(minusX >= 0 && plusY < this.Board.Columns) {
            var lowerLeft = this.Board.Cells.get(minusX + '_' + plusY);
            if(lowerLeft.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lowerLeft.Id, lowerLeft);
        }

        if(plusY < this.Board.Columns) {
            var lower = this.Board.Cells.get(x + '_' + plusY);
            if(lower.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lower.Id, lower);
        }

        if(plusX < this.Board.Rows && plusY < this.Board.Columns) {
            var lowerRight = this.Board.Cells.get(plusX + '_' + plusY);
            if(lowerRight.currentIsAlive) {
                neighborCount++;
            }
            neighbors.set(lowerRight.Id, lowerRight);
        }

        cell.liveNeighbors = neighborCount;
        return neighbors;
    }

    public Update = (delta: number) => {
        //update variables
        // console.log('update', this.fps);

        this.changedCells = new Map<string, Cell>();
        var aliveCellElements = document.getElementsByClassName('cell alive');
        this.liveCells = aliveCellElements.length;

        if(aliveCellElements.length > 500) {
            this.Board.Cells.forEach((value, key, map) => {
                this.GetNeighbors(value);
                value.Next();
                if(value.currentIsAlive !== value.nextIsAlive) {
                    this.changedCells.set(value.Id, value);
                }
            });
        } else {
            for(var i = 0; i < aliveCellElements.length; i++) {
                var cell = this.Board.Cells.get(aliveCellElements[i].id);
                var neighbors = this.GetNeighbors(cell);
                neighbors.forEach((value, key, map) => {
                    this.GetNeighbors(value);
                    value.Next();
                    if(value.currentIsAlive !== value.nextIsAlive) {
                        if(!this.changedCells.has(value.Id)) {
                            this.changedCells.set(value.Id, value);
                        }
                    }
                })
                cell.Next();
                if(cell.currentIsAlive !== cell.nextIsAlive) {
                    if(!this.changedCells.has(cell.Id)) {
                        this.changedCells.set(cell.Id, cell);
                    }
                }
            }
        }
    }

    public Panic = () => {
        //If a player drifts too far away from the authoritative state, as would be the case in a panic, then the player needs to be snapped back to the authoritative state.
        // console.log('panic', this.fps);
        this.delta = 0;
    }

    public Draw = (interp: number) => {
        //update the visualization
        // console.log('draw', this.fps);
        this.generation++;
        document.getElementById('fps').innerText = 'FPS: ' + this.fps;
        document.getElementById('generation').innerText = 'Generation: ' + this.generation;
        document.getElementById('liveCells').innerText = 'Live Cells: ' + this.liveCells + ' of ' + this.Board.Cells.size;

        this.changedCells.forEach((value, key, map) => {
            if(value.currentIsAlive === value.nextIsAlive) {
                return;
            }
            var cellElement = document.getElementById(value.Id);
            if(value.nextIsAlive) {
                cellElement.setAttribute('class', 'cell alive');
            } else {
                cellElement.setAttribute('class', 'cell');
            }
            value.currentIsAlive = value.nextIsAlive;
        })
    }

    public End = (fps: number) => {
        //incrementally performing long-running updates that aren't time-sensitive, as well as for adjusting to changes in FPS
        // console.log('end', this.fps);
    }
}