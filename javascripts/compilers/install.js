up.compiler('.install', function(element){

  element.deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (evt) => {
    // Stash the event so it can be triggered later.
    element.deferredPrompt = evt;
    element.classList.add('-available');
    up.on(element, 'click', install);
  });

  function install(evt){
    element.deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    element.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        element.deferredPrompt = null;
        element.classList.remove('-available');
      });
  }
});