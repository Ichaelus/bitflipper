/***
 * Allow the user to switch between different audio sources
***/
up.compiler('.input-selection', function (element) {

  up.on('audioContext:connected', function () {
    up.on(element, 'click', '.input-selection--switch', function () {
      if (!Machine.powered) {
        return
      }
      SourceController.switchToNextSource()
    })

    up.on('plug-in', function (_evt, target) {
      if (!Machine.powered) {
        return
      }
      element.classList.toggle(
        '-right',
        target.classList.contains('microphone'),
      )
    })
  })

})
