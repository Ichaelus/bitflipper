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

  up.on(element, 'plug-in', plugInCable);
  up.on('reset:off', plugOutCable);
});