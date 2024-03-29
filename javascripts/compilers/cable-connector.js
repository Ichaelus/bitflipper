/***
 * A clickable audio in/out cable
***/

up.compiler('cable-connector', function (cableConnector, data) {
  const element = Template.clone('cable-connector', cableConnector)
  const PLUG_OUT_ANIMATION_MS = 2000

  function init() {
    if (data.modifier) {
      element.classList.add(data.modifier)
    }
    if (data.title) {
      element.title = data.title
    }
    element.querySelector('.cable-connector--label').innerText = data.label
  }

  function switchToCable(evt) {
    if (!Machine.powered || SourceController.isActive(element)) {
      return
    }
    SourceController.setActive(element)
    Logger.majorUserEvent(evt, `Switching to input source ${data.label}`)
  }

  function plugInCable() {
    element.classList.remove('-plugging-out')
    element.classList.add('-active')
  }

  function plugOutCable() {
    if (!element.classList.contains('-active')) {
      return
    }

    element.classList.add('-plugging-out')
    element.classList.remove('-active')
    setTimeout(function () {
      element.classList.remove('-plugging-out')
    }, PLUG_OUT_ANIMATION_MS)
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

  init()
})
