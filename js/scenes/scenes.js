export default () => {
   return {
      enableSceneReloading: true,
      scenes: [ 
            { name: "example1"  , path: "./example1.js"  , public: false },
            { name: "example2"  , path: "./example2.js"  , public: false },
            { name: "example3"  , path: "./example3.js"  , public: false },
            { name: "example4"  , path: "./example4.js"  , public: false },
            { name: "example5"  , path: "./example5.js"  , public: false },
            { name: "example6"  , path: "./example6.js"  , public: false },
            { name: "example7"  , path: "./example7.js"  , public: false },
            { name: "example8"  , path: "./example8.js"  , public: false },

            { name: "simple"    , path: "./simple.js"    , public: false },
            { name: "pinscreen" , path: "./pinscreen.js" , public: false },
            { name: "opacity"   , path: "./opacity.js"   , public: false },
            { name: "intersect" , path: "./intersect.js" , public: false },
            { name: "shaders"   , path: "./shaders.js"   , public: false },
            { name: "raytrace"  , path: "./raytrace.js"  , public: false },
            { name: "particles" , path: "./particles.js" , public: false },

            { name: "controllerBeam" , path: "./controllerBeam.js" , public: true },
            { name: "diagram1"       , path: "./diagram1.js"       , public: true },
            { name: "clock"          , path: "./clock.js"          , public: true },
            { name: "particleNoise"  , path: "./particleNoise.js"  , public: true },

            { name: "g2Example1" , path: "./g2Example1.js" , public: true },
      ]
   };
}
