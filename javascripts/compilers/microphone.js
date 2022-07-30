/***
 * A camouflaged .cable-connector that pipes a microphone signal
 * to the bitflipper
***/
up.compiler('.microphone', function (microphone) {
  let audioContext, inputGain, microphoneInAudioContext

  function init() {
    SourceController.registerSource(microphone)
  }

  async function setupMicrophoneStream() {
    if (!microphoneInAudioContext) {
      const microphoneAudioInput = await getMicrophoneAudioInput()
      microphoneInAudioContext =
        audioContext.createMediaStreamSource(microphoneAudioInput)
    }
    microphoneInAudioContext.connect(inputGain)
  }

  // Ask for user permission to the microphone audio stream
  async function getMicrophoneAudioInput() {
    return await navigator.mediaDevices.getUserMedia({ audio: true })
  }

  async function activateMicrophone(evt) {
    try {
      await setupMicrophoneStream()
      up.emit('plug-in-success')
    } catch (err) {
      up.emit('plug-in-failed')
      throw err
    }
  }

  function disconnectMicrophone() {
    microphoneInAudioContext?.disconnect()
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', evt => (inputGain = evt.inputGain))
  up.on(microphone, 'plug-in', activateMicrophone)
  up.on(microphone, 'plug-out', disconnectMicrophone)

  init()
})
