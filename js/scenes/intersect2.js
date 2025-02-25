import * as cg from "../render/core/cg.js";

// This shows how you can detect an intersection of a sphere and a box.

export const init = async model => {
   let ball = model.add('sphere');
   let box  = model.add('cube');
   model.animate(() => {
      let t = .5 * model.time;
      let s = .15 * Math.sin(t);
      let r = .125;
      ball.identity().move(-.1,1.5+s,0).turnX(t  ).turnY(t  ).scale(r);
      box .identity().move( .1,1.5-s,0).turnY(t/2).turnX(t/2).scale(.1,.125,.15);
      let m = ball.getGlobalMatrix();
      let isIntersect = cg.isSphereIntersectBox([m[12],m[13],m[14],r], box.getGlobalMatrix());
      ball.color(isIntersect ? [1,.5,.5] : [1,1,1]);
      box .color(isIntersect ? [1,.5,.5] : [1,1,1]);
   });
}

