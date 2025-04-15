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



const rush1000Url = '../media/rush/rush1000.txt';
const response = await fetch(rush1000Url);
if (!response.ok) {
   throw new Error(`Response status: ${response.status}`);
}
const text = await response.text();
const boards = text.split('\n');
// Get a board (a line) from the text. By random.
// The format is like this:
// 60 IBBxooIooLDDJAALooJoKEEMFFKooMGGHHHM 2332
// The database is a simple text file with just a few columns. There is one row for every valid (solvable, minimal) cluster. The columns are: # of moves, board description, and cluster size (# of reachable states).
const getRandomBoardState = () => {
    // Return
    const boardStateList = boards[Math.floor(Math.random() * boards.length)].split(' ');
    console.log(boardStateList);
    return {
        board: boardStateList[1],
        minMoves: parseInt(boardStateList[0]),
        clusterSize: parseInt(boardStateList[2]),
    };
};

// 58 BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN 9192
const boardSize = 6;
let generation = -1;
server.init('boardState', { board : "BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN", minMoves: 58, clusterSize: 9192, carsPositions: {}, boardGeneration: 0});
server.init('buttonMessages', {});

const boardWidth = 1.;
const boardHeight = 0.05;

const boardMinX = -boardWidth / 2;
const boardMaxX = boardWidth / 2;
const boardMinZ = -boardWidth / 2;
const boardMaxZ = boardWidth / 2;

const singleCellWidth = boardWidth / boardSize;
const singleCellHeight = singleCellWidth;

const idToColor = {
    "A": [1, 0, 0.30196078431372547],
    "B": [0.11372549019607843, 0.16862745098039217, 0.3254901960784314],
    "C": [0.49019607843137253, 0.1450980392156863, 0.3254901960784314],
    "D": [0, 0.5294117647058824, 0.3176470588235294],
    "E": [0.6666666666666666, 0.3215686274509804, 0.20784313725490197],
    "F": [0.37254901960784315, 0.33725490196078434, 0.3137254901960784],
    "G": [0.7607843137254902, 0.7647058823529411, 0.7764705882352941],
    "H": [1, 0.6392156862745098, 0],
    "I": [1, 0.9215686274509803, 0.14901960784313725],
    "J": [0, 0.8901960784313725, 0.1803921568627451],
    "K": [0.1568627450980392, 0.6745098039215687, 1],
    "L": [0.5137254901960784, 0.4627450980392157, 0.6117647058823529],
    "M": [1, 0.4666666666666667, 0.6470588235294118],
    "N": [1, 0.8, 0.6666666666666666],
    "O": [1, 1, 1],
    "x": [0, 0, 0],
}

const printBoardIn2D = (board) => {
    console.log('Board:');
    for(let i = 0; i < boardSize; i++) {
        let row = '';
        for(let j = 0; j < boardSize; j++) {
            const cellId = board[i * boardSize + j];
            row += cellId;
        }
        console.log(row);
    }
};

// const interactableObjs = [];

