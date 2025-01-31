export default () => {
   return {
      enableSceneReloading: true,
      scenes: [ 
            { name: "ennichi"  , path: "./ennichi.js"  , public: true },
            { name: "example1"  , path: "./example1.js"  , public: true },
            { name: "example2"  , path: "./example2.js"  , public: true },
            { name: "example3"  , path: "./example3.js"  , public: true },
            { name: "example4"  , path: "./example4.js"  , public: true },
            { name: "example5"  , path: "./example5.js"  , public: true },
            { name: "example6"  , path: "./example6.js"  , public: true },
            { name: "example7"  , path: "./example7.js"  , public: true },
            { name: "example8"  , path: "./example8.js"  , public: true },

            { name: "simple"    , path: "./simple.js"    , public: true },
            { name: "pinscreen" , path: "./pinscreen.js" , public: true },
            { name: "opacity"   , path: "./opacity.js"   , public: true },
            { name: "intersect" , path: "./intersect.js" , public: true },
            { name: "shaders"   , path: "./shaders.js"   , public: true },
            { name: "raytrace"  , path: "./raytrace.js"  , public: true },
            { name: "particles" , path: "./particles.js" , public: true },
      ]
   };
}
