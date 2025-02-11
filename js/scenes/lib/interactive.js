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
    constructor(model, interactableObjs, buttonState, joyStickState, leftControllerBeam, rightControllerBeam) {
        this.model = model;
        this.interactableObjs = interactableObjs;
        this.buttonState = buttonState;

        this.controllerBeams = {};

        this.controllerBeams[Controller.Left] = leftControllerBeam;
        this.controllerBeams[Controller.Right] = rightControllerBeam;

        this.controllerStates = {};
        this.controllerStates[Controller.Left] = {
            beamMatrix: null,
            interactingWithIObj: null,
            buttonState: buttonState.left,
            joyStickState: joyStickState.left,
        }; 
        this.controllerStates[Controller.Right] = {
            beamMatrix: null,
            interactingWithIObj: null,
            buttonState: buttonState.right,
            joyStickState: joyStickState.right,
        }; 

        this.interactableObjs.forEach(iObj => {
            iObj.timestamp = -1;
            iObj.lastNStates = [];

            iObj.controllerInteractions = {
                isBeingHit: false,
                isBeingGrabbed: false,
                isBeingDragged: false,
                byController: null,
                beamMatrix: null,
            }; 

            iObj.enqueueState = (state) => {
                iObj.lastNStates.push(state);
                while(iObj.lastNStates.length>numNStates) {
                    iObj.lastNStates.shift();
                }
            };

            iObj.enqueueCurrentState = () => {
                iObj.enqueueState({
                    timestamp: iObj.timestamp,
                    post: iObj.pos,
                    controllerInteractions: iObj.controllerInteractions,
                });
            };

            iObj.projectOntoBeam = (bm) => {
                const o = bm.slice(12, 15);		// get origin of beam
                const z = bm.slice( 8, 11);		// get z axis of beam
                const p = cg.subtract(P, o);	// shift point to be relative to beam origin
                const d = cg.dot(p, z);		// compute distance of point projected onto beam
                const q = cg.scale(z, d);		// find point along beam at that distance
                return cg.add(o, q);		// shift back to global space
            };

            // iObj.enqueueState({
            //     timestamp: iObj.timestamp,
            //     post: iObj.pos,
            //     controllerInteractions: iObj.controllerInteractions,
            // });

            iObj.detectHit = iObj.detectHit?iObj.detectHit:default_hit_detector.bind(iObj);
            iObj.detectGrab = iObj.detectGrab?iObj.detectHit:default_grab_handler.bind(iObj);
            iObj.detectDrag = iObj.detectDrag?iObj.detectDrag:default_grab_handler.bind(iObj);
            iObj.updatePos = iObj.updatePos?iObj.updatePos:default_position_updater.bind(iObj);
        });
    }

    updateTimestamps() {
        const time = this.model.time;
        for(const iObj of this.interactableObjs) {
            iObj.timestamp = time;
        }
    }

    updateControllerStates() {
        for (const key of Object.keys(Controller)) {
            const bm = this.controllerBeams[key].beamMatrix();
            const cs = this.controllerStates[key];
            cs.bm = bm;

            let shortestProjectionDistance = null;
            let iObj = null;

            for(const iObjCandidate of this.interactableObjs) {
                const hitState = iObjCandidate.detectHit(cs);
                if(hitState.isBeingHit && hitState.projectionDistance < shortestProjectionDistance) {
                    shortestProjectionDistance = hitState.projectionDistance;
                    iObj = iObjCandidate;
                }
            }

            const prevIObj = cs.interactingWithIObj;
            if(prevIObj != iObj) {
                if(prevIObj.controllerInteractions.isBeingDragged) {
                    prevIObj.onUnDrag();
                    prevIObj.controllerInteractions.isBeingDragged = false;
                }
                if(prevIObj.controllerInteractions.isBeingGrabbed) {
                    prevIObj.onUnGrab();
                    prevIObj.controllerInteractions.isBeingGrabbed = false;
                }
                if(prevIObj.controllerInteractions.isBeingHit) {
                    prevIObj.onUnHit();
                    prevIObj.controllerInteractions.isBeingHit = false;
                }
                prevIObj.controllerInteractions.byController = null;
                prevIObj.controllerInteractions.beamMatrix = null;
                cs.interactingWithIObj = iObj;
            }

            if(!iObj.controllerInteractions.isBeingHit)
                iObj.onHit();
            iObj.controllerInteractions.isBeingHit = true;
            if (iObj.detectGrab(cs)) {
                if(!iObj.controllerInteractions.isBeingGrabbed)
                    iObj.onGrab();
                iObj.controllerInteractions.isBeingGrabbed = true;
                if (iObj.detectDrag(cs)) {
                    if(!iObj.controllerInteractions.isBeingDragged)
                        iObj.onDrag();
                    iObj.controllerInteractions.isBeingDragged = true;
                }
            }
        }
     }

    invokeObjsPositionUpdate() {
        for(const iObj of this.interactableObjs) {
            iObj.updatePos();
        }
    }

    invokeObjsAngularUpdate() {
    }

    enqueueStates() {
        for(const iObj of this.interactableObjs) {
            iObj.enqueueCurrentState();
        }
    }

    update() {
        this.updateTimestamps();
        this.updateControllerStates();
        this.invokeObjsPositionUpdate();
        this.enqueueStates();
    }
}

export const default_hit_detector = function (cs) {
    const bm = cs.beamMatrix;
    const o = bm.slice(12, 15);
    const pointOnBeam = this.projectOntoBeam(bm);
    const isBeingHit = cg.distance(pointOnBeam, this.pos) < this.detectionRadius;
    let projectionDistance = cg.distance(pointOnBeam, 0);
    return {
        isBeingHit: isBeingHit,
        projectionDistance: projectionDistance,
    };
 };

 export const default_grab_handler = function (controller, bm) {
    const isPressed = cs.buttonState.pressed;
    return isPressed;
 };

 export const default_drag_handler = function (controller, bm) {
    
    return false;
 };

 export const default_position_updater = function () {
    let lastNPos = this.lastNPos;
    return newPosition;
 };
