export function loadServiceWorker () {
  navigator.serviceWorker.register('/service-worker.js').then(
    function (registration) {
      console.info(
        'ServiceWorker registration successful with scope: ',
        registration.scope,
      )
    },
    function (err) {
      console.warn('ServiceWorker registration failed: ', err)
    },
  )
}
