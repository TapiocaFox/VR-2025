import * as global from "../global.js";
import { Gltf2Node } from "../render/nodes/gltf2.js";

let statue = new Gltf2Node({ url: './media/gltf/buddha_statue_broken/scene.gltf' });

export const init = async model => {
    statue.translation = [0, 1.5, 0];
    statue.scale = [1.3,1.3,1.3];
    global.gltfRoot.addNode(statue);
    model.txtrSrc(1, 'media/textures/concrete.png');
    model.add('cube').move(0,1.508,0).scale(.2,.01,.2).txtr(1).flag('uShadow');
    model.customShader(`
       uniform int uShadow;
       --------------------
       if (uShadow == 1 && vAPos.y > 0.)
          color *= min(1.,mix(-.5,1.3,length(vAPos.xz)));
    `);
    model.animate(() => {
    });
 }

