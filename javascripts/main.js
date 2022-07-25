const processAudio = async () => {
  const audioContext = new AudioContext()
  if (audioContext.state === 'suspended') {
    up.emit('status-text-changed', { text: 'Click to allow audio output' })
    return
  }

  // Initialize the audio context and its processor
  await audioContext.audioWorklet.addModule(
    'javascripts/bit-crusher-processor.js',
  )
  const inputGain = audioContext.createGain()
  const bitCrusher = new AudioWorkletNode(audioContext, 'bit-crusher-processor')
  const paramBits = bitCrusher.parameters.get('bits')
  const paramReduction = bitCrusher.parameters.get('frequencyReduction')

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
    //paramReduction.setValueAtTime(0.01, 0);
    //paramReduction.linearRampToValueAtTime(0.1, 4);
    //paramReduction.exponentialRampToValueAtTime(0.01, 8);
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

// Visualize the current noise level (updated 5 times per second)
function setupAnalyser(audioContext) {
  let analyser = audioContext.createAnalyser()
  analyser.fftSize = 32
  analyser.minDecibels = -90

  setInterval(function () {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    analyser.smoothingTimeConstant = 0.3
    const sum = dataArray.reduce((a, b) => a + b, 0)
    const avg = sum / dataArray.length || 0
    const hueValue = (1 - avg / 255) * 90 // Translate [0,255] -> [90, 0]
    document.querySelector('.input-visualizer--glow').style.backgroundColor =
      'hsla(' + hueValue + ', 100%, 50%, 0.95)'
  }, 200)
  return analyser
}

// Keep the volume in an acceptable range
function setupVolumeLimiter(audioContext) {
  let limiter = audioContext.createDynamicsCompressor()
  limiter.threshold.setValueAtTime(-30.0, audioContext.currentTime) // this is the pitfall, leave some headroom
  limiter.knee.setValueAtTime(6.0, audioContext.currentTime) // brute force
  limiter.ratio.setValueAtTime(20.0, audioContext.currentTime) // max compression
  limiter.attack.setValueAtTime(0.002, audioContext.currentTime) // 5ms attack
  limiter.release.setValueAtTime(0.1, audioContext.currentTime) // 50ms release
  return limiter
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js').then(
      function (registration) {
        // Registration was successful
        console.info(
          'ServiceWorker registration successful with scope: ',
          registration.scope,
        )
      },
      function (err) {
        // registration failed :(
        console.warn('ServiceWorker registration failed: ', err)
      },
    )
  })
}
