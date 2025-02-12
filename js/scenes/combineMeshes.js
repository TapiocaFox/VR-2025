import * as cg from "../render/core/cg.js";

// Multiple primitives can be combined into a single mesh.
// In a scene with many primitives, this can reduce the number of draw calls,
// and therefore allow a scene to be rendered at a high frame rate.

export const init = async model => {
   clay.defineMesh('twoCubes', clay.combineMeshes([
      [ 'cube', cg.mTranslate(1,0,0  ), [1,.5,.5] ], // shape, matrix, color
      [ 'tubeY', cg.mScale    (.5,.5,2), [1,1,0  ] ], // shape, matrix, color
   ]));
   let twoCubes = model.add('twoCubes');
   model.move(0,1.5,0).scale(.1).animate(() => {
      twoCubes.identity().turnZ(model.time/2).turnY(model.time/2).turnZ(model.time);
   });
}

