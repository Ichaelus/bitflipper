up.compiler('.power-switch', (element) => {
  // Clicking the power switch starts audio processing 
  let isFirstClick = true;

  function init() {
    if(!_detectAudioWorklet()){
      element.disabled = true;
      up.emit('status-text-changed', {text: 'Your Browser is not suported.'});
      up.emit('status-text-changed', {text: 'Try Chrome 66 or newer.'});
    }
    element.addEventListener('click', function (event) {
      let machine = document.querySelector('.machine-back');

      if (!machine.classList.contains('-active')) {
        if (isFirstClick) {
          up.emit('power-on');
          isFirstClick = false;
        }else{
          up.emit('resume');
        }
        machine.classList.add('-active');
        up.emit('status-text-changed', {text: 'STARTING UP.'});
      } else {
        up.emit('pause');
        machine.classList.remove('-active');
        up.emit('status-text-changed', {text: 'POWERING OFF.'});
        up.emit('status-text-changed', {text: 'GOOD BYE.'});
      }
    });
  }
  
  // Chrome requires a user interaction before playing any audio stream
  function _detectAudioWorklet() {
    let context = new OfflineAudioContext(1, 1, 44100);
    return context.audioWorklet && typeof context.audioWorklet.addModule === 'function';
  }

  init();
});