import { G2 } from "../util/g2.js";

//	This demo shows how you can add heads-up display (HUD) objects.
//	The HUD object will move together with you as you change your view,
//	and will always rotate to face you.

export const init = async model => {

   // HUD object.

   let g2A = new G2().setAnimate(false);
   g2A.render = function() {
      this.setColor([1,.5,.5]);
      this.fillOval(-1,-1,2,2);
   }
   model.txtrSrc(1,g2A.getCanvas());
   let objA = model.add('square').txtr(1);

   // non-HUD object.

   let g2B = new G2().setAnimate(false);
   g2B.render = function() {
      this.setColor([.5,.5,1]);
      this.fillOval(-1,-1,2,2);
   }
   model.txtrSrc(2,g2B.getCanvas());
   let objB = model.add('square').move(0,1.5,-1.5).scale(.2).txtr(2);

   model.animate(() => {
      g2A.update();
      g2B.update();

      objA.hud().scale(.2); // hud() MUST BE CALLED EACH ANIMATION FRAME.
   });
}
