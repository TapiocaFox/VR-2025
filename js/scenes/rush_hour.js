import * as cg from "../render/core/cg.js";
import { G2 } from "../util/g2.js";
import * as interactive from "./lib/interactive.js";
import { buttonState, joyStickState } from "../render/core/controllerInput.js";
import { rcb, lcb } from '../handle_scenes.js'; 

const cg_ext = {};
// Implement vector min/max functions
cg_ext.min = (a, b) => {
    return [
        Math.min(a[0], b[0]),
        Math.min(a[1], b[1]),
        Math.min(a[2], b[2])
    ];
};

cg_ext.max = (a, b) => {
    return [
        Math.max(a[0], b[0]),
        Math.max(a[1], b[1]),
        Math.max(a[2], b[2])
    ];
};

// Line line intersection.
// y = ax + b
// y = cx + d
// a*x + b = cx + d
// (a-c)x = d-b
// x = (d-b)/(a-c)
// y = a*x + b
// p = [x, y]
cg_ext.lineLineIntersection2D = (origin1, direction1, origin2, direction2) => { 
    // Handle vertical lines (direction1[0] is 0)
    if (Math.abs(direction1[0]) < 0.0001) {
        // Line 1 is vertical, use x from origin1
        const x = origin1[0];
        // Find y using line 2's equation
        const m2 = direction2[1] / direction2[0];
        const b2 = origin2[1] - m2 * origin2[0];
        const y = m2 * x + b2;
        return [x, y];
    }
    
    // Handle horizontal lines (direction2[0] is 0)
    if (Math.abs(direction2[0]) < 0.0001) {
        // Line 2 is vertical, use x from origin2
        const x = origin2[0];
        // Find y using line 1's equation
        const m1 = direction1[1] / direction1[0];
        const b1 = origin1[1] - m1 * origin1[0];
        const y = m1 * x + b1;
        return [x, y];
    }

    // General case for non-vertical lines
    const m1 = direction1[1] / direction1[0];
    const b1 = origin1[1] - m1 * origin1[0];
    const m2 = direction2[1] / direction2[0];
    const b2 = origin2[1] - m2 * origin2[0];
    
    const x = (b2 - b1) / (m1 - m2);
    const y = m1 * x + b1;
    return [x, y];
}


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

// 58 BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN 9192
const boardSize = 6;
let generation = -1;
const defaultBoard = "BBoKMxDDDKMoIAALooIoJLEEooJFFNoGGoxN";
const defaultMinMoves = 58;
const defaultClusterSize = 9192;

const boardWidth = 1.;
const boardHeight = 0.05;
const boardPosition = [0, 0.00, 0];

const boardMinX = -boardWidth / 2;
const boardMaxX = boardWidth / 2;
const boardMinZ = -boardWidth / 2;
const boardMaxZ = boardWidth / 2;

const singleCellWidth = boardWidth / boardSize;
const singleCellHeight = singleCellWidth;

const carEmphasizeScale = 1.1;
const carExtraEmphasizeScale = 1.2;

const verticalGridDividers = [];
for(let i = 0; i < boardSize; i++) {
    verticalGridDividers.push(boardMinX + i * singleCellWidth);
}

const horizontalGridDividers = [];
for(let i = 0; i < boardSize; i++) {
    horizontalGridDividers.push(boardMinZ + i * singleCellWidth);
}


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

const getScaleFromOrientationAndCellSize = (cellSize, orientation) => {
    const scale = [0, 0, 0];
    if (orientation === 'h') {
        scale[0] = cellSize*singleCellWidth/2;
        scale[1] = singleCellHeight/2;
        scale[2] = singleCellWidth/2;
    } else {
        scale[0] = singleCellWidth/2;
        scale[1] = singleCellHeight/2;
        scale[2] = cellSize*singleCellWidth/2;
    }
    return scale;
}

const topLeftCellToPos = (topLeftCell, cellSize, orientation) => {
    const scale = getScaleFromOrientationAndCellSize(cellSize, orientation);
    const x = boardMinX + scale[0] + topLeftCell[0] * singleCellWidth;
    const z = boardMinZ + scale[2] + topLeftCell[1] * singleCellWidth;
    const pos = [boardPosition[0] + x, boardPosition[1] + boardHeight+singleCellHeight/2, boardPosition[2] + z];
    return pos;
}

