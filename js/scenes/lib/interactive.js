import * as cg from "../../render/core/cg.js";

// Goal
// 1. Interact with multiple controllers.
// 2. Interact with multiple objs.
// 3. Hit, Grab, Drag interactions dectection.
// 4. Response and update position based on interations, and physics.
// 5. Modular, each obj can have there way of handling things.

const numNStates = 16;

export const Controller = Object.freeze({
    Left:   Symbol("Left"),
    Right:  Symbol("Right"),
});

export class InteractiveSystem {
    constructor(model, buttonState, joyStickState, leftControllerBeam, rightControllerBeam) {
        this.model = model;
        this.interactableObjs = [];
        this.buttonState = buttonState;

        this.controllerBeams = {};

        this.controllerBeams[Controller.Left] = leftControllerBeam;
        this.controllerBeams[Controller.Right] = rightControllerBeam;


        this.controllerStates = {};
        this.controllerStates[Controller.Left] = {
            controller: Controller.Left,
            beamMatrix: null,
            interactingWithIObj: null,
            buttonState: buttonState.left,
            joyStickState: joyStickState.left,
        }; 
        this.controllerStates[Controller.Right] = {
            controller: Controller.Right,
            beamMatrix: null,
            interactingWithIObj: null,
            buttonState: buttonState.right,
            joyStickState: joyStickState.right,
        }; 
    }

