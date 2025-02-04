import * as cg from "../render/core/cg.js";

export const init = async model => {
   model.txtrSrc(1, '../media/textures/chessboard.png');
   // model.txtrSrc(1, '../media/textures/ennichi.jpg');
   clay.defineMesh('myTerrain', clay.createGrid(10, 10));
   // clay.defineMesh('myTerrain', clay.createGrid(10, 10));
   let terrain = model.add('myTerrain').txtr(1);
   // let terrain = model.add('myTerrain').txtr(1);
   // let terrain = model.add('tubeY').txtr(1);
   
   model.animate(() => {
      terrain.identity().move(-0.5,1.5,0).turnX(-.1 * Math.PI).scale(.4);
      terrain.setVertices((u,v) => [
         3*u,                                          // x
	 2*v-1,                                        // y
	//  .4*u*cg.noise(3*u-model.time,3*v, model.time) // z
	 .4*u*cg.noise(3*u-model.time,3*v, model.time) // z
       ]);
   });
}

