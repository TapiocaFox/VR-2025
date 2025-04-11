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

const boardWidth = 1;
const boardHeight = 0.33;

const boardMinX = -boardWidth / 2;
const boardMaxX = boardWidth / 2;
const boardMinZ = -boardWidth / 2;
const boardMaxZ = boardWidth / 2;

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

const interactableObjs = [];
const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

export const init = async model => {
    const buildICar = (id, boardState) => {
        // Determine the top left u, v position of the car from the board state and the id.
        const bottomLeftCell = [0, 0]; // Interger 
        const topRightCell = [0, 0];  // Interger 
        const orientation = 'h'; // 'h' or 'v'
        const pos = [0, 0, 0]; // The position of the car on the board.
        const obj = model.add('square').color(idToColor[id]);

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
        const x = boardMinX + bottomLeftCell[1] * cellSize;
        const z = boardMinV + bottomLeftCell[0] * cellSize;
        pos[0] = x;
        pos[1] = 0;
        pos[2] = z;

        const iObj = {
            name: id,
            obj: obj,
            pos: pos,
            animate: function() {
                this.obj.move(this.pos[0], 0, this.pos[1]);
            }
        }

        // Update the position of the car. Based on orientation. And the boundaries of the board.
        iObj.updatePos = function() {
            if(this.controllerInteractions.isBeingDragged) {
                const beamMatrixBegin = this.beamMatrixPositionPairsOnEvent.onDrag[0];
                const P = this.beamMatrixPositionPairsOnEvent.onDrag[1];
                let bm = beamMatrixBegin;	// get controller beam matrix
                let o = bm.slice(12, 15);		// get origin of beam
                let x = bm.slice( 0, 3);		// get x axis of beam
                let y = bm.slice( 4, 7);		// get y axis of beam
                let z = bm.slice( 8, 11);		// get z axis of beam
                let p = cg.subtract(P, o);	// shift point to be relative to beam origin
                let dx = cg.dot(p, x);		// compute distance of point projected onto x
                let dy = cg.dot(p, y);		// compute distance of point projected onto y
                let dz = cg.dot(p, z);		// compute distance of point projected onto beam
                
                const beamMatrixNow = this.controllerInteractions.beamMatrix;
                let bm_n = beamMatrixNow;
                let o_n = bm_n.slice(12, 15);		// get origin of beam
                let x_n = bm_n.slice( 0, 3);		// get x axis of beam
                let y_n = bm_n.slice( 4, 7);		// get y axis of beam
                let z_n = bm_n.slice( 8, 11);		// get z axis of beam
                let x_s = cg.scale(x_n, dx);
                let y_s = cg.scale(y_n, dy);
                let z_s = cg.scale(z_n, dz);

                // const newPos = cg.add(cg.add(cg.add(o_n, x_s), y_s), z_s);
                // New position based on orientation. And the boundaries of the board.
                if(this.orientation === 'h') {
                    const newPos = cg.max(cg.min(cg.add(this.pos, x_s), boardMaxX), boardMinX);
                    this.pos = newPos;
                } else {
                    const newPos = cg.max(cg.min(cg.add(this.pos, z_s), boardMaxZ), boardMinZ);
                    this.pos = newPos;
                }
            }
        }

        return iObj;
    };

    const newGame = () => {
        const board = boardState.board;
        interactableObjs.forEach(obj => obj.destroy());

        // Build the ICars. Avoid repeating the same cell with same id.
        // Add the ICars using `addInteractableObj`.
        // Filter out all the unique ids from the board.
        const uniqueIds = [...new Set(board.split(''))];
        uniqueIds.forEach(id => {
            if(id !== 'o') {
                const iCar = buildICar(id, board);
                iSubSys.addInteractableObj(iCar);
            }
        });
    };

    const controlPanelG2 = new G2();

    // Move the board to the center of the screen, corresponding to the boardMinU and boardMinV, X and Z.
    const board = model.add('square').color('white').move(boardMinX, 0, boardMinZ);
    board.scale(boardWidth, boardHeight, boardWidth);

    const controlPanelObj = model.add('square').setTxtr(controlPanelG2.getCanvas());
    newGame();

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
 