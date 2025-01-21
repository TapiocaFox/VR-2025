import * as global from "../global.js";
import { Gltf2Node } from "../render/nodes/gltf2.js";

export let buddha;

export default () => {
   global.scene().addNode(new Gltf2Node({
      url: ""
   })).name = "backGround";

   return {
      enableSceneReloading: true,
      scenes: [ 
            { name: "example1"           , path: "./example1.js"           , public: false },
            { name: "example2"           , path: "./example2.js"           , public: false },
            { name: "example3"           , path: "./example3.js"           , public: false },
            { name: "example4"           , path: "./example4.js"           , public: false },
            { name: "example5"           , path: "./example5.js"           , public: false },
            { name: "example6"           , path: "./example6.js"           , public: false },
            { name: "example7"           , path: "./example7.js"           , public: false },
            { name: "example8"           , path: "./example8.js"           , public: false },
      ]
   };
}

