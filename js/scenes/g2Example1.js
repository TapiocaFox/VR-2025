import { G2 } from "../util/g2.js";
export const init = async model => {

   let intro = new G2(true);                   // DRAW ONLY ONCE.
   let score = new G2();                       // REDRAW EVERY FRAME.

   model.txtrSrc(1, intro.getCanvas());        // ASSIGN TO A TEXTURE UNIT.
   model.txtrSrc(2, score.getCanvas());        // ASSIGN TO A TEXTURE UNIT.

   let introObj = model.add('square').txtr(1); // USE TO TEXTURE AN OBJECT.
   let scoreObj = model.add('square').txtr(2); // USE TO TEXTURE AN OBJECT.

   model.animate(() => {

      // INTRO IS IN TWO DIFFERENT SIZES OF TEXT, USING ARIAL FONT.

      intro.setFont('Arial');
      intro.setColor([.5,.7,1]);

      intro.textHeight(.08);
      intro.text('INTRO:', -.3,.2);

      intro.textHeight(.05);
      intro.text('This is my cool\nnew game.', -.3,0);

      introObj.identity().move(0,1.7,0).scale(.4);

      // FRAME-BY-FRAME SCORE IS CENTERED, USING DEFAULT (COURIER) FONT.

      score.clear();           // CLEAR THE ANIMATED CANVAS BEFORE DRAWING.
      score.setColor([1,0,0]);
      score.text('Score = ' + (model.time>>0), 0,0, 'center');
      scoreObj.identity().move(0,1.3,0).scale(.4);
   });
}
