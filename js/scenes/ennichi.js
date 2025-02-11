import * as cg from "../render/core/cg.js";
// import { Diagram } from "../render/core/diagram.js";
import { buttonState, joyStickState } from "../render/core/controllerInput.js";
import { rcb, lcb } from '../handle_scenes.js'; 
import {G2} from "../util/g2.js";
import * as interactive from "./lib/interactive.js";

export const init = async model => {
   
   let g2 = new G2(false, 512);
   g2.setColor('red');

   model.txtrSrc(2, g2.getCanvas());
   // let debug_panel = model.add('square').move(-0.5,1.75,-1).turnZ(Math.PI/2).scale(.4);
   let debug_panel = model.add('square').move(-0.5,1.75,-1).scale(.2);
   debug_panel.txtr(2);

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
      buildIBall('Small Ball', 0.2, [1, 1, -2]),
      buildIBall('Mid Ball', 0.3, [0, 1, -2]),
      buildIBall('Large Ball', 0.4, [-1, 1, -2]),
   ];
   
   const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

   model.animate(() => {
      obj.identity().move(0,0.5,-1).turnX(.01 * Math.PI).scale(.1);
      
      const rightControllerIObj = iSubSys.controllerStates[interactive.Controller.Right].interactingWithIObj;
      const debug_text = `pointingAt: \n> ${rightControllerIObj?rightControllerIObj.name:'None'}`;
      
      // console.log(debug_text);
      g2.clear();
      g2.text(debug_text, 0.0, 0.0);
      g2.update();
      // debug_panel.txtr(2);

      // ball.identity().move(ballPosition).scale(ballRadius);

      iSubSys.update();
      
      const bm = rcb.beamMatrix();
      let o = bm.slice(12, 15);
      let x = bm.slice( 2, 5);
      let y = bm.slice( 5, 8);
      let z = bm.slice( 8, 11);
      debug_panel.identity().move(cg.add(o, [0, 0.1, -0.1])).turnZ(Math.PI/2).scale(.1).aimZ(z);
   });
}
