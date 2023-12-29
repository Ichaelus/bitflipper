/***
 * Each bit of the audio stream signal can be influenced in the UI with dedicated
 * control buttons. This compiler gives life to those buttons.
***/
up.compiler('bit-control', (bitControl, data) => {
  const element = Template.clone('bit-control', bitControl)
  let bitCrusher
  let enabled = false
  const bitControlNumber = data.bitIndex

  const resetButton = element.querySelector('.bit-control--button.-reset')
  const invertButton = element.querySelector('.bit-control--button.-invert')
  const muteButton = element.querySelector('.bit-control--button.-mute')
  const bitLabel = element.querySelector('.bit-control--labels.-label')
  const buttons = [resetButton, invertButton, muteButton]

  function init() {
    element.querySelector('.bit-control--index').innerText = bitControlNumber
    MidiMap.registerControl(
      resetButton,
      `bit-control-${bitControlNumber}-reset`,
      resetBit,
    )
    resetButton.title = `Reset bit ${bitControlNumber}`

    MidiMap.registerControl(
      invertButton,
      `bit-control-${bitControlNumber}-invert`,
      invertBit,
    )
    invertButton.title = `Invert bit ${bitControlNumber}`

    MidiMap.registerControl(
      muteButton,
      `bit-control-${bitControlNumber}-mute`,
      muteBit,
    )
    muteButton.title = `Mute bit ${bitControlNumber}`

    MidiMap.registerControl(
      bitLabel,
      `bit-control-${bitControlNumber}-bits`,
      setBits,
    )
    bitLabel.title = `Change total bit count to ${bitControlNumber}`
  }

  function reset() {
    if (!bitCrusher) {
      return false // The machine has not been initialized yet
    }
    buttons.forEach(button => button.classList.remove('-active'))
    return true
  }

  function resetBit(evt) {
    if (enabled && !MidiMap.recording) {
      toggleBit(resetButton, 1, 'enabled')
    }
  }

  function muteBit(evt) {
    if (enabled && !MidiMap.recording) {
      toggleBit(muteButton, 0, 'disabled')
    }
  }

  function invertBit(evt) {
    if (enabled && !MidiMap.recording) {
      toggleBit(invertButton, -1, 'inverted')
    }
  }

  function toggleBit(button, signal, humanMessage) {
    if (reset()) {
      button.classList.add('-active')
      bitCrusher.port.postMessage(['bit-state', bitControlNumber - 1, signal])
      up.emit('status-text-changed', {
        text: `Bit ${bitControlNumber} ${humanMessage}`,
        instant: true,
      })
    }
  }

  function disableBitControl() {
    enabled = false
  }

  function enableBitControl() {
    enabled = true
  }

  function setBits() {
    if (!MidiMap.recording) {
      up.emit('bits-changed', { bits: data.bitIndex, instant: true })
    }
  }

  function setActiveBit(evt) {
    if (reset()) {
      // changing the bit count resets *all* bits
      resetButton.classList.add('-active')
      bitCrusher.port.postMessage(['bit-state', bitControlNumber - 1, 1])
    }
    if (evt.bits >= data.bitIndex) {
      element.classList.add('-active')
      enableBitControl()
    } else {
      element.classList.remove('-active')
      disableBitControl()
    }
  }

  up.on('bitcrusher:connected', evt => bitCrusher = evt.bitCrusher)
  up.on('bits-changed', setActiveBit)
  up.on(resetButton, 'click', resetBit)
  up.on(muteButton, 'click', muteBit)
  up.on(invertButton, 'click', invertBit)
  up.on(bitLabel, 'click', setBits)
  up.on('reset:off', disableBitControl)
  up.on('reset:on', enableBitControl)

  init()
})
