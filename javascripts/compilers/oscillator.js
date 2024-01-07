/***
 * A camouflaged .cable-connector that pipes an audio signal
 * to the bitflipper
***/
up.compiler('.oscillator', function (oscillator) {
  let audioContext, inputGain, inputStream
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
    if (!inputStream) {
      inputStream = audioContext.createBufferSource()
      const request = new XMLHttpRequest()

      request.open('GET', currentSampleUrl, true)
      request.responseType = 'arraybuffer'
      request.onload = () => {
        const audioData = request.response
        audioContext.decodeAudioData(audioData, (buffer) => {
          inputStream.buffer = buffer
          inputStream.playbackRate.value = PLAYBACK_RATE
          inputStream.loop = true
          inputStream.start(0)
          up.emit('status-text-changed', { text: `Using ${currentSampleUrl.split('/')[1]}` })
        })
      }
      request.send()
    }
    inputStream.connect(inputGain)
    up.emit('plug-in-success')
  }

  function switchToNextStream(){
    if (inputStream) {
      disconnectInputStream()
      currentSampleIndex++
      if(currentSampleIndex == AUDIO_SAMPLES.length)
        currentSampleIndex = 0
      localStorage.setItem('oscillator:audio-sample-index', currentSampleIndex)
      currentSampleUrl = AUDIO_SAMPLES[currentSampleIndex]
      activateOscillator()
    }
  }

  async function useStream({ file }){
    if (!audioContext) {
      up.emit('status-text-changed', { text: 'Power me on first' })
      return // The machine has not been initialized yet
    }
    
    // Resampling the file to the AudioContext's sampling rate is currently only possible synchronously
    // This can take a looong time for larger files.
    // Maybe we can switch to WebCodecs once they are better supported:
    // https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
    up.emit('status-text-changed', { text: `Loading file content...` })
    up.emit('status-text-changed', { text: `This may take a while!` })
    const rawBuffer = await file.arrayBuffer()
    const newInputStream = audioContext.createBufferSource()
    audioContext.decodeAudioData(rawBuffer, (buffer) => {
      up.emit('status-text-changed', { text: `Switching input source` })
      up.emit('status-text-changed', { text: file.name })
      newInputStream.buffer = buffer
      newInputStream.playbackRate.value = PLAYBACK_RATE
      newInputStream.loop = true
      disconnectInputStream() // only disconnect previous stream once we've fully loaded the new one
      newInputStream.start(0)
      newInputStream.connect(inputGain)
      inputStream = newInputStream
    })
  }

  function disconnectInputStream() {
    if (inputStream) {
      inputStream.disconnect()
      inputStream = null
    }
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', connectInputGain)
  up.on(oscillator, 'plug-in', activateOscillator)
  up.on(oscillator, 'plug-out', disconnectInputStream)
  up.on(oscillator, 'click', switchToNextStream)
  up.on('audio-input:use-file', useStream)

  init()
})
