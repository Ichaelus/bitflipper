up.compiler('.input-selection', function(element, data){

  let enabled = false; // Only react to input events if the machine is powered on

  up.on('audioContext:connected', function(){
    up.on(element, 'click', '.input-selection--switch', function(){
      if(enabled){
        InputController.switchToNextInput();
      }
    });
    
    up.on('plug-in', function(_evt, target){
      if(enabled){
        element.classList.toggle('-right', target.classList.contains('microphone'))
      }
    });
  });

  up.on('reset:on', function(){ enabled = true; })
  up.on('reset:off', function(){ enabled = false; })
});
