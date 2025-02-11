import * as cg from "../render/core/cg.js";
// import { Diagram } from "../render/core/diagram.js";
import { buttonState, joyStickState } from "../render/core/controllerInput.js";
import { rcb, lcb } from '../handle_scenes.js'; 
import {G2} from "../util/g2.js";
import * as interactive from "./lib/interactive.js";

function randomFromInterval(min, max) { 
   return Math.random() * (max - min) + min;
 }

export const init = async model => {
   
   const left_g2 = new G2(false, 512);
   left_g2.setColor('blue');

   const right_g2 = new G2(false, 512);
   right_g2.setColor('red');

   model.txtrSrc(1, left_g2.getCanvas());
   model.txtrSrc(2, right_g2.getCanvas());
   // let debug_panel = model.add('square').move(-0.5,1.75,-1).turnZ(Math.PI/2).scale(.4);
   let left_debug_panel = model.add('square');
   let right_debug_panel = model.add('square');
   left_debug_panel.txtr(1);
   right_debug_panel.txtr(2);

   model.txtrSrc(1, '../media/textures/ennichi-flipped-y.jpg');
   clay.defineMesh('terrain', clay.createGrid(32, 32));
   clay.defineMeshFromObjSrc('obj', '../media/objs/pool.obj');
   // clay.defineMeshFromObjSrc('obj', '../media/objs/teapot.obj');
   
   let wall_from = [-8, 2, -8];
   let wall_to = [8, 10, 8];

   let obj = model.add('obj');

   // let terrain = model.add('terrain').move(0,2,-3.5).scale(4.5, 3., 1.5).txtr(1);
   const buildIBall = (name, radius, pos) => {
      return {
         name: name,
         obj: model.add('sphere'),
         pos: pos,
         detectionRadius: radius,
         animate: function () {
            this.obj.identity().move(this.pos).scale(this.detectionRadius);
         },

         onHit: function (cs) { console.log(`onHit by controller: ${cs.controller.toString()}`); this.obj.color([1,.5,.5]); },
         onGrab: function (cs) { console.log('onGrab'); this.obj.color([1,0,0]);},
         onDrag: function (cs) { console.log('onDrag'); this.obj.color([0,1,0]); },
         onUnDrag: function (cs) { console.log('onUnDrag'); this.obj.color([1,0,0]); },
         onUnGrab: function (cs) { console.log('onUnGrab'); this.obj.color([1,.5,.5]); },
         onUnHit: function (cs) { console.log('onUnHit'); this.obj.color('white'); },
         // onIdle: function () {},
         // onMoving: function () {},
      };
   }
   const interactableObjs = [
      buildIBall('Tiny Ball', 0.1, [1.5, 1, -2]),
      buildIBall('Small Ball', 0.2, [1, 1, -2]),
      buildIBall('Mid Ball', 0.3, [0.25, 1, -2]),
      buildIBall('Large Ball', 0.4, [-0.75, 1, -2]),
      buildIBall('ExLarge Ball', 0.5, [-2., 1, -2]),
   ];

   for(let i=0; i<32; i++) {
      interactableObjs.push(buildIBall(`Rand Ball ${i}`, randomFromInterval(0.05, 0.10), [randomFromInterval(-2, 2), 0, randomFromInterval(-2, 2)]));
   }
   
   const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

   model.animate(() => {
      obj.identity().move(0,0.5,-1).turnX(.01 * Math.PI).scale(.1);
      iSubSys.update();

      const lcs = iSubSys.controllerStates[interactive.Controller.Left];
      const rcs = iSubSys.controllerStates[interactive.Controller.Right];

      const leftControllerIObj = lcs.interactingWithIObj;
      const rightControllerIObj = rcs.interactingWithIObj;

      const left_debug_text = `pointingAt: \n> ${leftControllerIObj?leftControllerIObj.name:'None'}`;
      const right_debug_text = `pointingAt: \n> ${rightControllerIObj?rightControllerIObj.name:'None'}`;
      
      left_g2.clear();
      left_g2.text(left_debug_text, 0.0, 0.0);
      left_g2.update();

      right_g2.clear();
      right_g2.text(right_debug_text, 0.0, 0.0);
      right_g2.update();
      
      const lbm = lcs.beamMatrix;
      const lo = lbm.slice(12, 15);
      const lx = lbm.slice( 0, 3);
      const ly = lbm.slice( 4, 7);
      const lz = lbm.slice( 8, 11);
      const lxy = cg.normalize([lz[0], 0, lz[2]]);
      left_debug_panel.identity().move(cg.add(lo, [-0.2*lxy[0], 0.1, -0.2*lxy[2]])).scale(.1).aimZ(lxy).turnZ(Math.PI/2);

      const rbm = rcs.beamMatrix;
      const ro = rbm.slice(12, 15);
      const rx = rbm.slice( 0, 3);
      const ry = rbm.slice( 4, 7);
      const rz = rbm.slice( 8, 11);
      const rxy = cg.normalize([rz[0], 0, rz[2]]);
      right_debug_panel.identity().move(cg.add(ro, [-0.2*rxy[0], 0.1, -0.2*rxy[2]])).scale(.1).aimZ(rxy).turnZ(Math.PI/2);
      // right_debug_panel.identity().move(cg.add(ro, [0, 0.1, -0.1])).aimX([0, 1, 0]).scale(.1);
      
   });
}
