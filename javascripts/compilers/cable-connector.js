up.compiler('.cable-connector', function(element){
  
  function plugInCable(){
    element.classList.add('-active');
  }

  function plugOutCable(){
    if(element.classList.contains('-active')){
      element.classList.add('-plugging-out');
      element.classList.remove('-active');
      setTimeout(function(){
        element.classList.remove('-plugging-out');
      }, 2000);
    }
  }

  function plugOutOtherCables(evt){
    if(evt.newInput !== element){
      up.emit(element, 'plug-out');
    }
  }

  function switchToCable(evt){
    up.emit(element, 'plug-in');
  }

  up.on(element, 'click', switchToCable);
  up.on(element, 'plug-in', plugInCable);
  up.on(element, 'plug-out', plugOutCable);
  up.on('input-changed', plugOutOtherCables);
});