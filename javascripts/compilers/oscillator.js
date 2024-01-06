/***
 * A camouflaged .cable-connector that pipes an audio signal
 * to the bitflipper
***/
up.compiler('.oscillator', function (oscillator) {
  let audioContext, inputGain, oscillatorStream
  const PLAYBACK_RATE = 1.0
  const AUDIO_SAMPLES = ['assets/sine.wav', 'assets/drumloop.wav']
  let currentSampleIndex = parseInt(localStorage.getItem('oscillator:audio-sample-index')) || 0
  let currentSampleUrl = AUDIO_SAMPLES[currentSampleIndex]

  function init() {
    SourceController.registerSource(oscillator)
  }

  function connectInputGain(evt) {
    inputGain = evt.inputGain
    // The oscillator should be connected on startup. "power:on" would be too soon.
    SourceController.setActive(oscillator)
    Logger.majorUserEvent(evt, `Switching to input source oscillator`)
  }

  function activateOscillator() {
    if (!audioContext) {
      up.emit('plug-in-failed')
      return // The machine has not been initialized yet
    }
    if (!oscillatorStream) {
      oscillatorStream = audioContext.createBufferSource()
      const request = new XMLHttpRequest()

      request.open('GET', currentSampleUrl, true)
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

  function changeStream(){
    if (oscillatorStream) {
      disconnectOscillator()
      currentSampleIndex++
      if(currentSampleIndex == AUDIO_SAMPLES.length)
        currentSampleIndex = 0
      localStorage.setItem('oscillator:audio-sample-index', currentSampleIndex)
      currentSampleUrl = AUDIO_SAMPLES[currentSampleIndex]
      activateOscillator()
    }
  }

  function disconnectOscillator() {
    if (oscillatorStream) {
      oscillatorStream.disconnect()
      oscillatorStream = null
    }
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', connectInputGain)
  up.on(oscillator, 'plug-in', activateOscillator)
  up.on(oscillator, 'plug-out', disconnectOscillator)
  up.on(oscillator, 'click', changeStream)

  init()
})
