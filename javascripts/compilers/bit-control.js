up.compiler('bit-control', (bitControl, data) => {
  // Load template
  const template = document.getElementById('bit-control')
  const templateContent = template.content
  bitControl.appendChild(templateContent.cloneNode(true))

  // Initialize
  let bitCrusher
  const bitControlNumber = data.bitIndex
  const resetButton = bitControl.querySelector('.bit-control--button.-reset')
  const invertButton = bitControl.querySelector('.bit-control--button.-invert')
  const muteButton = bitControl.querySelector('.bit-control--button.-mute')
  const bitLabel = bitControl.querySelector('.bit-control--labels.-label')
  const buttons = [resetButton, invertButton, muteButton]
  let enabled = false
  bitControl.querySelector('.bit-control--index').innerText = bitControlNumber

  MidiMap.registerControl(
    resetButton,
    `bit-control-${bitControlNumber}-reset`,
    resetBit,
  )
  MidiMap.registerControl(
    invertButton,
    `bit-control-${bitControlNumber}-invert`,
    invertBit,
  )
  MidiMap.registerControl(
    muteButton,
    `bit-control-${bitControlNumber}-mute`,
    muteBit,
  )
  MidiMap.registerControl(
    bitLabel,
    `bit-control-${bitControlNumber}-bits`,
    setBits,
  )

  function reset() {
    if (!bitCrusher) {
      return false // The machine has not been initialized yet
    }
    buttons.forEach(btn => btn.classList.remove('-active'))
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

  function connectBitCrusher(evt) {
    bitCrusher = evt.bitCrusher
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
      bitControl.classList.add('-active')
      enableBitControl()
    } else {
      bitControl.classList.remove('-active')
      disableBitControl()
    }
  }

  up.on('bitcrusher:connected', connectBitCrusher)
  up.on('bits-changed', setActiveBit)
  up.on(resetButton, 'click', resetBit)
  up.on(muteButton, 'click', muteBit)
  up.on(invertButton, 'click', invertBit)
  up.on(bitLabel, 'click', setBits)
  up.on('reset:off', disableBitControl)
  up.on('reset:on', enableBitControl)
})
