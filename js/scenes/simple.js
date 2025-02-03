// This is a very simple scene of a rotating object.

export const init = async model => {
   let obj = model.add('octahedron');
   model.animate(() => {
      obj.identity().move(0,1.5,0).turnY(model.time).scale(.1);
   });
}
