// Add procedural textures to objects in a scene.

// To associate an object with shader code, you
// declare a flag for that shader code in your
// fragment shader, and set that flag to true
// for any object that uses it.

// In the example below, there are three cubes.
// The first is untextured, the second has a noise
// texture, and the third has a stripe texture.

// Note that all the shader code is declared
// in the same customShader, and the flags are
// used to turn any given texture on or off for
// various objects in the scene.

export const init = async model => {
   let box0 = model.add('cube'); // Untextured box
   let box1 = model.add('cube'); // Noise textured box
   let box2 = model.add('cube'); // Stripe textured box

   model.animate(() => {
      box1.flag('uNoiseTexture');
      box2.flag('uStripeTexture');
      box2.flag('uMakeItBlue');

      model.customShader(`
         uniform int uNoiseTexture;	// Put any declarations or functions
         uniform int uStripeTexture;    // before the dashed line.
         uniform int uMakeItBlue;
         --------------------------
         if (uNoiseTexture == 1)
            color *= (.5 + noise(2. * vAPos + .5*uTime)) * vec3(.1,.5,1.);
         if (uStripeTexture == 1)
            color *= .5 + .5 * sin(30. * vAPos.x * vAPos.y * vAPos.z + 3.*uTime);
         if (uMakeItBlue == 1)
            color *= vec3(0.,.3,1.);
      `);

      box0.identity().move(-.6,1.6,0).turnY(.1*model.time).turnX(.1*model.time).scale(.2);
      box1.identity().move( .0,1.6,0).turnY(.1*model.time).turnX(.1*model.time).scale(.2);
      box2.identity().move( .6,1.6,0).turnY(.1*model.time).turnX(.1*model.time).scale(.2);
   });
}

