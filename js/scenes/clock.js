import { G2 } from "../util/g2.js";
export const init = async model => {
   let g2 = new G2();
   model.txtrSrc(2, g2.getCanvas());
   let obj = model.add('square').move(0,1.5,0).scale(.2);
   model.animate(() => {
      g2.clock();
      obj.txtr(2);
   });
}
