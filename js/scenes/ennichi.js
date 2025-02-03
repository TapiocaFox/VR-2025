import * as cg from "../render/core/cg.js";


export const init = async model => {
   model.txtrSrc(1, '../media/textures/chessboard.png');
   // clay.defineMesh('myTerrain', clay.createGrid(30, 30));
   // console.log('clay');
   // console.log(clay);
   // let poolMesh = clay.glueMeshes(clay.buildTubeZMesh())
   // clay.defineMesh('myTerrain', );
//    let terrain = model.add('myTerrain').txtr(1);
   // let terrain = model.add('cube').txtr(1);
   clay.defineMeshFromObjSrc('obj', '../media/objs/pool.obj');
   // clay.defineMeshFromObjSrc('obj', '../media/objs/teapot.obj');
   let obj = model.add('obj').txtr(1);
   // let cube = model.add('sphere');
   model.animate(() => {
      obj.identity().move(0,1,0).turnX(-.0 * Math.PI).turnY(model.time).scale(.1);
      // cube.identity().move(0,1.5,0).turnX(-.1 * Math.PI).scale(.4);
   //    terrain.setVertices((u,v) => [
   //       3*u,                                          // x
   //   2*v-1,                                        // y
   //   .4*u*cg.noise(3*u-model.time,3*v, model.time) // z
      //  ]);
   });
}