    addInteractableObj(iObj) {
        iObj.timestamp = -1;
        iObj.lastNStates = [];

        iObj.controllerInteractions = {
            isBeingHit: false,
            isBeingGrabbed: false,
            isBeingDragged: false,
            byController: null,
            beamMatrix: null,
        }; 

        iObj.beamMatrixPositionPairsOnEvent = {
            onHit: null,
            onGrab: null,
            onDrag: null,
            onUnDrag: null,
            onUnGrab: null,
            onUnHit: null,
        }; 

        iObj.destroy = () => {
            // console.log('Destroying object:', iObj);
            const index = this.interactableObjs.indexOf(iObj);
            if (index !== -1) {
                // console.log('Removeing from interactableObjs');
                // Remove from interactable objects list
                this.interactableObjs.splice(index, 1);
                
                // console.log('iObj.obj: ', iObj.obj, 'this.model: ', this.model);
                // Remove from model if it exists
                if (iObj.obj && this.model) {
                    // console.log('Removing from model:', iObj.obj);
                    this.model.remove(iObj.obj);
                    
                    // Clean up geometries and materials if they exist
                    if (iObj.obj.geometry) {
                        // console.log('Disposing geometry');
                        iObj.obj.geometry.dispose();
                    }
                    if (iObj.obj.material) {
                        // console.log('Disposing material');
                        if (Array.isArray(iObj.obj.material)) {
                            iObj.obj.material.forEach(material => material.dispose());
                        } else {
                            iObj.obj.material.dispose();
                        }
                    }
                    
                    // Clear any remaining references
                    iObj.obj = null;
                }
                
                // Clear all other references
                iObj.controllerInteractions = null;
                iObj.beamMatrixPositionPairsOnEvent = null;
                iObj.lastNStates = null;

                for (const [_not_real_key, key] of Object.entries(Controller)) {
                    if(this.controllerStates[key].interactingWithIObj == iObj) {
                        this.controllerStates[key].interactingWithIObj = null;
                    }
                }
            }
        };

        iObj.getLastState = () => {
            return iObj.lastNStates[iObj.lastNStates.length-1];
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
                pos: iObj.pos,
                dxyz: iObj.dxyz,
                controllerInteractions: iObj.controllerInteractions,
            });
        };

        iObj.projectOntoBeam = (bm) => {
            const o = bm.slice(12, 15);		// get origin of beam
            const z = bm.slice( 8, 11);		// get z axis of beam
            const p = cg.subtract(iObj.pos, o);	// shift point to be relative to beam origin
            const d = cg.dot(p, z);		// compute distance of point projected onto beam
            const q = cg.scale(z, d);		// find point along beam at that distance
            return cg.add(o, q);		// shift back to global space
        };
        

        // iObj.enqueueState({
        //     timestamp: iObj.timestamp,
        //     post: iObj.pos,
        //     controllerInteractions: iObj.controllerInteractions,
        // });

        // "Polyfill"
        iObj.name = iObj.name?iObj.name:'Unnamed';
        iObj.pos = iObj.pos?iObj.pos:[0, 0, 0];
        iObj.detectionRadius = iObj.detectionRadius?iObj.detectionRadius:0.05;
        iObj.dxyz = iObj.dxyz?iObj.dxyz:[0, 0, 0];
        iObj.detectHit = iObj.detectHit?iObj.detectHit:default_hit_detector.bind(iObj);
        iObj.detectGrab = iObj.detectGrab?iObj.detectHit:default_grab_detector.bind(iObj);
        iObj.detectDrag = iObj.detectDrag?iObj.detectDrag:default_drag_detector.bind(iObj);
        iObj.updatePos = iObj.updatePos?iObj.updatePos:default_position_updater.bind(iObj);
        
        iObj.onHit = iObj.onHit?iObj.onHit:() => {};
        iObj.onGrab = iObj.onGrab?iObj.onGrab:() => {};
        iObj.onDrag = iObj.onDrag?iObj.onDrag:() => {};
        iObj.onUnDrag = iObj.onUnDrag?iObj.onUnDrag:() => {};
        iObj.onUnGrab = iObj.onUnGrab?iObj.onUnGrab:() => {};
        iObj.onUnHit = iObj.onUnHit?iObj.onUnHit:() => {};
        this.interactableObjs.push(iObj);
        return iObj;
    }

    updateTimestamps() {
        const time = this.model.time;
        for(const iObj of this.interactableObjs) {
            iObj.timestamp = time;
        }
    }

    updateControllerStates() {
        for (const [_not_real_key, key] of Object.entries(Controller)) {
            const bm = this.controllerBeams[key].beamMatrix();
            const cs = this.controllerStates[key];
            cs.beamMatrix = bm;

            let shortestProjectionDistance = null;
            const prevIObj = cs.interactingWithIObj;
            let iObj = null;

            for(const iObjCandidate of this.interactableObjs) {
                if(iObjCandidate==prevIObj&&prevIObj.controllerInteractions.isBeingGrabbed) {
                    iObj = iObjCandidate;
                    break;
                }
                else if (iObjCandidate.controllerInteractions.isBeingGrabbed) {
                    continue; // Being grabbed by other controller.
                }
                const hitState = iObjCandidate.detectHit(cs);
                if(hitState.isBeingHit && (shortestProjectionDistance == null || hitState.projectionDistance < shortestProjectionDistance)) {
                    shortestProjectionDistance = hitState.projectionDistance;
                    iObj = iObjCandidate;
                }
            }

            // Unregister the old one.
            if(prevIObj && prevIObj != iObj) {
                if(prevIObj.controllerInteractions.isBeingDragged) {
                    prevIObj.controllerInteractions.isBeingDragged = false;
                    prevIObj.beamMatrixPositionPairsOnEvent.onUnDrag = [bm, prevIObj.pos];
                    prevIObj.onUnDrag();
                }
                if(prevIObj.controllerInteractions.isBeingGrabbed) {
                    prevIObj.controllerInteractions.isBeingGrabbed = false;
                    prevIObj.beamMatrixPositionPairsOnEvent.onUnGrab = [bm, prevIObj.pos];
                    prevIObj.onUnGrab();
                }
                if(prevIObj.controllerInteractions.isBeingHit) {
                    prevIObj.controllerInteractions.isBeingHit = false;
                    prevIObj.beamMatrixPositionPairsOnEvent.onUnHit = [bm, prevIObj.pos];
                    prevIObj.onUnHit();
                }
                prevIObj.controllerInteractions.byController = null;
                prevIObj.controllerInteractions.beamMatrix = null;
            }

            cs.interactingWithIObj = iObj;

            if(!iObj) continue;

            // Register the new one.
            iObj.controllerInteractions.beamMatrix = bm;
            
            if(!iObj.controllerInteractions.isBeingHit) {
                iObj.controllerInteractions.isBeingHit = true;
                iObj.beamMatrixPositionPairsOnEvent.onHit = [bm, iObj.pos];
                iObj.onHit(cs);
            }
                
            if (iObj.detectGrab(cs)) {
                if(!iObj.controllerInteractions.isBeingGrabbed) {
                    iObj.controllerInteractions.isBeingGrabbed = true;
                    iObj.beamMatrixPositionPairsOnEvent.onGrab = [bm, iObj.pos];
                    iObj.onGrab(cs);
                }
                if (iObj.detectDrag(cs)) {
                    if(!iObj.controllerInteractions.isBeingDragged) {
                        iObj.controllerInteractions.isBeingDragged = true;
                        iObj.beamMatrixPositionPairsOnEvent.onDrag = [bm, iObj.pos];
                        iObj.onDrag(cs);
                    }
                }
                else {
                    if(iObj.controllerInteractions.isBeingDragged) {
                        iObj.controllerInteractions.isBeingDragged = false;
                        iObj.beamMatrixPositionPairsOnEvent.onUnDrag = [bm, iObj.pos];
                        iObj.onUnDrag(cs);
                    }
                }
            }
            else {
                if(iObj.controllerInteractions.isBeingDragged) {
                    iObj.controllerInteractions.isBeingDragged = false;
                    iObj.beamMatrixPositionPairsOnEvent.onUnDrag = [bm, iObj.pos];
                    iObj.onUnDrag(cs);
                }
                if(iObj.controllerInteractions.isBeingGrabbed) {
                    iObj.controllerInteractions.isBeingGrabbed = false;
                    iObj.beamMatrixPositionPairsOnEvent.onUnGrab = [bm, iObj.pos];
                    iObj.onUnGrab(cs);
                }
            }
        }
     }

    updatePositions() {
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

    invokeAnimations() {
        for(const iObj of this.interactableObjs) {
            iObj.animate();
        }
    }

    update() {
        this.updateTimestamps();
        this.updateControllerStates();
        this.updatePositions();
        this.enqueueStates();
        this.invokeAnimations();
    }
}

