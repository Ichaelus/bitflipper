/***
 * An output cable is currently only a visual stub.
 * It is plugged in when the machine boots, and plugged out when powering off.
***/
up.compiler('output-cable', function (outputCable, data) {
  const element = Template.clone('cable-connector', outputCable)
  const labelElement = element.querySelector('.cable-connector--label')
  const PLUG_OUT_ANIMATION_MS = 2000
  let audioContext

  function init() {
    element.classList.add('output-cable')
    if (data.modifier) {
      element.classList.add(data.modifier)
    }
    if (data.title) {
      element.title = data.title
    }
    labelElement.innerText = data.label
    up.on(labelElement, 'click', chooseAudioOutput)
  }

  function plugInCable() {
    element.classList.remove('-plugging-out')
    element.classList.add('-active')
  }

  function plugOutCable() {
    if (element.classList.contains('-active')) {
      element.classList.add('-plugging-out')
      element.classList.remove('-active')
      setTimeout(function () {
        element.classList.remove('-plugging-out')
      }, PLUG_OUT_ANIMATION_MS)
    }
  }

  async function chooseAudioOutput(){
    if (!audioContext) {
      return // The machine has not been initialized yet
    }

    if (!('setSinkId' in audioContext)) {
      console.warn('Changing the audio output target of an audio context is currently no supported by your Browser. Sorry')
      return 
    }

    await navigator.mediaDevices.getUserMedia({audio: true}) // Ask for permission, otherweise enumerateDevices is empty
    const deviceList = await navigator.mediaDevices.enumerateDevices()
    const audioOutputDevices = deviceList.filter(device => device.kind == 'audiooutput')
    if (audioOutputDevices.length > 0) {
      const selectedDeviceId = await showOutputSelectionModal(audioOutputDevices)
      audioContext.setSinkId(selectedDeviceId)
    }
  }

  async function showOutputSelectionModal(audioOutputDevices) {
    let previouslySelectedDeviceId = localStorage.getItem('latest-selected-output-device-id')
    let modalHtml = '<h2>Choose Audio Output Device</h2>'
    modalHtml += '<select name="audio-output-devices" up-watch="up.layer.accept(this.value)">'
    audioOutputDevices.forEach(audioOutputDevice => {
      const option = document.createElement('option')
      option.value = audioOutputDevice.deviceId
      option.text = audioOutputDevice.label || `speaker ${audioOutputDevice.deviceId}`
      if (audioOutputDevice.deviceId === previouslySelectedDeviceId)
        option.setAttribute('selected', true)
      modalHtml += option.outerHTML
    })
    modalHtml += '</select>'
    modalHtml += `<button onclick="up.layer.accept(document.querySelector('select[name=audio-output-devices]').value)">Confirm Selection</button>`

    const newSelectedDeviceId = await up.layer.ask({ content: modalHtml, mode: 'drawer', position: 'right' })
    localStorage.setItem('latest-selected-output-device-id', newSelectedDeviceId)
    return newSelectedDeviceId
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('reset:off', plugOutCable)
  up.on('reset:on', plugInCable)

  init()
})
