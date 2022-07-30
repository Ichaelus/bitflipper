/***
 * Install Bitflipper as a PWA
***/
up.compiler('.install', function (element) {
  element.deferredPrompt = null

  window.addEventListener('beforeinstallprompt', evt => {
    if (element.deferredPrompt === null) {
      // Stash the event so it can be triggered later.
      element.deferredPrompt = evt
      element.classList.add('-available')
      up.on(element, 'click', install)
    }
  })

  function install(_evt) {
    element.deferredPrompt.prompt()
    // Wait for the user to respond to the prompt
    element.deferredPrompt.userChoice.then(choiceResult => {
      if (choiceResult.outcome === 'accepted') {
        console.info('User accepted the A2HS prompt')
        element.deferredPrompt = null
      } else {
        console.info('User dismissed the A2HS prompt')
      }
      element.classList.remove('-available')
    })
  }
})