export const default_hit_detector = function (cs) {
    const bm = cs.beamMatrix;
    const o = bm.slice(12, 15);
    const pointOnBeam = this.projectOntoBeam(bm);
    const isBeingHit = cg.distance(pointOnBeam, this.pos) < this.detectionRadius;
    const projectionDistance = cg.norm(pointOnBeam);

    return {
        isBeingHit: isBeingHit,
        projectionDistance: projectionDistance,
    };
 };

 export const default_grab_detector = function (cs) {
    const isPressed = cs.buttonState[0].pressed;
    return isPressed;
 };

 const drag_distance_threshold = 0.05;
 export const default_drag_detector = function (cs) {
    const bm = cs.beamMatrix;
    const lastState = this.getLastState();
    if(lastState&&this.controllerInteractions.isBeingGrabbed&&lastState.controllerInteractions.isBeingDragged) return true;

    // Affine transformation.
    const pointOnBeamBegin = this.projectOntoBeam(this.beamMatrixPositionPairsOnEvent.onGrab[0]);
    const pointOnBeamNow = this.projectOntoBeam(bm);
    const distance = cg.distance(pointOnBeamBegin, pointOnBeamNow);
    // console.log(distance);
    if(distance> drag_distance_threshold) return true;
    // Ignore angular transformation now.

    return false;
 };

 export const default_position_updater = function () {
    // Update position if being dragged.
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
        const newPos = cg.add(cg.add(cg.add(o_n, x_s), y_s), z_s);
        // const newPos = cg.add(cg.add(o_n, x_s), z_s);
        // const newPos = cg.add(o_n, z_s);
        this.pos = newPos;
    }
    return;
 };

 export const build_kinetic_position_updater = function (iObj, bbox=[-5, 5, 0, 10, -5, 5], g=[0, -9.8, 0], nStates = 12) {
    // console.log(iObj);
    // Update position if being dragged.

    const default_position_updater_binded = default_position_updater.bind(iObj);
    const kinetic_position_updater = function () {
        // console.log(this);
        // Apply new dxyz if isBeingGrabbed
        const lastState = this.getLastState();
        const timestamp = this.timestamp;
        const last_timestamp = lastState?lastState.timestamp:0;
        const d_timestamp = timestamp-last_timestamp;
        const lastNStates = this.lastNStates;
        
        // console.log(lastNStates);
        if (this.controllerInteractions.isBeingGrabbed) {
            default_position_updater_binded();
            // console.log(lastNStates.length);
            // Calc new dxyz based on previous M states.
            const numStatesUsed = Math.min(nStates, lastNStates.length - 1);
            // console.log(numStatesUsed);
            if (numStatesUsed > 0) {
                let weightedVelocity = [0, 0, 0];
                let totalWeight = 0;
    
                for (let i = 1; i <= numStatesUsed; i++) {
                    const prevState = lastNStates[lastNStates.length - 1 - i];
                    const nextState = lastNStates[lastNStates.length - i];
                    const dt = nextState.timestamp - prevState.timestamp;
    
                    if (dt > 0) {
                        const velocity = cg.scale(cg.subtract(nextState.pos, prevState.pos), 1 / dt);
                        const weight = 1 / i; // More recent states get higher weight.
                        weightedVelocity = cg.add(weightedVelocity, cg.scale(velocity, weight));
                        totalWeight += weight;
                    }
                }
                // console.log(weightedVelocity);
                const newDxyz = cg.scale(weightedVelocity, 1 / totalWeight);
                // if(this.dxyz!=newDxyz) console.log(newDxyz);

                if (totalWeight > 0) {
                    this.dxyz = newDxyz;
                }
            }
    
            return;
            // weightedVelocity = cg.add(weightedVelocity, [0, g * (lastNStates[lastNStates.length - 1].timestamp - lastNStates[lastNStates.length - numStatesUsed].timestamp), 0]);
        }
        else {
            this.dxyz = cg.add(this.dxyz, cg.scale(g, d_timestamp));
            const dxyz_time = cg.scale(this.dxyz, d_timestamp);
            const newPos = cg.add(this.pos, dxyz_time);
            const prevPos = lastState?lastState.pos:null;
            const prevDxyz = lastState?lastState.dxyz:null;
            // console.log(lastState);
            
            if (newPos[0] < bbox[0] && this.dxyz[0]<0) {
                this.dxyz[0] = -this.dxyz[0];
                if(prevPos&&prevPos[0] <= bbox[0]) {
                    newPos[0] = bbox[0];
                    this.dxyz[0] = 0;
                }
            }
            else if (newPos[0] > bbox[1] && this.dxyz[0]>0) {
                this.dxyz[0] = -this.dxyz[0];
                if(prevPos&&prevPos[0] >= bbox[1]) {
                    newPos[0] = bbox[1];
                    this.dxyz[0] = 0;
                }
            }
    
            if (newPos[1] < bbox[2] && this.dxyz[1]<0) {
                this.dxyz[1] = -this.dxyz[1];
                // console.log("flag1");
                if(prevPos&&prevPos[1] <= bbox[2]) {
                    newPos[1] = bbox[2];
                    this.dxyz[1] = 0;
                    // console.log("flag2");
                }
            }
            else if (newPos[1] > bbox[3] && this.dxyz[1]>0) {
                this.dxyz[1] = -this.dxyz[1];
                if(prevPos&&prevPos[1] >= bbox[3]) {
                    newPos[1] = bbox[3];
                    this.dxyz[1] = 0;
                }
            }
    
            if (newPos[2] < bbox[4] && this.dxyz[2]<0) {
                this.dxyz[2] = -this.dxyz[2];
                if(prevPos&&prevPos[2] <= bbox[4]) {
                    newPos[2] = bbox[4];
                    this.dxyz[2] = 0;
                }
            }
            else if (newPos[2] > bbox[5] && this.dxyz[2]>0) {
                this.dxyz[2] = -this.dxyz[2];
                if(prevPos&&prevPos[2] >= bbox[5]) {
                    newPos[2] = bbox[5];
                    this.dxyz[2] = 0;
                }
            }
    
            this.pos = newPos;
            return
        }
    };
    return kinetic_position_updater.bind(iObj);
 };


