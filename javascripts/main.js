import { setupAnalyser } from './services/analyser.js'
import { setupVolumeLimiter } from './services/volume-limiter.js'
import { loadServiceWorker } from './services/service-worker-helper.js'

const processAudio = async () => {
  const audioContext = new AudioContext()
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

  const inputGain = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()
  const volumeLimiter = setupVolumeLimiter(audioContext)
  const analyser = setupAnalyser(audioContext)

  volumeLimiter.connect(analyser)

  const oscilloscope = audioContext.createAnalyser()

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

  up.on('reset:off', () => audioContext.suspend())
  up.on('reset:on', () => audioContext.resume())

  up.on(
    'button-value-changed',
    '.knob.-sample-reduction',
    onFrequencyReductionChange,
  )
  up.on('button-value-changed', '.knob.-float-range', onFloatRangeChanged)
  up.on('bits-changed', onBitsChanged)
  up.emit('bits-changed', { bits: paramBits.value, instant: true })
  up.emit('reset:on')
}

up.on('power:on', processAudio)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', loadServiceWorker)
}
