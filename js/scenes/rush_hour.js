import { G2 } from "../util/g2.js";
import * as interactive from "./lib/interactive.js";
import { buttonState, joyStickState } from "../render/core/controllerInput.js";
import { rcb, lcb } from '../handle_scenes.js'; 

// https://www.michaelfogleman.com/rush/
// The board description is a 36-character string representing the state of the unsolved board. It is a 6x6 2D array in row-major order. The characters in the description follow these simple rules:
// o empty cell
// x wall (fixed obstacle)
// A primary piece (red car)
// B - Z all other pieces
// I used lowercase o instead of periods . for the empty cells in the database so that the entire board description can be selected with a double-click. My code can parse either format.
const boardSize = 6;
window.boardState = { board : "BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN", carsPositions: {}};   
server.init('boardState', {});

const boardScale = 1.5;

const boardMinU = -boardScale / 2;
const boardMaxU = boardScale / 2;
const boardMinV = -boardScale / 2;
const boardMaxV = boardScale / 2;

// Move the board to the center of the screen, corresponding to the boardMinU and boardMinV, X and Z.
const board = model.add('square').setColor('white').move(boardMinU, 0, boardMinV);
board.scale(boardScale);

const cellSize = 1.5 / boardSize;

const idToColor = {
    "A": "red",
    "B": "blue",
    "C": "green",
    "D": "yellow",
    "E": "purple",
    "F": "orange",
    "G": "brown",
    "H": "pink",
    "I": "gray",
    "J": "cyan",
    "K": "magenta",
    "L": "lime",
    "M": "maroon",
}

const buildICar = (id, boardState) => {

    // Determine the top left u, v position of the car from the board state and the id.
    const bottomLeftCell = [0, 0]; // Interger 
    const topRightCell = [0, 0];  // Interger 
    const orientation = 'h'; // 'h' or 'v'
    const pos = [0, 0]; // The position of the car on the board.
    const obj = model.add('square').setColor(idToColor[id]);

    // Find the bottom left and top right cells of the car.
    for(let i = 0; i < boardSize; i++) {
        for(let j = 0; j < boardSize; j++) {
            // Navigate boardState from top left to bottom right.
            const cellId = boardState.board[i * boardSize + j];
            if (cellId === id) {
                // Bottom left cell found. Lowest i and j. Compare to bottomLeftCell.
                if (i < bottomLeftCell[0] && j < bottomLeftCell[1]) {
                    bottomLeftCell[0] = i;
                    bottomLeftCell[1] = j;
                }
                // Top right cell found. Highest i and j. Compare to topRightCell.
                if (i > topRightCell[0] && j > topRightCell[1]) {
                    topRightCell[0] = i;
                    topRightCell[1] = j;
                }
            }
        }
    }

    // Determine the cellSize of the car.
    // Car always has 1xN or 1xN size. carLength is the number of N cells in the car.
    const length = topRightCell[0] - bottomLeftCell[0];
    const width = topRightCell[1] - bottomLeftCell[1];
    const cellSize = Math.max(length, width);

    // Determine the orientation of the car.
    if (length > width) {
        orientation = 'h';
        obj.scale(cellSize, 1, 1);
    } else {
        orientation = 'v';
        obj.scale(1, cellSize, 1);
    }

    // Determine the position of the car. Bounded by the board min and max.
    const u = boardMinU + bottomLeftCell[1] * cellSize;
    const v = boardMinV + bottomLeftCell[0] * cellSize;
    pos[0] = u;
    pos[1] = v;
    

    const iObj = {
        name: id,
        obj: obj,
        pos: pos,
        animate: function() {
            this.obj.move(this.pos[0], 0, this.pos[1]);
        }
    }
    return iObj;
};

const newGame = () => {
    const board = window.boardState.board;

};

const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

export const init = async model => {
    const controlPanelG2 = new G2();

    const controlPanelObj = model.add('square').setTxtr(controlPanelG2.getCanvas());
    
    model.animate(() => {
        iSubSys.update();s
        controlPanelG2.update(); controlPanelObj.identity().move(-.4,1.7,0).scale(.15);
    });

    controlPanelG2.render = function() {
        this.setColor('white');
        this.fillRect(-1,-1,2,2);

        this.setColor('black');
        this.textHeight(.1);
        this.text('Control Panel', 0, .9, 'center');
    }
 }
 