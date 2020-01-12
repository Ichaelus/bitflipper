up.compiler('.drumloop', function(drumLoop){
  let audioContext, inputGain, drumLoopStream;
  const playbackRate = 1.0;
  const musicFileUrl = 'assets/drumloop.wav';

  function activateDrumLoop(){
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
  }

  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    inputGain = evt.inputGain;
    // The drumloop should be connected on startup. "power:on" would be too soon.
    up.emit('plug-in', { target: drumLoop });
  }

  function disconnectDrumLoop(){
    drumLoopStream.disconnect(inputGain);
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on(drumLoop, 'plug-in', activateDrumLoop);
  up.on(drumLoop, 'plug-out', disconnectDrumLoop);
});