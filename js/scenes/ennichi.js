import * as cg from "../render/core/cg.js";
import {Diagram} from "../render/core/diagram.js";
import {G2} from "../util/g2.js";


export const init = async model => {
   model.txtrSrc(1, '../media/textures/ennichi-flipped-y.jpg');
   clay.defineMesh('terrain', clay.createGrid(32, 32));
   clay.defineMeshFromObjSrc('obj', '../media/objs/pool.obj');
   // clay.defineMeshFromObjSrc('obj', '../media/objs/teapot.obj');
   let obj = model.add('obj');
   let terrain = model.add('terrain').txtr(1);
   model.animate(() => {
      obj.identity().move(0,0.5,-1).turnX(.01 * Math.PI).scale(.1);
      terrain.identity().move(0,2,-3.5).scale(4.5, 3., 1.5);
      // cube.identity().move(0,1.5,0).turnX(-.1 * Math.PI).scale(.4);
      // terrain.setVertices((u,v) => [
      //    u,                                          // x
      //    v,                                        // y
      //    .4*u*cg.noise(3*u-model.time,3*v, model.time) // z
      //  ]);
   });
}
