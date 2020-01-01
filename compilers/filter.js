up.compiler('.filter', function(element){
  
  const FILTER_TYPES = ['lowpass', 'highpass', 'bandpass'];
  let currentFilterIndex = 0;
  const icon = element.querySelector('.filter--icon');

  function setFilterType(type){
    FILTER_TYPES.forEach(function(filterType){
      element.classList.remove(`-${filterType}`);
    });
    element.classList.add(`-${type}`);
    up.emit('filter-type-changed', { value: type });
    up.emit('status-text-changed', { text: `Filter type: ${ type }`, instant: true });
    element.querySelector('.filter--label').innerText = type;
  }

  function rotateFilterType(){
    currentFilterIndex++;
    if(currentFilterIndex >= FILTER_TYPES.length){
      currentFilterIndex = 0;
    }
    setFilterType(FILTER_TYPES[currentFilterIndex]);
  }

  up.on(icon, 'click', rotateFilterType);
});