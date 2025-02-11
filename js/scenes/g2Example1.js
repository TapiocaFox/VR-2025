import { G2 } from "../util/g2.js";
export const init = async model => {

   let intro = new G2().setAnimate(false);     // DRAW ONLY ONCE.
   let score = new G2();                       // REDRAW EVERY FRAME.

   model.txtrSrc(1, intro.getCanvas());        // ASSIGN TO A TEXTURE UNIT.
   model.txtrSrc(2, score.getCanvas());        // ASSIGN TO A TEXTURE UNIT.

   let introObj = model.add('square').move(0,1.7,0).scale(.4).txtr(1);
   let scoreObj = model.add('square').move(0,1.3,0).scale(.4).txtr(2);

   // THE INTRO HAS TWO DIFFERENT SIZES OF TEXT, USING ARIAL FONT.

   intro.render = function() {
      this.setFont('Arial');
      this.setColor([.5,.7,1]);
      this.textHeight(.08);
      this.text('INTRO:', -.3,.2);
      this.textHeight(.05);
      this.text('This is my cool\nnew game.', -.3,0);
   }

   // THE FRAME-BY-FRAME SCORE IS CENTERED, USING DEFAULT (COURIER) FONT.

   score.render = function() {
      this.setColor([1,0,0]);
      this.textHeight(.08);
      this.text('Score = ' + (model.time>>0), 0,0, 'center');
   }

   model.animate(() => {
      intro.update();
      score.update();
   });
}