const getCarPosAndDimensions = (id, board) => {
    // Determine the top left u, v position of the car from the board state and the id.
    const bottomRightCell = [0, 0]; // Interger 
    const topLeftCell = [boardSize-1, boardSize-1];  // Interger 
    let orientation = 'h'; // 'h' or 'v'
    // const pos = [0, 0, 0]; // The position of the car on the board.

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

    // Determine the orientation of the car.
    if (length > width) {
        orientation = 'h';
    } else {    
        orientation = 'v';
    }

    const scale = getScaleFromOrientationAndCellSize(cellSize, orientation);
    const pos = topLeftCellToPos(topLeftCell, cellSize, orientation);

    return {
        pos: pos,
        scale: scale,
        orientation: orientation,
        cellSize: cellSize,
        topLeftCell: topLeftCell,
        bottomRightCell: bottomRightCell,
    };
}

const getTopLeftCellAndBottomRightCellFromPos = (pos, orientation, cellSize) => {
    // Find the top left cell from the pos.
    const x = pos[0] - boardPosition[0] - boardMinX;
    const z = pos[2] - boardPosition[2] - boardMinZ;
    
    // Calculate the cell indices based on the position
    // For horizontal cars, we need to account for the scale offset
    const topLeftCell = [0, 0];
    if (orientation === 'h') {
        const cellX = Math.max(0, Math.min(Math.round((x - cellSize * singleCellWidth / 2) / singleCellWidth), boardSize-cellSize));
        const cellZ = Math.max(0, Math.min(Math.round((z - singleCellWidth / 2) / singleCellWidth), boardSize-1));
        topLeftCell[0] = cellX;
        topLeftCell[1] = cellZ;
        bottomRightCell[0] = cellX + cellSize - 1;
        bottomRightCell[1] = cellZ;
    } else {
        // For vertical cars
        const cellX = Math.max(0, Math.min(Math.round((x - singleCellWidth / 2) / singleCellWidth), boardSize-1));
        const cellZ = Math.max(0, Math.min(Math.round((z - cellSize * singleCellWidth / 2) / singleCellWidth), boardSize-cellSize));
        topLeftCell[0] = cellX;
        topLeftCell[1] = cellZ;
        bottomRightCell[0] = cellX;
        bottomRightCell[1] = cellZ + cellSize - 1;
    }

    return {topLeftCell: topLeftCell, bottomRightCell: bottomRightCell};
}

const isMoveValid = (board, carId, topLeftCellA, topLeftCellB, orientation, cellSize) => {
    // Check if the move is valid.
    // Check if there is a car in the topLeftCellA and topLeftCellB.
    // If there is a car, check if it is the same car.
    // If there is no car, check if the move is valid.
    // If the move is valid, return true.
    // Otherwise, return false.
    return true;
}

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

