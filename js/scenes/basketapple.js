import * as cg from "../render/core/cg.js";
// import { Diagram } from "../render/core/diagram.js";
import { buttonState, joyStickState } from "../render/core/controllerInput.js";
import { rcb, lcb } from '../handle_scenes.js'; 
import {G2} from "../util/g2.js";
import * as interactive from "./lib/interactive.js";

function randomFromInterval(min, max) { 
   return Math.random() * (max - min) + min;
}
let score = 0;
let badAppleScore = -2;
let goodAppleScore = 3;
let badAppleRatio = 0.66;

const bbox_scale = 1.5;

export const init = async model => {

   const hudG2 = new G2().setAnimate(true);
   hudG2.render = function() {
      const text = `Score: ${score}`;
      this.setColor('white');
      this.textHeight(.05);
      this.text(text, -0.25, 0.0);
   }
   model.txtrSrc(1,hudG2.getCanvas());
   const hudObj = model.add('square').txtr(1);
   

   // const hoop = model.add();
   clay.defineMesh('hoop', clay.combineMeshes([
      [ 'square', cg.mIdentity(), [1,.5,.5] ], // shape, matrix, color
      [ 'torusY', cg.mMultiply(cg.mTranslate(0, -0.33, 0.5), cg.mScale(0.5)), [205/255,133/255,63/255] ], // shape, matrix, color
   ]));

   const buildIBall = (name, radius, pos, dxyz, rot, isBad) => {
      const iObj = {
         name: name,
         obj: model.add('sphere'),
         pos: pos,
         // dxyz: [0, 0.1, 0],
         dxyz: dxyz,
         detectionRadius: radius,
         isBad: isBad,
         wasInHitbox: false,
         animate: function () {
            this.obj.identity().move(this.pos).turnY(rot).scale(radius);
            const m = this.obj.getGlobalMatrix();
            const isIntersect = cg.isSphereIntersectBox([m[12],m[13],m[14],radius], hitbox.getGlobalMatrix());
            // const isIntersect = cg.isSphereIntersectBox([pos[0],pos[1],pos[2],radius], hitbox.getGlobalMatrix());
            // console.log('animate, m: ', [m[12],m[13],m[14],radius]);
            if(this.wasInHitbox&&!isIntersect) {
               score += this.isBad?badAppleScore:goodAppleScore;
               // this.obj.color('white');
               this.pos = randPos();
            }
            this.wasInHitbox = isIntersect;
         },

         onHit: function (cs) { console.log(`onHit by controller: ${cs.controller.toString()}`); this.obj.color([1,.5,.5]); },
         onGrab: function (cs) { console.log('onGrab'); this.obj.color(isBad?[0,0,1]:[1,0,0]);},
         onDrag: function (cs) { console.log('onDrag'); this.obj.color([0,1,0]); },
         onUnDrag: function (cs) { console.log('onUnDrag'); this.obj.color(isBad?[0,1,0]:[1,0,0]); },
         onUnGrab: function (cs) { 
            console.log('onUnGrab'); 
         },
         onUnHit: function (cs) { console.log('onUnHit'); this.obj.color('white'); },
         // onIdle: function () {},
         // onMoving: function () {},
      };

      iObj.updatePos = interactive.build_kinetic_position_updater(iObj, [-bbox_scale, bbox_scale, 0, 5, -bbox_scale, bbox_scale], [0, -9.8, 0]);
      return iObj;
   }

   const randPos = () => {
      return [randomFromInterval(-bbox_scale, bbox_scale), 0, randomFromInterval(-bbox_scale, bbox_scale)];
   };

   const randomVector = (v) => {
      return [randomFromInterval(-v, v), randomFromInterval(-v, v), randomFromInterval(-v, v)];
   };
   const interactableObjs = [
   ];

   for(let i=0; i<12; i++) {
      const isBad = Math.random() < badAppleRatio;
      interactableObjs.push(buildIBall(`${isBad?'Bad':'Good'}`, 0.085, randPos(), 
      // [randomFromInterval(-2, 2), randomFromInterval(0, 15), randomFromInterval(-2, 2)], randomFromInterval(0, Math.PI), isBad));
      [0, 0, 0], randomFromInterval(0, Math.PI), isBad));
   }

   // randomVector(0.05)

   const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);


   const hoop = model.add('hoop');
   const hitbox = model.add('cube');

   hoop.identity().move(0,1,-1.5).scale(0.3);
   hitbox.identity().move(0,.855,-1.4).scale([0.15, 0.01, 0.15]).opacity(.0);

   model.animate(() => {
      iSubSys.update();
      hudG2.update();
      hudObj.hud();
   });
}
