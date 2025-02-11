// Texture mapping with a very high resolution texture.

export const init = async model => {
   model.txtrSrc(1, '../media/textures/water_vase.jpg');
   let obj = model.add('square').txtr(1);
   model.animate(() => {
      obj.identity().move(0,1.5,0).scale(.3603,.2503,1);
   });
}
