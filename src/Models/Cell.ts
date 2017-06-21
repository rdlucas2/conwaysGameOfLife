export class Cell {
    constructor(id: string, x: number, y: number) {
        this.Id = id;
        this.X = x;
        this.Y = y;
    }
    public Id: string;
    public X: number;
    public Y: number;
    public currentIsAlive: boolean = false;
    public nextIsAlive: boolean = false;
    public liveNeighbors: number = 0;
    public Next() {
        if(this.currentIsAlive) {
            //if alive, and fewer than 2 neighbors, cell dies
            //if alive with two or three live neighbors -> stays alive
            //if alive with more than three live neighbors -> dies
            if(this.liveNeighbors < 2 || this.liveNeighbors > 3) {
                this.nextIsAlive = !this.currentIsAlive;
            } else {
                this.nextIsAlive = true;
            }
        } else {
            //any dead cell with exactly three live neighbors becomes alive
            if(this.liveNeighbors === 3) {
                this.nextIsAlive = !this.currentIsAlive;
            }
        }
        this.liveNeighbors = 0;
    }
}