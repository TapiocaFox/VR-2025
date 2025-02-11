import * as cg from "../../render/core/cg.js";

// Goal
// 1. Interact with multiple objs.
// 2. Hit, Grab, Drag interactions dectection.
// 3. Response and update position based on interations.
// 4. Modular, each obj can have there way of handling things.

const numNStates = 16;

const Controller = Object.freeze({
    Left:   Symbol("left"),
    Right:  Symbol("right"),
});

export class InteractiveSystem {
    constructor(interactableObjs, buttonState, joyStickState, leftControllerBeam, rightControllerBeam) {
        this.interactableObjs = interactableObjs;
        this.buttonState = buttonState;

        this.controllerBeams = {};

        this.controllerBeams[Controller.Left] = leftControllerBeam;
        this.controllerBeams[Controller.Right] = rightControllerBeam;

        this.controllerStates = {};
        this.controllerStates[Controller.Left] = {
            beamMatrix: null,
            interactWithObj: null,
            buttonState: buttonState.left,
            joyStickState: joyStickState.left,
        }; 
        this.controllerStates[Controller.Right] = {
            beamMatrix: null,
            interactWithObj: null,
            buttonState: buttonState.right,
            joyStickState: joyStickState.right,
        }; 

        this.interactableObjs.forEach(iObj => {
            iObj.lastNState = [];

            iObj.hitGrabDragState = {
                isHit: false,
                isGrabbed: false,
                isDragged: false,
                byController: null,
                beamMatrix: null,
            }; 

            iObj.lastNState.push({
                time: -1,
                post: iObj.pos,
                hitGrabDragState: iObj.hitGrabDragState,
            });

            iObj.projectOntoBeam = (bm) => {
                const o = bm.slice(12, 15);		// get origin of beam
                const z = bm.slice( 8, 11);		// get z axis of beam
                const p = cg.subtract(P, o);	// shift point to be relative to beam origin
                const d = cg.dot(p, z);		// compute distance of point projected onto beam
                const q = cg.scale(z, d);		// find point along beam at that distance
                return cg.add(o, q);		// shift back to global space
            };

            iObj.detectHit = iObj.detectHit?iObj.detectHit:default_hit_detector.bind(iObj);
            iObj.detectGrab = iObj.detectGrab?iObj.detectHit:default_grab_handler.bind(iObj);
            iObj.detectDrag = iObj.detectDrag?iObj.detectDrag:default_grab_handler.bind(iObj);
            iObj.updatePos = iObj.updatePos?iObj.updatePos:default_position_updater.bind(iObj);
        });
    }

    updateControllerState() {
        for (const key of Object.keys(Controller)) {
            this.controllerStates[key].beamMatrix = this.controllerBeams[key].beamMatrix();
            for(iObj of interactableObjs) {
                iObj.detectHit();
            }
        }

        let isPressed   = this.buttonState.right[0].pressed;
    
        if(isPressed) {
    
        }
     }

    invokeObjsPositionUpdate() {
        for(obj of interactableObjs) {
            obj.updatePos();
            
        }
    }

    invokeObjsAngularUpdate() {
    }

    update() {
        updateControllerState();
        invokeObjsPositionUpdate();
    }
}

export const default_hit_detector = function (bm) {
    let pointOnBeam = this.projectOntoBeam(bm);
    let isHit       = cg.distance(pointOnBeam, this.pos) < this.detectionRadius;
    return [isHit, ];
 };

 export const default_grab_handler = function (bm) {
    let pointOnBeam = cb.projectOntoBeam(this.pos);
    let isHit       = cg.distance(pointOnBeam, this.pos) < this.detectionRadius;
    return [isHit, ];
 };

 export const default_drag_handler = function (bm) {
    let pointOnBeam = cb.projectOntoBeam(this.pos);
    let isHit       = cg.distance(pointOnBeam, this.pos) < this.detectionRadius;
    return [isHit, ];
 };

 export const default_position_updater = function () {
    let lastNPos = this.lastNPos;
    return newPosition;
 };
