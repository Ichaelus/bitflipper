up.compiler('cable-connector', function(element, data){
  // Load template
  const template = document.getElementById('cable-connector');
  const templateContent = template.content;
  element.appendChild(templateContent.cloneNode(true));
  element.classList.add(data.modifier);
  element.querySelector('.cable-connector--label').innerText = data.label;

  // Initialize
  let enabled = false;

  function plugInCable(){
    element.classList.remove('-plugging-out');
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

  function plugOutOtherCables(){
    if(InputController.currentInput() !== element){
      up.emit(element, 'plug-out');
    }
  }

  function switchToCable(_evt){
    if(enabled){
      InputController.setActive(element);
    }
  }

  function disableCable(){
    enabled = false;
  }

  function enableCable(){
    enabled = true;
  }

  up.on(element, 'click', switchToCable);
  up.on(element, 'plug-in', plugInCable);
  up.on(element, 'plug-out', plugOutCable);
  up.on('plug-in-success', plugOutOtherCables);
  up.on('reset:off', disableCable);
  up.on('reset:on', enableCable);
});
