import { setupAnalyser } from './services/analyser.js'
import { setupVolumeLimiter } from './services/volume-limiter.js'
import { loadServiceWorker } from './services/service-worker-helper.js'

const audioContext = new AudioContext()

const processAudio = async () => {
  await audioContext.resume()
  if (audioContext.state === 'suspended') {
    up.emit('status-text-changed', { text: 'Click to allow audio output' })
    return
  }

  await audioContext.audioWorklet.addModule(
    'javascripts/bit-crusher-processor.js',
  )
  const bitCrusher = new AudioWorkletNode(audioContext, 'bit-crusher-processor')
  const paramBits = bitCrusher.parameters.get('bits')
  const paramReduction = bitCrusher.parameters.get('frequencyReduction')
  let passThrough = false // keep this in sync with the BitCrusherProcessor's constructor

  const inputGain = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()
  const volumeLimiter = setupVolumeLimiter(audioContext)
  const analyser = setupAnalyser(audioContext)
  const oscilloscope = audioContext.createAnalyser()

  volumeLimiter.connect(analyser)

  inputGain
    .connect(bitCrusher)
    .connect(filter)
    .connect(volumeLimiter)
    .connect(oscilloscope)
    .connect(audioContext.destination)

  up.emit('audioContext:connected', { audioContext: audioContext })
  up.emit('inputgain:connected', { inputGain: inputGain })
  up.emit('oscilloscope:connected', { oscilloscope: oscilloscope })
  up.emit('bitcrusher:connected', { bitCrusher: bitCrusher })
  up.emit('filter:connected', { filter: filter })

  function onFrequencyReductionChange(evt) {
    // |frequencyReduction| parameters will be automated and changing over
    // time. Thus its parameter array will have 128 values.
    // Prevent zero values with no sound output
    const adjustedFrequencyReduction = Math.max(evt.target.getValue(), 0.005)
    paramReduction.setValueAtTime(
      adjustedFrequencyReduction,
      audioContext.currentTime,
    )
    up.emit('status-text-changed', {
      text: `Frequency Reduction: ${parseInt(
        adjustedFrequencyReduction * 100,
      )}%`,
      instant: true,
    })
  }

  function onFloatRangeChanged(evt) {
    bitCrusher.port.postMessage(['float-range', evt.target.getValue()])
    up.emit('status-text-changed', {
      text: `Float Range: ${parseInt(evt.target.getValue() * 100)}%`,
      instant: true,
    })
  }

  function onBitsChanged(evt) {
    paramBits.value = evt.bits
    up.emit('status-text-changed', {
      text: `Bits set to: ${evt.bits}`,
      instant: true,
    })
  }

  function onPassThroughToggled(_evt) {
    passThrough = !passThrough

    // bitCrusher.port.postMessage(['toggle-pass-through'])
    let statusText
    if (passThrough) {
      inputGain.disconnect(bitCrusher)
      bitCrusher.disconnect(filter)
      filter.disconnect(volumeLimiter)
      inputGain.connect(oscilloscope)
      statusText = 'Enabled pass-through mode'
    } else {
      inputGain.disconnect(oscilloscope)
      inputGain
        .connect(bitCrusher)
        .connect(filter)
        .connect(volumeLimiter)
        .connect(oscilloscope)
      statusText = 'Disabled pass-through mode'
    }
    up.emit('status-text-changed', {
      text: statusText,
      instant: true,
    })
  }

  up.on('reset:off', () => audioContext.suspend())
  up.on('reset:on', () => audioContext.resume())

  up.on(
    'button-value-changed',
    '.knob.-sample-reduction',
    onFrequencyReductionChange,
  )
  up.on('button-value-changed', '.knob.-float-range', onFloatRangeChanged)
  up.emit('bits-changed', { bits: paramBits.value, instant: true })
  up.on('bits-changed', onBitsChanged)
  up.on('pass-through-toggled', onPassThroughToggled)
  up.emit('reset:on')
}

up.on('power:on', processAudio)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', loadServiceWorker)
}
