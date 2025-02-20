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

const tableMinX = -0.33;
const tableMaxX = 0.33;
const tableMinY = 0.3;
const tableMaxY = 0.5;
const tableMinZ = -1.17;
const tableMaxZ = -0.65;

function isPositionOnTheTable(pos) {
   const x = pos[0];
   const y = pos[1];
   const z = pos[2];
   if(x<tableMinX||x>tableMaxX) return false;
   if(y<tableMinY||y>tableMaxY) return false;
   if(z<tableMinZ||z>tableMaxZ) return false;
   return true;
}

export const init = async model => {
   
   const left_g2 = new G2(false, 1024);
   left_g2.setColor('blue');

   const right_g2 = new G2(false, 1024);
   right_g2.setColor('red');

   model.txtrSrc(1, left_g2.getCanvas());
   model.txtrSrc(2, right_g2.getCanvas());
   // let debug_panel = model.add('square').move(-0.5,1.75,-1).turnZ(Math.PI/2).scale(.4);
   let left_debug_panel = model.add('square');
   let right_debug_panel = model.add('square');
   left_debug_panel.txtr(1);
   right_debug_panel.txtr(2);

   clay.defineMeshFromObjSrc('table', '../media/objs/table.obj');
   clay.defineMeshFromObjSrc('apple', '../media/objs/apple.obj');
   // clay.defineMeshFromObjSrc('obj', '../media/objs/teapot.obj');

   const table = model.add('table');

   // let terrain = model.add('terrain').move(0,2,-3.5).scale(4.5, 3., 1.5).txtr(1);
   const buildIBall = (name, radius, pos, dxyz, rot, isBad) => {
      const iObj = {
         name: name,
         obj: model.add('apple'),
         pos: pos,
         // dxyz: [0, 0.1, 0],
         dxyz: dxyz,
         detectionRadius: radius,
         isBad: isBad,
         wasOnTable: false,
         animate: function () {
            this.obj.identity().move(this.pos).turnY(rot).scale(0.75);
         },

         onHit: function (cs) { console.log(`onHit by controller: ${cs.controller.toString()}`); this.obj.color([1,.5,.5]); },
         onGrab: function (cs) { console.log('onGrab'); this.obj.color(isBad?[0,0,1]:[1,0,0]);},
         onDrag: function (cs) { console.log('onDrag'); this.obj.color([0,1,0]); },
         onUnDrag: function (cs) { console.log('onUnDrag'); this.obj.color(isBad?[0,1,0]:[1,0,0]); },
         onUnGrab: function (cs) { 
            console.log('onUnGrab'); 
            this.obj.color([1,.5,.5]); 
            if(!this.wasOnTable&&isPositionOnTheTable(this.pos)) {
               score += this.isBad?badAppleScore:goodAppleScore;
               this.wasOnTable = true;
            }
         },
         onUnHit: function (cs) { console.log('onUnHit'); this.obj.color('white'); },
         // onIdle: function () {},
         // onMoving: function () {},
      };

      iObj.updatePos = interactive.build_kinetic_position_updater(iObj, [-2, 2, 0, 5, -2, 2]);
      return iObj;
   }

   const randomVector = (v) => {
      return [randomFromInterval(-v, v), randomFromInterval(-v, v), randomFromInterval(-v, v)];
   };
   const interactableObjs = [
   ];

   for(let i=0; i<8; i++) {
      const isBad = Math.random() < badAppleRatio;
      interactableObjs.push(buildIBall(`${isBad?'Bad':'Good'}`, 0.085, [randomFromInterval(-2, 2), 0, randomFromInterval(-2, 2)], 
      // [randomFromInterval(-2, 2), randomFromInterval(0, 15), randomFromInterval(-2, 2)], randomFromInterval(0, Math.PI), isBad));
      [0, 0, 0], randomFromInterval(0, Math.PI), isBad));
   }

   // randomVector(0.05)

   const iSubSys = new interactive.InteractiveSystem(model, interactableObjs, buttonState, joyStickState, lcb, rcb);

   const lcs = iSubSys.controllerStates[interactive.Controller.Left];
   const rcs = iSubSys.controllerStates[interactive.Controller.Right];

   right_g2.render = function() {
      const rightControllerIObj = rcs.interactingWithIObj;
      const right_debug_text = `Put Apple on\nthe table.\nApple Type: \n> ${rightControllerIObj?rightControllerIObj.name:'None'}\nPos: \n${rightControllerIObj?rightControllerIObj.pos.map(it => {return it.toFixed(2);}):'None'}\nonTable: ${rightControllerIObj?isPositionOnTheTable(rightControllerIObj.pos):'None'}\nScore: ${score}`;
      this.textHeight(.05);
      this.text(right_debug_text, 0.0, 0.0);
   };

   left_g2.render = function() {
      const leftControllerIObj = lcs.interactingWithIObj;
      const left_debug_text = `Put Apple on\nthe table.\nApple Type: \n> ${leftControllerIObj?leftControllerIObj.name:'None'}\nPos: \n${leftControllerIObj?leftControllerIObj.pos.map(it => {return it.toFixed(2);}):'None'}\nonTable: ${leftControllerIObj?isPositionOnTheTable(leftControllerIObj.pos):'None'}\nScore: ${score}`;
      left_g2.textHeight(.05);
      left_g2.text(left_debug_text, 0.0, 0.0);
   };

   model.animate(() => {
      table.identity().move(0,0,-1).turnX(.01 * Math.PI).scale(1);
      iSubSys.update();

      left_g2.update();
      right_g2.update();
      
      const lbm = lcs.beamMatrix;
      const lo = lbm.slice(12, 15);
      const lx = lbm.slice( 0, 3);
      const ly = lbm.slice( 4, 7);
      const lz = lbm.slice( 8, 11);
      const lxy = cg.normalize([lz[0], 0, lz[2]]);
      left_debug_panel.identity().move(cg.add(lo, [-0.2*lxy[0], 0.05, -0.2*lxy[2]])).scale(.1).aimZ(lxy);
      // left_debug_panel.identity().move(lo).scale(.1);

      const rbm = rcs.beamMatrix;
      const ro = rbm.slice(12, 15);
      const rx = rbm.slice( 0, 3);
      const ry = rbm.slice( 4, 7);
      const rz = rbm.slice( 8, 11);
      const rxy = cg.normalize([rz[0], 0, rz[2]]);
      right_debug_panel.identity().move(cg.add(ro, [-0.2*rxy[0], 0.05, -0.2*rxy[2]])).scale(.1).aimZ(rxy);
      // right_debug_panel.identity().move(cg.add(ro, [0, 0.1, -0.1])).aimX([0, 1, 0]).scale(.1);
   });
}
