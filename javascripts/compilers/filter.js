up.compiler('.filter', function(element){
  const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass'];
  const icon = element.querySelector('.filter--icon');
  const label = element.querySelector('.filter--label');
  let currentFilterIndex = 0;
  let audioContext, filter;

  function setFilterType(type){
    filter.type = type;
    label.innerText = type;
    FILTER_TYPES.forEach(function(filterType){
      element.classList.remove(`-${filterType}`);
    });
    element.classList.add(`-${type}`);
    up.emit('status-text-changed', { text: `Filter type: ${ type }`, instant: true });
  }

  function rotateFilterType(){
    currentFilterIndex++;
    if(currentFilterIndex >= FILTER_TYPES.length){
      currentFilterIndex = 0;
    }
    setFilterType(FILTER_TYPES[currentFilterIndex]);
  }

  function onCutOffChanged(evt){
    const maxCutoff = 16000;
    const newCutOff = evt.target.getValue() * maxCutoff;
    filter.frequency.setValueAtTime(newCutOff, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Cutoff: ${ parseInt(newCutOff) } Hz`, instant: true});
  }

  function onResonanceChanged(evt){
    const maxResonance = 30;
    const newResonance = evt.target.getValue() * maxResonance;
    filter.Q.setValueAtTime(newResonance, audioContext.currentTime);
    up.emit('status-text-changed', {text: `Resonance: ${ parseInt(newResonance) }`, instant: true});
  }

  function connectAudioContext(evt){
    audioContext = evt.audioContext;
  }

  function connectFilter(evt){
    filter = evt.filter;
    filter.type ="lowpass";
    filter.frequency.value = 10000;
    filter.Q.value = 0;
  }

  up.on('audioContext:connected', connectAudioContext);
  up.on('filter:connected', connectFilter);
  up.on(icon, 'click', rotateFilterType);
  up.on('button-value-changed', '.knob.-filter-cutoff', onCutOffChanged);
  up.on('button-value-changed', '.knob.-filter-resonance', onResonanceChanged);
});