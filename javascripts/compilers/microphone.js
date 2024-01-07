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
    disconnectMicrophone()
    const microphoneAudioInput = await chooseAudioInput()
    microphoneInAudioContext =
      audioContext.createMediaStreamSource(microphoneAudioInput)
    microphoneInAudioContext.connect(inputGain)
  }

  // Ask for user permission and selection of an input audio stream like a mic or similar
  async function chooseAudioInput() {
    await navigator.mediaDevices.getUserMedia({audio: true}) // Ask for permission, otherweise enumerateDevices is empty
    const deviceList = await navigator.mediaDevices.enumerateDevices()
    const audioInputDevices = deviceList.filter(device => device.kind == 'audioinput')
    if (audioInputDevices.length > 0) {
      const selectedDeviceId = await showInputSelectionModal(audioInputDevices)
      const selectedDeviceName = audioInputDevices.find(device => device.deviceId === selectedDeviceId).label
      up.emit('status-text-changed', { text: `Using ${selectedDeviceName}` })
      return await navigator.mediaDevices.getUserMedia({audio: { deviceId: { exact: selectedDeviceId } } })
    }
  }

  async function showInputSelectionModal(audioInputDevices) {
    let previouslySelectedDeviceId = localStorage.getItem('latest-selected-input-device-id')
    let modalHtml = '<h2>Choose Audio Input Device</h2>'
    modalHtml += '<select name="audio-input-devices" up-watch="up.layer.accept(this.value)">'
    audioInputDevices.forEach(audioInputDevice => {
      const option = document.createElement('option')
      option.value = audioInputDevice.deviceId
      option.text = audioInputDevice.label || `microphone ${audioInputDevice.deviceId}`
      if (audioInputDevice.deviceId === previouslySelectedDeviceId)
        option.setAttribute('selected', true)
      modalHtml += option.outerHTML
    })
    modalHtml += '</select>'
    modalHtml += `<button onclick="up.layer.accept(document.querySelector('select[name=audio-input-devices]').value)">Confirm Selection</button>`

    const newSelectedDeviceId = await up.layer.ask({ content: modalHtml, mode: 'drawer', position: 'right' })
    localStorage.setItem('latest-selected-input-device-id', newSelectedDeviceId)
    return newSelectedDeviceId
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

  async function changeMicrophone(){
    if (microphoneInAudioContext) {
      await setupMicrophoneStream()
    }
  }

  function disconnectMicrophone() {
    microphoneInAudioContext?.disconnect(inputGain)
    microphoneInAudioContext = null
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('inputgain:connected', evt => (inputGain = evt.inputGain))
  up.on(microphone, 'plug-in', activateMicrophone)
  up.on(microphone, 'plug-out', disconnectMicrophone)
  up.on(microphone, 'click', changeMicrophone)

  init()
})
