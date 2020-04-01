up.compiler('bit-control', (bitControl, data) => {
  // Load template
  const template = document.getElementById('bit-control');
  const templateContent = template.content;
  bitControl.appendChild(templateContent.cloneNode(true));

  // Initialize
  let bitCrusher;
  const bitControlNumber = data.bitIndex;
  const resetButton = bitControl.querySelector('.bit-control--button.-reset');
  const invertButton = bitControl.querySelector('.bit-control--button.-invert');
  const muteButton = bitControl.querySelector('.bit-control--button.-mute');
  const buttons = [resetButton, invertButton, muteButton];
  let enabled = false;
  bitControl.querySelector('.bit-control--index').innerText = bitControlNumber;

  function reset(){
    if(!bitCrusher){
      return false; // The machine has not been initialized yet
    }
    buttons.forEach((btn) => btn.classList.remove('-active'));
    return true;
  }

  function resetBit(evt){
    if(enabled){
      toggleBit(resetButton, 1, 'enabled');
    }
  }

  function muteBit(evt){
    if(enabled){
      toggleBit(muteButton, 0, 'disabled');
    }
  }

  function invertBit(evt){
    if(enabled){
      toggleBit(invertButton, -1, 'inverted');
    }
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

  function disableBitControl(){
    enabled = false;
  }

  function enableBitControl(){
    enabled = true;
  }

  up.on('bitcrusher:connected', connectBitCrusher);
  up.on(resetButton, 'click', resetBit);
  up.on(muteButton, 'click', muteBit);
  up.on(invertButton, 'click', invertBit);
  up.on('reset:off', disableBitControl);
  up.on('reset:on', enableBitControl);
});