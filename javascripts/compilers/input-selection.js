up.compiler('.input-selection', function(element, data){

  up.on('audioContext:connected', function(){
    up.on(element, 'click', '.input-selection--switch-knob', function(){
      InputController.switchToNextInput();
    });
    
    up.on('plug-in', function(_evt, target){
      element.classList.toggle('-right', target.classList.contains('microphone'))
    });
  });

});
