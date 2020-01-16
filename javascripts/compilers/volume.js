up.compiler('.volume', function (volumeKnob) {
  let audioContext, inputGain;
  
  function mute(){
    inputGain.gain.setValueAtTime(0, audioContext.currentTime);
  }

  function unmute(){
    inputGain.gain.setValueAtTime(1, audioContext.currentTime);
  }

  function onVolumeChange(evt){
    const newVolume = volumeKnob.getValue();
    inputGain.gain.setValueAtTime(newVolume, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Volume: ${ parseInt(newVolume * 100) }%`, instant: true});
  };
  
  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectInputGain(evt){
    inputGain = evt.inputGain;
  }
  
  up.on('audioContext:connected', connectAudioContext);
  up.on('inputgain:connected', connectInputGain);
  up.on('button-value-changed', '.knob.volume', onVolumeChange);
  up.on('reset:off', mute);
  up.on('reset:on', unmute);
});