// This is a very simple scene of a rotating object.

export const init = async model => {
   let obj = model.add();
   obj.add('torusX');
   obj.add('cube').opacity(.5);
   model.animate(() => {
      obj.identity().move(0,1.5,0).turnY(model.time).scale(.2);
   });
}
