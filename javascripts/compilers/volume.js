up.compiler('.volume', function (volumeKnob) {
  let audioContext,
    inputGain,
    oldVolume = 1

  function mute() {
    if (!audioContext) {
      return // The machine has not been initialized yet
    }
    oldVolume = inputGain.gain.value
    inputGain.gain.setValueAtTime(0, audioContext.currentTime)
  }

  function unmute() {
    if (!audioContext) {
      return // The machine has not been initialized yet
    }
    inputGain.gain.setValueAtTime(oldVolume, audioContext.currentTime)
  }

  function onVolumeChange(evt) {
    if (!inputGain) {
      return // The machine has not been initialized yet
    }
    const newVolume = volumeKnob.getValue()
    inputGain.gain.setValueAtTime(newVolume, audioContext.currentTime)
    up.emit('status-text-changed', {
      text: `Volume: ${parseInt(newVolume * 100)}%`,
      instant: true,
    })
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', evt => (inputGain = evt.inputGain))
  up.on('button-value-changed', 'knob.volume', onVolumeChange)
  up.on('reset:off', mute)
  up.on('reset:on', unmute)
})
