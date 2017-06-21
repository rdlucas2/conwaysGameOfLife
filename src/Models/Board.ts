import { Cell } from './Cell';

export class Board {
    constructor(size: number) {
        this.Rows = size;
        this.Columns = size;
        this.Cells = new Map<string, Cell>();

        //initialize cells
        for(var i = 0; i < this.Rows; i++) {
            for(var j = 0; j < this.Columns; j++) {
                var newCell = new Cell(`${i}_${j}`, i, j);
                this.Cells.set(newCell.Id, newCell);
            }
        }
    }

    public UpdateInitialCells(cell: Cell) {
        cell.currentIsAlive = !cell.currentIsAlive;
        cell.nextIsAlive = cell.currentIsAlive;
        var cellElement = document.getElementById(cell.Id);
        if(cell.currentIsAlive) {
            cellElement.setAttribute('class', 'cell alive');
        } else {
            cellElement.setAttribute('class', 'cell');
        }
    }

    public Rows: number;
    public Columns: number;
    public Cells: Map<string, Cell>;

    public Setup() {
        //do things that only need to happen once here - like draw the board the first time (so we can let the draw function just update css classes), or build useful variables ahead of time
        var boardElement = document.getElementById('board');
        var boardSize = this.Rows * 10;
        boardElement.setAttribute('style', 'width:'+ boardSize  + 'px; height:' + boardSize + 'px;');
        var fragment = document.createDocumentFragment();
        this.Cells.forEach((value, key, map) => {
            var cellElement = document.createElement('div');
            cellElement.setAttribute('id', key)
            cellElement.setAttribute('class', 'cell');
            cellElement.innerText = '(' + value.X + ',' + value.Y + ')';
            fragment.appendChild(cellElement);
        });
        boardElement.appendChild(fragment);
    }    
}