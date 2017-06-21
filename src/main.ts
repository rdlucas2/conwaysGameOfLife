import { Game } from './Models/Game';

export class Main {
    public boardSize: number;
    public game: Game;
    public Run() {
        this.SetupGame();
        this.bindPageEvents();
    }

    public SetupGame() {
        this.boardSize = parseInt((<HTMLInputElement>document.getElementById('boardSize')).value, 10);
        this.game = new Game(this.boardSize);
        this.game.Board.Setup();
        this.bindBoardEvents();
    }

    public bindPageEvents() {
        document.getElementById('start').addEventListener('click', (e: Event) => {
            document.getElementById('start').setAttribute('disabled', 'disabled');
            document.getElementById('stop').removeAttribute('disabled');
            this.game.Start();
        });

        document.getElementById('stop').addEventListener('click', (e: Event) => {
            document.getElementById('stop').setAttribute('disabled', 'disabled');
            document.getElementById('start').removeAttribute('disabled');
            this.game.Stop();
        });

        document.getElementById('random').addEventListener('click', (e: Event) => {
            document.getElementById('stop').setAttribute('disabled', 'disabled');
            document.getElementById('start').removeAttribute('disabled');

            this.game.Stop();

            var boardElement = document.getElementById("board");
            while (boardElement.firstChild) {
                boardElement.removeChild(boardElement.firstChild);
            }
            
            this.SetupGame();
            var density = parseFloat((<HTMLInputElement>document.getElementById('density')).value);
            for(var i=0; i < this.game.Board.Rows; i++) {
                for(var j=0; j < this.game.Board.Columns; j++) {
                    if(Math.random() <= density){
                        var tmp = this.game.Board.Cells.get(`${i}_${j}`);
                        this.game.Board.UpdateInitialCells(tmp);
                    }
                }
            }
        });

        document.getElementById('updateBoardSize').addEventListener('click', (e: Event) => {
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

    public bindBoardEvents = () => {
        var classname = document.getElementsByClassName("cell");

        for (var i = 0; i < classname.length; i++) {
            classname[i].addEventListener('click', (e: Event) => {
                if(!this.game.started) {
                    var id = e.srcElement.getAttribute("id");
                    var cell = this.game.Board.Cells.get(id);
                    this.game.Board.UpdateInitialCells(cell);
                }
            }, false);
        }
    }
}

var main = new Main();
main.Run();