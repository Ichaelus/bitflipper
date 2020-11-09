// The drumloop is also a .cable-connector!
up.compiler('.drumloop', function(drumLoop){
  let audioContext, inputGain, drumLoopStream;
  const playbackRate = 1.0;
  const musicFileUrl = 'assets/drumloop.wav';

  function init(){
    InputController.registerInput(drumLoop);
  }

  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    inputGain = evt.inputGain;
    // The drumloop should be connected on startup. "power:on" would be too soon.
    InputController.setActive(drumLoop);
  }

  function activateDrumLoop(){
    if(!audioContext){
      up.emit('plug-in-failed');
      return; // The machine has not been initialized yet
    }
    if(!drumLoopStream){
      drumLoopStream = audioContext.createBufferSource();
      let request = new XMLHttpRequest();
      
      request.open('GET', musicFileUrl, true);
      request.responseType = 'arraybuffer';
      request.onload = () => {
        var audioData = request.response;
        audioContext.decodeAudioData(audioData, function (buffer) {
          // let songLength = buffer.duration;
          drumLoopStream.buffer = buffer;
          drumLoopStream.playbackRate.value = playbackRate;
          drumLoopStream.loop = true;
          drumLoopStream.start(0);
        });
      };
      request.send();
    }
    drumLoopStream.connect(inputGain);
    up.emit('plug-in-success');
  }

  function disconnectDrumLoop(){
    if(drumLoopStream){
      drumLoopStream.disconnect();
    }
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on(drumLoop, 'plug-in', activateDrumLoop);
  up.on(drumLoop, 'plug-out', disconnectDrumLoop);

  init();
});