export const init = async model => {
    const iSubSys = new interactive.InteractiveSystem(model, buttonState, joyStickState, lcb, rcb);
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
                const cellId = board[i * boardSize + j];
                if (cellId === id) {
                    // Bottom left cell found. Highest i and j. Compare to bottomRightCell.
                    if (j >= bottomRightCell[0] && i >= bottomRightCell[1]) {
                        bottomRightCell[0] = j;
                        bottomRightCell[1] = i;
                    }
                    // Top right cell found. Lowest i and j. Compare to topLeftCell.
                    if (j <= topLeftCell[0] && i <= topLeftCell[1]) {
                        topLeftCell[0] = j;
                        topLeftCell[1] = i;
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

        // console.log(id, orientation, cellSize, topLeftCell, bottomRightCell);

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


    const iCars = [];
    const iWalls = [];

    // Initialize the new generation.
    const initNewGeneration = (boardState) => {
        const board = boardState.board;
        printBoardIn2D(board);
        iCars.forEach(iCar => iCar.destroy());
        iWalls.forEach(iWall => iWall.destroy());

        // Build the ICars. Avoid repeating the same cell with same id.
        // Add the ICars using `addInteractableObj`.
        // Filter out all the unique ids from the board.
        const uniqueIds = [...new Set(board.split(''))];
        uniqueIds.forEach(id => {
            if(id !== 'o' && id !== 'x') {
                const iCar = buildICar(id, board);
                iSubSys.addInteractableObj(iCar);
                iCars.push(iCar);
            }
        });

        // Build the IWalls.
        for(let i = 0; i < boardSize; i++) {
            for(let j = 0; j < boardSize; j++) {
                const cellId = board[i * boardSize + j];
                if (cellId === 'x') {
                    const pos = [0, 0, 0];
                    const obj = model.add('cube').color(idToColor['x']);
                    const scale = [singleCellWidth/2, singleCellHeight/2, singleCellWidth/2];

                    const x = boardMinX + scale[0] + j * singleCellWidth;
                    const z = boardMinZ + scale[2] + i * singleCellWidth;
                    pos[0] = x;
                    pos[1] = boardHeight+singleCellHeight/2;
                    pos[2] = z;

                    obj.identity().move(pos).scale(scale);

                    const iObj = {
                        name: 'x',
                        obj: obj,
                        pos: pos,
                        animate: function() {
                            
                        }
                    }

                    iSubSys.addInteractableObj(iObj);
                    iWalls.push(iObj);
                }
            }
        }
    };

    // Atomic operation. Reset the board.
    const reset = () => {
        console.log('Reset');
        const boardState = server.synchronize('boardState');
        boardState.boardGeneration++;
        server.broadcastGlobal('boardState', boardState);
    };

    // Atomic operation. Undo the last move.
    const undo = () => {
        console.log('Undo');
        const boardState = server.synchronize('boardState');
        boardState.boardGeneration++;
        server.broadcastGlobal('boardState', boardState);
    };

    // Atomic operation. Get a random board state and reset the board.
    const random = () => {
        console.log('Random');
        const newBoardState = getRandomBoardState();
        console.log(newBoardState.board);

        const boardState = server.synchronize('boardState');
        boardState.boardGeneration++;
        boardState.board = newBoardState.board;
        boardState.minMoves = newBoardState.minMoves;
        boardState.clusterSize = newBoardState.clusterSize;
        server.broadcastGlobal('boardState', boardState);
    };

    const controlPanelG2 = new G2();

    // Move the board to the center of the screen, corresponding to the boardMinX and boardMinZ, X and Z.
    const board = model.add('cube').color('white').scale(boardWidth/2, boardHeight, boardWidth/2);

    // Add the board to the scene.
    const controlPanelObj = model.add('square').setTxtr(controlPanelG2.getCanvas());
    controlPanelG2.addWidget(controlPanelObj, 'button',  .7, -.8, '#80ffff', 'reset', () => {
        // reset();
        server.send('buttonMessages', {reset: true});
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  .3, -.8, '#80ffff', 'undo', () => {
        // undo();
        server.send('buttonMessages', {undo: true});
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  -.1, -.8, '#80ffff', 'random', () => {
        // random();
        server.send('buttonMessages', {random: true});
    });

    // reset();

    model.animate(() => {
        iSubSys.update();
        controlPanelG2.update(); controlPanelObj.identity().move(-.4,1.7,0).scale(.15);
        const boardState = server.synchronize('boardState');
        if(boardState.boardGeneration > generation) {
            initNewGeneration(boardState);
            generation = boardState.boardGeneration;
        }
        
        if (clientID == clients[0]) {
            server.sync('buttonMessages', msgs => {
                let doReset = false;
                let doUndo = false;
                let doRandom = false;
                for (let id in msgs) {
                    doReset = doReset || msgs[id].reset;
                    doUndo = doUndo || msgs[id].undo;
                    doRandom = doRandom || msgs[id].random;
                }

                // Atomic operation.
                if (doRandom) {
                    random();
                }
                else if (doReset) {
                    reset();
                }
                else if (doUndo) {
                    undo();
                }
            });
        }
    });

    controlPanelG2.render = function() {
        this.setColor('white');
        this.fillRect(-1,-1,2,2);

        this.setColor('black');
        this.textHeight(.1);
        this.text('Control Panel', 0, .9, 'center');
    }
 }
 