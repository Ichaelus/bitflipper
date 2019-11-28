up.compiler('.knob', (element) => {
    element.MINIMUM = 0;
    element.MAXIMUM = 264;
    element.MEDIAN = element.MAXIMUM / 2;
    element.OFFSET = -element.MEDIAN;
    element.rotation = element.MAXIMUM;
    let elementDialGrip = element.querySelector('.knob--dial-grip');
    let elementSVG = element.querySelector('.knob--dial-svg');
    let currentY = 0;

    element.getValue = function () {
      return (element.rotation + element.MINIMUM) / element.MAXIMUM;
    }

    element.setValue = function (value) {
      element.rotation = parseFloat(value) * element.MAXIMUM - element.MINIMUM;
    }

    function init(){
      element.setValue(element.getAttribute('data-initial-value'));
      moveKnobPosition();
      addEventListeners();
    }

    function moveKnobPosition(){
      elementDialGrip.style.transform = `translate(-50%,-50%) rotate(${element.rotation + element.OFFSET}deg)`;
      elementSVG.style.strokeDashOffset = 184 - 184 * ((element.rotation + element.OFFSET + element.MEDIAN) / element.MAXIMUM);
    }

    function knobMoved(evt) {
      if (element.classList.contains('-active')) {
        // Knob Rotation
        let newY = evt.pageY || evt.changedTouches[0].pageY;
        if (newY - currentY !== 0) {
          element.rotation -= (newY - currentY);
        }
        currentY = newY;

        // Setting Max rotation
        if (element.rotation >= element.MAXIMUM) {
          element.rotation = element.MAXIMUM;
        } else if (element.rotation <= element.MINIMUM) {
          element.rotation = element.MINIMUM;
        }
        moveKnobPosition();
        up.emit('button-value-changed', { target: element });
      }
    }

    function knobPressed(evt){
      element.classList.add('-active');
      currentY = evt.pageY || evt.changedTouches[0].pageY;
      evt.preventDefault();
    }

    function knobReleased(evt){
      element.classList.remove('-active');
    }

    function addEventListeners(){
      element.querySelector('.knob--active-light').addEventListener('click', function () {
        element.classList.toggle('-active');
      })
      elementDialGrip.addEventListener('mousedown', knobPressed);
      elementDialGrip.addEventListener('touchstart', knobPressed);
      up.on('mousemove touchmove', knobMoved);
      up.on('mouseup touchend touchcancel', knobReleased);
    }

    init();
});