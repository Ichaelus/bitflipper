up.compiler('.bit-control', (bitControl) => {
  let bitCrusher;
  const bitControlNumber = parseInt(bitControl.querySelector('.bit-control--labels label').innerText);
  const resetButton = bitControl.querySelector('.bit-control--button.-reset');
  const invertButton = bitControl.querySelector('.bit-control--button.-invert');
  const muteButton = bitControl.querySelector('.bit-control--button.-mute');
  const buttons = [resetButton, invertButton, muteButton];

  function reset(){
    if(!bitCrusher){
      return false; // The machine has not been initialized yet
    }
    buttons.forEach((btn) => btn.classList.remove('-active'));
    return true;
  }

  function resetBit(evt){
    toggleBit(resetButton, 1, 'enabled');
  }

  function muteBit(evt){
    toggleBit(muteButton, 0, 'disabled');
  }

  function invertBit(evt){
    toggleBit(invertButton, -1, 'inverted');
  }

  function toggleBit(button, signal, humanMessage){
    if(reset()){
      button.classList.add('-active');
      bitCrusher.port.postMessage(['bit-state', bitControlNumber - 1, signal]);
      up.emit('status-text-changed', {text: `Bit ${ bitControlNumber } ${ humanMessage }`, instant: true});
    }
  }

  function connectBitCrusher(evt){
    bitCrusher = evt.bitCrusher;
  }

  up.on('bitcrusher:connected', connectBitCrusher);
  up.on(resetButton, 'click', resetBit);
  up.on(muteButton, 'click', muteBit);
  up.on(invertButton, 'click', invertBit);
});