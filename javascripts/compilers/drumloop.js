up.compiler('.drumloop', function(drumLoop){
  let audioContext, inputGain;
  const playbackRate = 1.0;
  const musicFileUrl = 'assets/drumloop.wav';

  function setupDrumLoopStream(){
    let drumLoop = audioContext.createBufferSource();
    let request = new XMLHttpRequest();
    
    request.open('GET', musicFileUrl, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      var audioData = request.response;
      audioContext.decodeAudioData(audioData, function (buffer) {
        // let songLength = buffer.duration;
        drumLoop.buffer = buffer;
        drumLoop.playbackRate.value = playbackRate;
        drumLoop.loop = true;
        drumLoop.start(0);
      });
    };
    request.send();
    drumLoop.connect(inputGain);
  }

  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    // The drum loop is connected per default
    inputGain = evt.inputGain;
    setupDrumLoopStream();
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on('power:on', function(){
    up.emit('plug-in', { target: drumLoop });
  });
});