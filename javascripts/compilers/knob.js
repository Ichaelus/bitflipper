up.compiler('knob', (element, data) => {
  // Load template
  const template = document.getElementById('knob')
  const templateContent = template.content
  element.appendChild(templateContent.cloneNode(true))

  // Initialize
  element.MINIMUM = 0
  element.MAXIMUM = 264
  element.MEDIAN = element.MAXIMUM / 2
  element.OFFSET = -element.MEDIAN
  element.rotation = element.MAXIMUM
  const knob = element.querySelector('.knob')
  let elementDialGrip = element.querySelector('.knob--dial-grip')
  let elementSVG = element.querySelector('.knob--dial-svg')
  let elementLabel = element.querySelector('.knob--label')
  elementLabel.title = data.title
  elementLabel.innerText = data.label
  element.classList.add(data.modifier)

  let currentY = 0
  let enabled = false

  element.getValue = function () {
    return (element.rotation + element.MINIMUM) / element.MAXIMUM
  }

  element.setValue = function (value) {
    element.rotation = parseFloat(value) * element.MAXIMUM - element.MINIMUM
  }

  function init() {
    element.setValue(data.initialValue)
    moveKnobPosition()
    addEventListeners()
    MidiMap.registerControl(knob, data.identifier, midiMoved)
  }

  function moveKnobPosition() {
    elementDialGrip.style.transform = `translate(-50%,-50%) rotate(${
      element.rotation + element.OFFSET
    }deg)`
    elementSVG.style.strokeDashOffset =
      184 -
      184 *
        ((element.rotation + element.OFFSET + element.MEDIAN) / element.MAXIMUM)
  }

  function midiMoved(midiValue) {
    element.rotation = midiValue * element.MAXIMUM
    moveKnobPosition()
    up.emit(element, 'button-value-changed')
  }

  function knobMoved(evt) {
    if (element.classList.contains('-active') && enabled) {
      // Knob Rotation
      let newY = evt.pageY
      if (typeof newY == 'undefined') {
        // Mobile uses touches, not scrolls
        newY = evt.changedTouches[0].pageY
      }
      if (newY - currentY !== 0) {
        element.rotation -= newY - currentY
      }
      currentY = newY

      // Setting Max rotation
      if (element.rotation >= element.MAXIMUM) {
        element.rotation = element.MAXIMUM
      } else if (element.rotation <= element.MINIMUM) {
        element.rotation = element.MINIMUM
      }
      moveKnobPosition()
      up.emit(element, 'button-value-changed')
    }
  }

  function knobPressed(evt) {
    element.classList.add('-active')
    currentY = evt.pageY || evt.changedTouches[0].pageY
    evt.preventDefault()
  }

  function knobReleased(evt) {
    element.classList.remove('-active')
  }

  function disableKnob() {
    enabled = false
  }

  function enableKnob() {
    enabled = true
  }

  function addEventListeners() {
    element
      .querySelector('.knob--active-light')
      .addEventListener('click', function () {
        element.classList.toggle('-active')
      })
    elementDialGrip.addEventListener('mousedown', knobPressed)
    elementDialGrip.addEventListener('touchstart', knobPressed)
    up.on('mousemove touchmove', knobMoved)
    up.on('mouseup touchend touchcancel', knobReleased)
    up.on('reset:off', disableKnob)
    up.on('reset:on', enableKnob)
  }

  init()
})
