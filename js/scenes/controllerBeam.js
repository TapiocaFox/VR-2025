import * as cg from "../render/core/cg.js";
import { buttonState } from "../render/core/controllerInput.js";
import { lcb } from '../handle_scenes.js'; // IMPORT LEFT CONTROLLER BEAM

// Using a controller beam to grab and manipulate objects.

// If your left controller beam intersects the ball, and
// you are also pressing the left controller's trigger,
// then the ball will move with your controller beam.

const ballRadius = 0.1;
let ballPosition = [0,1.5,0];

export const init = async model => {

   let ball = model.add('sphere');

   model.animate(() => {
      let pointOnBeam = lcb.projectOntoBeam(ballPosition);
      let isHit       = cg.distance(pointOnBeam, ballPosition) < ballRadius;
      let isPressed   = buttonState.left[0].pressed;

      // const debug_text = `pointOnBean: \n${pointOnBeam}\nisHit: ${isHit}\nisPressed: ${isPressed}`;
      // console.log(debug_text);

      if (isHit & isPressed)
	      ballPosition = pointOnBeam;

      ball.color(isHit ? isPressed ? [1,0,0] : [1,.5,.5] : [1,1,1]);
      ball.identity().move(ballPosition).scale(ballRadius);
   });
}

