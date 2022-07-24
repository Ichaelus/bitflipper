/***
 * An output cable is currently only a visual stub.
 * It is plugged in when the machine boots, and plugged out when powering off.
***/
up.compiler('output-cable', function (outputCable, data) {
  const element = Template.clone('cable-connector', outputCable)

  function init() {
    element.querySelector('.cable-connector--label').innerText = data.label
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

  up.on('reset:off', plugOutCable)
  up.on('reset:on', plugInCable)

  init()
})
