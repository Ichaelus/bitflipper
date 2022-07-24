/***
 * A clickable audio in/out cable
***/

up.compiler('cable-connector', function (cableConnector, data) {
  const element = Template.clone('cable-connector', cableConnector)
  let enabled = false

  function init() {
    element.classList.add(data.modifier)
    element.querySelector('.cable-connector--label').innerText = data.label
  }

  function switchToCable(_evt) {
    if (enabled) {
      SourceController.setActive(element)
    }
  }

  function plugInCable() {
    element.classList.remove('-plugging-out')
    element.classList.add('-active')
  }

  function plugOutCable() {
    if (element.classList.contains('-active')) {
      element.classList.add('-plugging-out')
      element.classList.remove('-active')
      setTimeout(function () {
        element.classList.remove('-plugging-out')
      }, 2000)
    }
  }

  function plugOutOtherCables() {
    if (SourceController.currentSource() !== element) {
      up.emit(element, 'plug-out')
    }
  }

  up.on(element, 'click', switchToCable)
  up.on(element, 'plug-in', plugInCable)
  up.on(element, 'plug-out', plugOutCable)
  up.on('plug-in-success', plugOutOtherCables)
  up.on('reset:off', () => (enabled = false))
  up.on('reset:on', () => (enabled = true))

  init()
})
