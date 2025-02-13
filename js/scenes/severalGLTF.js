// Multiple GLTF files loaded into the same scene, together with other textures.
// Note: Each GLTF file needs its own unique texture unit, which is set in its "txtr" field.

import * as global from "../global.js";
import { quat } from "../render/math/gl-matrix.js";
import { Gltf2Node } from "../render/nodes/gltf2.js";

let buddha = new Gltf2Node({ url: './media/gltf/buddha_statue_broken/scene.gltf', txtr: 14 });
let box    = new Gltf2Node({ url: './media/gltf/box-gltf/box.gltf', txtr: 13 });
let attic  = new Gltf2Node({ url: './media/gltf/60_fifth_ave/60_fifth_ave.gltf' , alpha: .5, txtr: 12 });

export const init = async model => {

    buddha.translation = [0, 1.16, 0];
    buddha.scale = [1.3,1.3,1.3];

    box.translation = [0, 1, 0];
    box.scale = [.2,.2,.2];

    global.gltfRoot.addNode(buddha);
    global.gltfRoot.addNode(box);
    global.gltfRoot.addNode(attic);

    model.txtrSrc(1, '../media/textures/moon_diffuse.jpg');
    let obj = model.add('sphere').txtr(1);

    model.animate(() => {
    });
 }

