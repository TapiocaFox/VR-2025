// This shows how you can make transparent objects.

export const init = async model => {

   // NOTE: Creation order matters when rendering transparent objects.
   //       Transparent objects need to render *after* opaque objects.

   let cubes = model.add();
   let cube1 = cubes.add('cube').color(1,0,1).move(-2.5,0,0).opacity(.5);
   let cube2 = cubes.add('cube').color(1,1,0);
   let cube3 = cubes.add('cube').color(0,1,1).move( 2.5,0,0).opacity(.5);

   model.move(0,1.5,0).scale(.1).animate(() => {
      cubes.identity().turnZ(0.3 * model.time)
                      .turnY(1.0 * model.time);
   });
}
