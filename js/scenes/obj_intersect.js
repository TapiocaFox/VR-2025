import * as cg from "../render/core/cg.js";

// This show how you can detect an intersection of two boxes.

export const init = async model => {
   // let box1 = model.add('cube');
   // let box2 = model.add('cube');
   clay.defineMeshFromObjSrc('teapot', '../media/objs/teapot.obj');
   clay.defineMeshFromObjSrc('monkey', 'https://raw.githubusercontent.com/kivy/kivy/refs/heads/master/examples/3Drendering/monkey.obj');
   let teapot = model.add('teapot');
   let monkey = model.add('monkey');
   model.animate(() => {
      let t = .5 * model.time;
      let s = .2 * Math.sin(t);
      monkey.identity().move(-.2,1.5+s,0).turnX(t  ).turnY(t  ).scale(.3,.2,.1);
      // box2.identity().move( .2,1.5-s,0).turnY(t/2).turnX(t/2).scale(.2);
      teapot.identity().move( .2,1.5-s,0).turnY(t/2).turnX(t/2).scale(.1);
      // let isIntersect = cg.isBoxIntersectBox(box1.getGlobalMatrix(), box2.getGlobalMatrix());
      let isIntersect = cg.isBoxIntersectBox(monkey.getGlobalMatrix(), teapot.getGlobalMatrix());
      monkey.color(isIntersect ? [1,.5,.5] : [1,1,1]);
      // box2.color(isIntersect ? [1,.5,.5] : [1,1,1]);
      teapot.color(isIntersect ? [1,.5,.5] : [1,1,1]);
   });
}