const initCarStates = (board) => {
    const carStates = {};
    // Get all the unique car ids from the board.
    const uniqueIds = [...new Set(board.split(''))];
    uniqueIds.forEach(id => {
        if(id !== 'o' && id !== 'x') {
            const {pos, orientation, cellSize, topLeftCell, bottomRightCell} = getCarPosAndDimensions(id, board);
            carStates[id] = {controlledBy: null, controlledPos: pos, isGrabbed: false, orientation: orientation, cellSize: cellSize};
        }
    });
    return carStates;
}
const cleanUpCarStates = (carStates, clients) => {
    // Release control of the car if the client is not in the list of clients.
    for(let id in carStates) {
        const controlledBy = carStates[id].controlledBy;
        if(controlledBy != null && !clients.includes(controlledBy)) {
            carStates[id].controlledBy = null;
            carStates[id].isGrabbed = false;
            console.log("Clean up carId: ", id, "controlledBy: ", controlledBy);
        }
    }
    return carStates;
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


// Test the getTopLeftCellFromPos function.
printBoardIn2D(defaultBoard);
const {pos, scale, orientation, cellSize, topLeftCell, bottomRightCell} = getCarPosAndDimensions('F', defaultBoard);
console.log("topLeftCell: ", topLeftCell, "bottomRightCell: ", bottomRightCell);
const {topLeftCell: topLeftCell2, bottomRightCell: bottomRightCell2} = getTopLeftCellAndBottomRightCellFromPos(pos, orientation, cellSize);
console.log("topLeftCell2: ", topLeftCell2, "bottomRightCell2: ", bottomRightCell2);

server.init('boardState', { board : defaultBoard, minMoves: defaultMinMoves, clusterSize: defaultClusterSize, carStates: initCarStates(defaultBoard), boardGeneration: 0});
server.init('buttonMessages', {});
server.init('carStateMessages', {});

// const interactableObjs = [];
let controlPanelText = 'Hello world';


export const init = async model => {
    const iSubSys = new interactive.InteractiveSystem(model, buttonState, joyStickState, lcb, rcb);

    const rushHourPositionUpdater = function() {
        const boardState = iSubSys.boardState;
        // console.log("boardState: ", boardState);
        const controlledBy = boardState.carStates[this.name].controlledBy;
        const isGrabbed = boardState.carStates[this.name].isGrabbed;
        // const controlledPos = boardState.carStates[this.name].controlledPos;
        this.controlledBy = controlledBy;
        this.isGrabbed = isGrabbed; 

        if(controlledBy != clientID) {
            this.pos = boardState.carStates[this.name].controlledPos;
            return;
        }
        if(this.controllerInteractions.isBeingDragged) {
            controlPanelText = 'Dragging...';
            const beamMatrixBegin = this.beamMatrixPositionPairsOnEvent.onDrag[0];
            const P = this.beamMatrixPositionPairsOnEvent.onDrag[1];
            let bm = beamMatrixBegin;	// get controller beam matrix
            let o = bm.slice(12, 15);		// get origin of beam
            let z = bm.slice( 8, 11);		// get z axis of beam
            const o_xz = [o[0], o[2]];
            const z_xz = [z[0], z[2]];

            const beamMatrixNow = this.controllerInteractions.beamMatrix;
            let bm_n = beamMatrixNow;
            let o_n = bm_n.slice(12, 15);		// get origin of beam
            let z_n = bm_n.slice( 8, 11);		// get z axis of beam
            const o_n_xz = [o_n[0], o_n[2]];
            const z_n_xz = [z_n[0], z_n[2]];

            // controlPanelText = 'Dragging... S1, z_n_xz: \n' + z_n_xz.map(x => x.toFixed(3)) +'\n o_n_xz: \n' + o_n_xz.map(x => x.toFixed(3));
            // const newPos = cg.add(cg.add(cg.add(o_n, x_s), y_s), z_s);
            // New position based on orientation. And the boundaries of the board.
            try {
                if(this.orientation === 'h') {
                    const pos_projected_on_z_axis = [0, this.pos[2]];
                    const horizaontal_line_direction = [1, 0];
                    // const old_2d_intersection = cg_ext.lineLineIntersection2D(pos_projected_on_z_axis, horizaontal_line_direction, o_xz, z_xz);
                    const new_2d_intersection = cg_ext.lineLineIntersection2D(pos_projected_on_z_axis, horizaontal_line_direction, o_n_xz, z_n_xz);
                    this.pos[0] = Math.max(Math.min(new_2d_intersection[0], boardMaxX), boardMinX);
                    controlPanelText = `Horizontal: new_x=${this.pos[0].toFixed(3)}`;
                } else {
                    const pos_projected_on_x_axis = [this.pos[0], 0];
                    const vertical_line_direction = [0, 1];
                    // const old_2d_intersection = cg_ext.lineLineIntersection2D(pos_projected_on_x_axis, vertical_line_direction, o_xz, z_xz);
                    const new_2d_intersection = cg_ext.lineLineIntersection2D(pos_projected_on_x_axis, vertical_line_direction, o_n_xz, z_n_xz);
                    this.pos[2] = Math.max(Math.min(new_2d_intersection[1], boardMaxZ), boardMinZ);
                    controlPanelText = `Vertical: new_z=${this.pos[2].toFixed(3)}\n` +
                                    `intersection=[${new_2d_intersection.map(x => x.toFixed(3))}]`;
                }
                server.send('carStateMessages', {carId: this.name, controlledBy: clientID, sendFrom: clientID, controlledPos: this.pos});
            } catch (e) {
                controlPanelText = 'Dragging... Error: \n' + e;
            }
        }
    }

    const buildICar = (id, board) => {
        const {pos, scale, orientation, cellSize, topLeftCell, bottomRightCell} = getCarPosAndDimensions(id, board);
        const obj = model.add('cube').color(idToColor[id]);

        // console.log(id, orientation, cellSize, topLeftCell, bottomRightCell);

        const iObj = {
            name: id,
            obj: obj,
            pos: pos,
            scale: scale,
            orientation: orientation,
            detectionRadius: singleCellHeight/2,
            controlledBy: null,
            animate: function() {
                // console.log(this.pos);
                // this.obj.move(this.pos[0], this.pos[1], this.pos[2]);
                // const boardState = iSubSys.boardState;
                // const controlledBy = boardState.carStates[this.name].controlledBy;
                // const controlledPos = boardState.carStates[this.name].controlledPos;
                // this.obj.identity().move(controlledPos).scale(cg.scale(this.scale, carEmphasizeScale));
                // this.obj.identity().move(controlledPos).scale(cg.scale(this.scale, carEmphasizeScale));
                if(this.isGrabbed) {
                    this.obj.identity().move(this.pos).scale(cg.scale(this.scale, carExtraEmphasizeScale));
                }
                else if(this.controlledBy != null) {
                    // controlPanelText = 'Controlled by: ' + boardState.carStates[this.name].controlledBy;
                    this.obj.identity().move(this.pos).scale(cg.scale(this.scale, carEmphasizeScale));
                }
                else {
                    // this.obj.identity().move(this.pos).scale(this.scale);
                    this.obj.identity().move(this.pos).scale(this.scale);
                }
            },
            onHit: function(cs) {
                controlPanelText = 'Hit carId: ' + this.name;
                const boardState = iSubSys.boardState;
                if(boardState.carStates[this.name].controlledBy == null) {
                    server.send('carStateMessages', {carId: this.name, controlledBy: clientID, sendFrom: clientID, controlledPos: this.pos});
                }
            },
            onGrab: function(cs) {
                controlPanelText = 'Grab carId: ' + this.name;
                if(boardState.carStates[this.name].controlledBy == clientID) {
                    server.send('carStateMessages', {carId: this.name, controlledBy: clientID, isGrabbed: true, sendFrom: clientID, controlledPos: this.pos});
                }
            },
            onUnGrab: function(cs) {
                controlPanelText = 'UnGrab carId: ' + this.name;
                if(boardState.carStates[this.name].controlledBy == clientID) {
                    server.send('carStateMessages', {carId: this.name, controlledBy: clientID, isGrabbed: false, sendFrom: clientID, controlledPos: this.pos});
                }
            },
            onUnHit: function(cs) {
                controlPanelText = 'UnHit carId: ' + this.name;
                const boardState = iSubSys.boardState;
                if(boardState.carStates[this.name].controlledBy == clientID) {
                    server.send('carStateMessages', {carId: this.name, controlledBy: null, isGrabbed: false, sendFrom: clientID, controlledPos: this.pos});
                }
            }
        }

        // Update the position of the car. Based on orientation. And the boundaries of the board.
        iObj.updatePos = rushHourPositionUpdater.bind(iObj);

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
                    pos[0] = boardPosition[0] + x;
                    pos[1] = boardPosition[1] + boardHeight+singleCellHeight/2;
                    pos[2] = boardPosition[2] + z;

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
        console.log('Reset Completed.');
    };

    // Atomic operation. Undo the last move.
    const undo = () => {
        console.log('Undo');
        const boardState = server.synchronize('boardState');
        boardState.boardGeneration++;
        server.broadcastGlobal('boardState', boardState);
        console.log('Undo Completed.');
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
        boardState.carStates = initCarStates(newBoardState.board);
        server.broadcastGlobal('boardState', boardState);
        console.log('Random Completed.');
    };

    const controlPanelG2 = new G2();
    

    // Move the board to the center of the screen, corresponding to the boardMinX and boardMinZ, X and Z.
    const board = model.add('cube').color('white').move(boardPosition).scale(boardWidth/2, boardHeight, boardWidth/2);

    // Add the board to the scene.
    const controlPanelObj = model.add('square').setTxtr(controlPanelG2.getCanvas());
    controlPanelG2.addWidget(controlPanelObj, 'button',  .7, -.8, '#80ffff', 'reset', () => {
        // reset();
        controlPanelText = "Reset Clicked.";
        server.send('buttonMessages', {reset: true});
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  .3, -.8, '#80ffff', 'undo', () => {
        // undo();
        controlPanelText = "Undo Clicked."; 
        server.send('buttonMessages', {undo: true});
    });

    controlPanelG2.addWidget(controlPanelObj, 'button',  -.1, -.8, '#80ffff', 'random', () => {
        // random();
        controlPanelText = "Random Clicked.";
        server.send('buttonMessages', {random: true});
    });

    // reset();
    let firstInit = false;
    model.animate(() => {
        controlPanelG2.update(); controlPanelObj.identity().move(-.4,1.0,-0.2).scale(.15);
        const boardState = server.synchronize('boardState');
        iSubSys.boardState = boardState;
        // console.log(boardState.boardGeneration, generation);
        if(!firstInit || boardState.boardGeneration > generation) {
            controlPanelText = "New generation: " + boardState.boardGeneration + "\nclientID: " + clientID + ", Is main: " + (clientID == clients[0]);
            initNewGeneration(boardState);
            generation = boardState.boardGeneration;
            firstInit = true;
        }
        iSubSys.update();
        // console.log("boardState.carStates: ", JSON.stringify(boardState.carStates));

        server.sync('carStateMessages', msgs => {
            // Atomic operation.
            if (clientID == clients[0]) {
                const boardState = server.synchronize('boardState');
                for (let id in msgs) {
                    const carId = msgs[id].carId;
                    const controlledBy = msgs[id].controlledBy;
                    const controlledPos = msgs[id].controlledPos;
                    const sendFrom = msgs[id].sendFrom;
                    const isGrabbed = msgs[id].isGrabbed;
                    if(boardState.carStates[carId].controlledBy == null || boardState.carStates[carId].controlledBy == sendFrom) {
                        boardState.carStates[carId].controlledBy = controlledBy;
                        boardState.carStates[carId].controlledPos = controlledPos;
                        if(typeof isGrabbed === 'boolean') boardState.carStates[carId].isGrabbed = isGrabbed;
                        // console.log("carId: ", carId, "controlledBy: ", controlledBy, "clientID: ", clientID, "boardState.carStates[carId]: ", JSON.stringify(boardState.carStates[carId]));
                        // console.log("0. boardState.carStates: ", JSON.stringify(boardState.carStates));

                    }
                }
                // console.log("1. boardState.carStates: ", JSON.stringify(boardState.carStates));
                for(let carId in boardState.carStates) {
                    if(boardState.carStates[carId].controlledBy == null) {
                        const cellSize = boardState.carStates[carId].cellSize;
                        const orientation = boardState.carStates[carId].orientation;
                        const {topLeftCell, bottomRightCell} = getTopLeftCellAndBottomRightCellFromPos(boardState.carStates[carId].controlledPos, orientation, cellSize);
                        const pos = topLeftCellToPos(topLeftCell, cellSize, orientation);
                        boardState.carStates[carId].controlledPos = pos;
                        // console.log("carId: ", carId, "topLeftCell: ", topLeftCell);
                    }
                }
                server.broadcastGlobal('boardState', boardState);
                // console.log("2.boardState.carStates: ", JSON.stringify(boardState.carStates));
            }
        });
        server.sync('buttonMessages', msgs => {
            // Atomic operation.
            if (clientID == clients[0]) {
                let doReset = false;
                let doUndo = false;
                let doRandom = false;
    
                // console.log('msgs', msgs);
                for (let id in msgs) {
                    doReset = doReset || msgs[id].reset;
                    doUndo = doUndo || msgs[id].undo;
                    doRandom = doRandom || msgs[id].random;
                }
                if (doRandom) {
                    random();
                }
                else if (doReset) {
                    reset();
                }
                else if (doUndo) {
                    undo();
                }
            }
        });
        if (clientID == clients[0]) {
            // console.log('boardState', boardState);
            boardState.carStates = cleanUpCarStates(boardState.carStates, clients);
            server.broadcastGlobal('boardState', boardState);
        }
    });

    controlPanelG2.render = function() {
        this.setColor('white');
        this.fillRect(-1,-1,2,2);

        this.setColor('black');
        this.textHeight(.1);
        this.text('Control Panel', 0, .9, 'center');

        this.setColor('black');
        this.textHeight(.08);
        this.text(controlPanelText, 0, 0.5, 'center');
    }
 }
 