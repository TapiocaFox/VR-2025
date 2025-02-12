import * as cg from "./cg.js";
import { G2 } from "../../util/g2.js";

export function CodeEditor(obj, txtrUnit) {

   if (txtrUnit === undefined)
      txtrUnit = 14;

   let g2 = new G2();
   obj.txtrSrc(txtrUnit, g2.getCanvas());

   window.codeState = { key: '', col: 0, row: 0, text: '' };

   let isSetCode = false, error = '', isBlack = false, isHelp = false;

   this.initCode = code => {
      if (this.getCode().length == 0)
         codeEditor.setCode(code);
      codeState.key = 'KeyA';
   }

   this.setCode = code => {
      editText.setText(code);
      isSetCode = true;
   }

   this.getCode = () => editText.getText();

   editText.setCallback(keyCode => codeState.key = keyCode);

   // EDITABLE CODE

   let screen = obj.add('square').txtr(txtrUnit);

   g2.render = function() {
      this.setColor('#00000080');
      this.fillRect(0,0,1,1);
      this.textHeight(.02);
      if (isHelp) {
         this.setColor('#4080ff');
         this.setFont('helvetica');
         this.text(`\
 CMD-a:  reparse code
 CMD-b:  black/white text
 CMD-i:   toggle this help message
 CMD-z:  undo
 CMD-Z:  redo
`, .004, .98, 'left');
      }
      else {
         if (error.length > 0) {
            this.setColor('#ff8080');
            this.setFont('helvetica');
         }
         else {
            this.setColor('#4080ff');
            this.setFont('helvetica');
            this.text('For help type CMD-i', .004, .984, 'left');
         }
         this.setColor(isBlack ? 'black' : 'white');
         this.fillRect(0,.97,1,.001);
         this.setFont('courier');
         this.text('\n' + codeState.text, .0113, .98, 'left');

         this.setColor('#4080ff80');
         let c = codeState.col;
         let r = codeState.row;
	 this.fillRect(.5+.5*(-.966+.0242*c-.011),.5+.5*(.957-.04*r-.06),.0121,.02);
      }
   }

   let wasInteractMode = false;

   this.update = () => {
      g2.update();
      window.codeState = server.synchronize('codeState');

      if (isSetCode) {
         codeState.text = editText.getText();
         isSetCode = false;
      }

      // ONLY RENDER THE HANDS WHEN THEY ARE LIFTED OFF THE KEYBOARD

      for (let hand in {left:0, right:1})
         clay.handsWidget.visible(hand, (inputEvents.pos(hand)[1] - 52 * .0254) / .1);

      // THE SCREEN TURNS TO FACE THE USER

      {
         let m = cg.mMultiply(clay.inverseRootMatrix, clay.pose.transform.matrix);
         let Z = cg.normalize(m.slice(12,15));
         let X = cg.normalize(cg.cross([0,1,0], Z));
         m = [X[0],X[1],X[2],0, 0,1,0,0, Z[0],Z[1],Z[2],0, 0,1.6,0,1];
         let size = interactMode == 3 ? .5 : .25;
         obj.setMatrix(m).scale(size,size,.0001);
      }

      let k = codeState.key, c = codeState.col, r = codeState.row, t = codeState.text;

      // THE FOLLOWING LOGIC IS ONLY EXECUTED ON A COMPUTER (A CLIENT WITH A KEYBOARD)

      if (interactMode == 3) {
         if (! wasInteractMode) {
            editText.setCol(c);
            editText.setRow(r);
            editText.setText(t);
            wasInteractMode = true;
         }
         c = editText.getCol();
         r = editText.getRow();
         t = editText.getText();
         if (k !== '' || c != codeState.col || r != codeState.row || t !== codeState.text) {
            window.codeState = { key: k, col: c, row: r, text: t };
            server.broadcastGlobal('codeState');
         }
      }

      switch (codeState.key) {
      case 'KeyA':
         error = '';
         try {   
            eval(codeState.text);
         } catch (err) {
            error = err.message;
         }   
         break;
      case 'KeyB':
         isBlack = ! isBlack;
         break;
      case 'KeyI':
         isHelp = ! isHelp;
         break;
      }
      codeState.key = '';
   }
}

