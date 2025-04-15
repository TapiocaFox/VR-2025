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
// Example for "BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN"
// Board in 2D row-major order:
//   123456
// 1 BBoKMx
// 2 DDDKMo
// 3 IAALoo
// 4 IoJLEE
// 5 ooJFFN
// 6 oGGoxN

const boardSize = 6;
window.boardState = { board : "BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN", carsPositions: {}};   
server.init('boardState', {});

const boardWidth = 1.;
const boardHeight = 0.1;

const boardMinX = -boardWidth / 2;
const boardMaxX = boardWidth / 2;
const boardMinZ = -boardWidth / 2;
const boardMaxZ = boardWidth / 2;

const singleCellWidth = boardWidth / boardSize;
const singleCellHeight = singleCellWidth;

const idToColor = {
    "A": [1, 0, 0],
    "B": [0, 0, 1],
    "C": [0, 1, 0],
    "D": [1, 1, 0],
    "E": [0, 1, 1],
    "F": [1, 0.5, 0],
    "G": [0.5, 0, 0],
    "H": [1, 0, 1],
    "I": [0.5, 0.5, 0.5],
    "J": [0, 1, 1],
    "K": [1, 0, 1],
    "L": [0, 1, 0],
    "M": [0.5, 0, 0],
    "N": [0.5, 0.5, 0],
}

const interactableObjs = [];
const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

export const init = async model => {
    const buildICar = (id, board) => {
        // Determine the top left u, v position of the car from the board state and the id.
        const bottomRightCell = [0, 0]; // Interger 
        const topLeftCell = [boardSize-1, boardSize-1];  // Interger 
        let orientation = 'h'; // 'h' or 'v'
        const pos = [0, 0, 0]; // The position of the car on the board.
        const obj = model.add('cube').color(idToColor[id]);

        // Find the bottom left and top right cells of the car.
        for(let i = 0; i < boardSize; i++) {
            for(let j = 0; j < boardSize; j++) {
                // Navigate boardState from top left to bottom right.
                // console.log(board);
                const cellId = board[i + j * boardSize];
                if (cellId === id) {
                    // Bottom left cell found. Highest i and j. Compare to bottomRightCell.
                    if (i >= bottomRightCell[0] && j >= bottomRightCell[1]) {
                        bottomRightCell[0] = i;
                        bottomRightCell[1] = j;
                    }
                    // Top right cell found. Lowest i and j. Compare to topLeftCell.
                    if (i <= topLeftCell[0] && j <= topLeftCell[1]) {
                        topLeftCell[0] = i;
                        topLeftCell[1] = j;
                    }
                }
            }
        }

        // Determine the cellSize of the car.
        // Car always has 1xN or 1xN size. carLength is the number of N cells in the car.
        const length =  bottomRightCell[0] - topLeftCell[0] + 1;
        const width = bottomRightCell[1] - topLeftCell[1] + 1;
        const cellSize = Math.max(length, width);
        const scale = [0, 0, 0];

        // Determine the orientation of the car.
        if (length > width) {
            orientation = 'h';
            scale[0] = cellSize*singleCellWidth/2;
            scale[1] = singleCellHeight/2;
            scale[2] = singleCellWidth/2;
        } else {    
            orientation = 'v';
            scale[0] = singleCellWidth/2;
            scale[1] = singleCellHeight/2;
            scale[2] = cellSize*singleCellWidth/2;
        }

        // Determine the position of the car. Bounded by the board min and max.
        // The original point is the center of the car.
        const x = boardMinX + scale[0] + topLeftCell[0] * singleCellWidth;
        const z = boardMinZ + scale[2] + topLeftCell[1] * singleCellWidth;
        pos[0] = x;
        pos[1] = boardHeight+singleCellHeight/2;
        pos[2] = z;

        // pos[0] = boardMinX;
        // pos[2] = boardMinZ;

        console.log(id, orientation, cellSize, topLeftCell, bottomRightCell);

        const iObj = {
            name: id,
            obj: obj,
            pos: pos,
            scale: scale,
            animate: function() {
                // console.log(this.pos);
                // this.obj.move(this.pos[0], this.pos[1], this.pos[2]);
                this.obj.identity().move(this.pos).scale(this.scale);
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
            if(id !== 'o' && id !== 'x') {
                const iCar = buildICar(id, board);
                iSubSys.addInteractableObj(iCar);
            }
        });
    };

    const undo = () => {

    };

    const random = () => {

    };

    const controlPanelG2 = new G2();

    // Move the board to the center of the screen, corresponding to the boardMinX and boardMinZ, X and Z.
    const board = model.add('cube').color('white').scale(boardWidth/2, boardHeight, boardWidth/2);


    // Add the board to the scene.
    const controlPanelObj = model.add('square').setTxtr(controlPanelG2.getCanvas());
    controlPanelG2.addWidget(controlPanelObj, 'button',  .7, -.8, '#80ffff', 'reset', () => {
        newGame();
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  .3, -.8, '#80ffff', 'undo', () => {
        undo();
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  -.1, -.8, '#80ffff', 'random', () => {
        random();
    });

    newGame();

    model.animate(() => {
        iSubSys.update();
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
 