up.compiler('.power-switch', element => {
  let audioContext
  const machine = document.querySelector('.machine-back')

  function init() {
    if (!_detectAudioWorklet()) {
      element.disabled = true
      up.emit('status-text-changed', { text: 'Your Browser is not suported.' })
      up.emit('status-text-changed', { text: 'Try Chrome 66 or newer.' })
    }

    MidiMap.registerToggle(element, 'power-switch', togglePowerSwitch)
    up.on(element, 'click', togglePowerSwitch)
  }

  function togglePowerSwitch() {
    if (MidiMap.recording) {
      return
    }

    if (!machine.classList.contains('-active')) {
      if (!audioContext) {
        // Clicking the power switch the first time starts audio processing
        up.emit('power:on')
      } else {
        up.emit('reset:on')
        machine.classList.add('-active')
        up.emit('status-text-changed', { text: 'STARTING UP.', instant: true, flushPreviousMessages: true })
      }
    } else {
      up.emit('reset:off')
      machine.classList.remove('-active')
      up.emit('status-text-changed', { text: 'POWERING OFF.', instant: true, flushPreviousMessages: true })
      up.emit('status-text-changed', { text: 'GOOD BYE.' })
    }
  }

  // Chrome requires a user interaction before playing any audio stream
  function _detectAudioWorklet() {
    let context = new OfflineAudioContext(1, 1, 44100)
    return (
      context.audioWorklet &&
      typeof context.audioWorklet.addModule === 'function'
    )
  }

  up.on('audioContext:connected', evt => {
    audioContext = evt.audioContext
    machine.classList.add('-active')
    up.emit('status-text-changed', { text: 'STARTING UP.', instant: true, flushPreviousMessages: true })
  })

  init()
})
