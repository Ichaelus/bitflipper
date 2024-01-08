/***
 * A tunable button that interpolates the mouse position in relation
 * to the knob's center.
 *
 * Knobs are also controllable with MIDI control signals.
***/
up.compiler('knob', (knob, data) => {
  const element = Template.clone('knob', knob)
  const elementDialGrip = element.querySelector('.knob--dial-grip')
  const elementSVG = element.querySelector('.knob--dial-svg')
  const elementLabel = element.querySelector('.knob--label')
  const ACTIVE_CLASS = '-active'

  knob.title = `Drag vertically to change the ${data.title.toLowerCase()} value`
  elementLabel.title = data.title
  elementLabel.innerText = data.label

  let currentY = 0

  function init() {
    enhanceElement()
    moveKnobPosition()
    addEventListeners()
    MidiMap.registerControl(element, data.identifier, midiKnobMoved)
  }

  function enhanceElement() {
    element.MINIMUM = 0
    element.MAXIMUM = 264
    element.STROKE_LIMIT = 184
    element.MEDIAN = element.MAXIMUM / 2
    element.OFFSET = -element.MEDIAN
    element.rotation = element.MAXIMUM
    element.classList.add(data.modifier)
    element.getValue = () => {
      return (element.rotation + element.MINIMUM) / element.MAXIMUM
    }
    element.setValue = (value) => {
      element.rotation = parseFloat(value) * element.MAXIMUM - element.MINIMUM
    }
    element.setValue(data.initialValue)
  }

  function moveKnobPosition() {
    const dialRotation = element.rotation + element.OFFSET
    elementDialGrip.style.transform = `translate(-50%,-50%) rotate(${dialRotation}deg)`
    const STROKE = ((element.rotation + element.OFFSET + element.MEDIAN) / element.MAXIMUM)
    elementSVG.style.strokeDashOffset = element.STROKE_LIMIT - element.STROKE_LIMIT * STROKE
  }

  function midiKnobMoved(midiValue) {
    element.rotation = midiValue * element.MAXIMUM
    moveKnobPosition()
    up.emit(element, 'button-value-changed')
  }

  function mouseKnobMoved(evt) {
    if (!Machine.powered || !element.classList.contains(ACTIVE_CLASS)) {
      return
    }

    // Knob Rotation
    let newY = evt.pageY
    if (typeof newY === 'undefined') {
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

  function mouseKnobPressed(evt) {
    element.classList.add(ACTIVE_CLASS)
    currentY = evt.pageY || evt.changedTouches[0].pageY
    evt.preventDefault()
  }

  function mouseKnobReleased(evt) {
    element.classList.remove(ACTIVE_CLASS)
  }

  function addEventListeners() {
    element
      .querySelector('.knob--active-light')
      .addEventListener('click', () => element.classList.toggle(ACTIVE_CLASS))
    up.on(elementDialGrip, 'mousedown touchstart', mouseKnobPressed)
    up.on('mousemove touchmove', mouseKnobMoved)
    up.on('mouseup touchend touchcancel', mouseKnobReleased)
  }

  init()
})
