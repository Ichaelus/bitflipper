/***
 * A camouflaged .cable-connector that pipes an audio signal
 * to the bitflipper
***/
up.compiler('.oscillator', function (oscillator) {
  let audioContext, inputGain, oscillatorStream
  const PLAYBACK_RATE = 1.0
  const AUDIO_FILES = ['assets/sine.wav', 'assets/oscillator.wav']
  const AUDIO_URL = AUDIO_FILES[0] // currently static

  function init() {
    SourceController.registerSource(oscillator)
  }

  function connectInputGain(evt) {
    inputGain = evt.inputGain
    // The oscillator should be connected on startup. "power:on" would be too soon.
    SourceController.setActive(oscillator)
  }

  function activateOscillator() {
    if (!audioContext) {
      up.emit('plug-in-failed')
      return // The machine has not been initialized yet
    }
    if (!oscillatorStream) {
      oscillatorStream = audioContext.createBufferSource()
      const request = new XMLHttpRequest()

      request.open('GET', AUDIO_URL, true)
      request.responseType = 'arraybuffer'
      request.onload = () => {
        const audioData = request.response
        audioContext.decodeAudioData(audioData, function (buffer) {
          oscillatorStream.buffer = buffer
          oscillatorStream.playbackRate.value = PLAYBACK_RATE
          oscillatorStream.loop = true
          oscillatorStream.start(0)
        })
      }
      request.send()
    }
    oscillatorStream.connect(inputGain)
    up.emit('plug-in-success')
  }

  function disconnectoscillator() {
    if (oscillatorStream) {
      oscillatorStream.disconnect()
    }
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', connectInputGain)
  up.on(oscillator, 'plug-in', activateOscillator)
  up.on(oscillator, 'plug-out', disconnectoscillator)

  init()
})
