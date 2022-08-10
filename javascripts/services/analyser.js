/***
 * Visualize the current noise level (updated 5 times per second)
***/

const HERTZ = 5
const FFT_SIZE = 32
const MINIMUM_DECIBELS = -90
const SMOOTHING_TIME_CONSTANT = 0.3
const VISUALIZER_ELEMENT = document.querySelector('.input-visualizer--glow')
let analyser

function analyze(){
  const frequencyData = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(frequencyData)
  
  const sum = frequencyData.reduce((a, b) => a + b, 0)
  const averageFrequency = sum / frequencyData.length || 0
  // Translate numeric range from [0, 255] to [90, 0]
  const hueValue = (1 - averageFrequency / 255) * 90 
  VISUALIZER_ELEMENT.style.backgroundColor = `hsla(${hueValue}, 100%, 50%, 0.95)`
}

export function setupAnalyser(audioContext) {
  analyser = audioContext.createAnalyser()

  analyser.fftSize = FFT_SIZE
  analyser.minDecibels = MINIMUM_DECIBELS
  analyser.smoothingTimeConstant = SMOOTHING_TIME_CONSTANT

  setInterval(analyze, 1000 / HERTZ)

  return analyser
}
