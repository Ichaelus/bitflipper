/***
 * Filters only let through part of the sound spectrum.
 * The user can rotate through three filter types as of today
***/
up.compiler('.filter', function (element) {
  const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass']
  const INITIAL_FREQUENCY_CUTOFF = 10000
  const MAX_CUTOFF_HZ = 16000
  const INITIAL_RESONANCE_Q = 0
  const MAX_RESONANCE_Q = 30
  const icon = element.querySelector('.filter--icon')
  const label = element.querySelector('.filter--label')
  let currentFilterIndex = 0
  let audioContext, filter

  MidiMap.registerControl(element, 'filter-button', rotateFilterType)

  function connectFilter(evt) {
    filter = evt.filter
    filter.type = FILTER_TYPES[0]
    filter.frequency.value = INITIAL_FREQUENCY_CUTOFF
    filter.Q.value = INITIAL_RESONANCE_Q
  }

  function setFilterType(type) {
    filter.type = label.innerText = type
    FILTER_TYPES.forEach((filterType) => {
      element.classList.remove(filterBEMClass(filterType))
    })
    element.classList.add(filterBEMClass(type))
    up.emit('status-text-changed', {
      text: `Filter type: ${type}`,
      instant: true,
    })
  }

  function rotateFilterType() {
    if (!machineInitialized()) {
      return
    }
    currentFilterIndex++
    if (currentFilterIndex >= FILTER_TYPES.length) {
      currentFilterIndex = 0
    }
    setFilterType(FILTER_TYPES[currentFilterIndex])
  }

  function onCutOffChanged(evt) {
    if (!machineInitialized()) {
      return
    }
    const newCutOff = evt.target.getValue() * MAX_CUTOFF_HZ
    filter.frequency.setValueAtTime(newCutOff, audioContext.currentTime)
    up.emit('status-text-changed', {
      text: `Cutoff: ${parseInt(newCutOff)} Hz`,
      instant: true,
    })
  }

  function onResonanceChanged(evt) {
    if (!machineInitialized()) {
      return
    }
    const newResonance = evt.target.getValue() * MAX_RESONANCE_Q
    filter.Q.setValueAtTime(newResonance, audioContext.currentTime)
    up.emit('status-text-changed', {
      text: `Resonance: ${parseInt(newResonance)}`,
      instant: true,
    })
  }

  function filterBEMClass(filterType) {
    return `-${filterType}`
  }

  function machineInitialized(){
    return filter instanceof AudioNode
  }

  up.on('audioContext:connected', evt => (audioContext = evt.audioContext))
  up.on('filter:connected', connectFilter)
  up.on(icon, 'click', rotateFilterType)
  up.on('button-value-changed', '.knob.-filter-cutoff', onCutOffChanged)
  up.on('button-value-changed', '.knob.-filter-resonance', onResonanceChanged)
})
