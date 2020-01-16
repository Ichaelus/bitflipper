up.compiler('.bit-control', (bitControl) => {
  let bitCrusher;
  const button = bitControl.querySelector('.bit-control--button');

  function changeBitControlState(evt) {
    let bitControlNumber = parseInt(button.id);
    let statusChangeName;
    switch (true) {
      case button.classList.contains('-active'):
        button.classList.remove('-active');
        button.classList.add('-inverted');
        bitCrusher.port.postMessage(['bit-state', bitControlNumber, -1]);
        statusChangeName = 'inverted';
        break;
      case button.classList.contains('-inverted'):
        button.classList.remove('-inverted');
        button.classList.add('-inactive');
        bitCrusher.port.postMessage(['bit-state', bitControlNumber, 0]);
        statusChangeName = 'disabled';
        break;
      case button.classList.contains('-inactive'):
        button.classList.remove('-inactive');
        button.classList.add('-active');
        bitCrusher.port.postMessage(['bit-state', bitControlNumber, 1]);
        statusChangeName = 'enabled';
        break;
    };
    up.emit('status-text-changed', {text: `Bit ${ bitControlNumber + 1 } ${statusChangeName}`, instant: true});
  };

  function connectBitCrusher(evt){
    bitCrusher = evt.bitCrusher;
  }

  up.on('bitcrusher:connected', connectBitCrusher);
  up.on(button, 'click', changeBitControlState);
});