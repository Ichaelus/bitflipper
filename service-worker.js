const CACHE_NAME = '1.8' // Change to invalidate the cache
const FILES_TO_CACHE = [
  '/',
  '/index.html',

  '/assets/bitflipper.png',
  '/assets/bitflipperlogo.svg',
  '/assets/drumloop.wav',
  '/assets/filter_bandpass.svg',
  '/assets/filter_highpass.svg',
  '/assets/filter_hipass.svg',
  '/assets/filter_lowpass.svg',
  '/assets/jack-connector-cable-red.svg',
  '/assets/jack-connector-cable.svg',
  '/assets/sine.wav',

  '/fonts/Unicode_IEC_symbol.ttf',
  '/fonts/Unicode_IEC_symbol.woff',
  '/fonts/Unicode_IEC_symbol.woff2',
  '/fonts/Unicode_IEC_symbol_font.otf',

  '/javascripts/bit-crusher-processor.js',
  '/javascripts/main.js',
  '/javascripts/unpoly-2.6.1.min.js',

  '/javascripts/compilers/bit-control.js',
  '/javascripts/compilers/cable-connector.js',
  '/javascripts/compilers/display.js',
  '/javascripts/compilers/filter.js',
  '/javascripts/compilers/input-selection.js',
  '/javascripts/compilers/install.js',
  '/javascripts/compilers/knob.js',
  '/javascripts/compilers/manual.js',
  '/javascripts/compilers/microphone.js',
  '/javascripts/compilers/midi.js',
  '/javascripts/compilers/oscillator.js',
  '/javascripts/compilers/oscilloscope.js',
  '/javascripts/compilers/output-cable.js',
  '/javascripts/compilers/power-switch.js',
  '/javascripts/compilers/volume.js',

  '/javascripts/window/logger.js',
  '/javascripts/window/machine.js',
  '/javascripts/window/midi-map.js',
  '/javascripts/window/source-controller.js',
  '/javascripts/window/template.js',

  '/stylesheets/reset.css',
  '/stylesheets/unpoly-2.6.1.min.css',

  '/stylesheets/blocks/bit-control.css',
  '/stylesheets/blocks/cable-connector-stub.css',
  '/stylesheets/blocks/cable-connector.css',
  '/stylesheets/blocks/display.css',
  '/stylesheets/blocks/filter-type.css',
  '/stylesheets/blocks/filter.css',
  '/stylesheets/blocks/input-selection.css',
  '/stylesheets/blocks/input-visualizer.css',
  '/stylesheets/blocks/knob.css',
  '/stylesheets/blocks/machine-back.css',
  '/stylesheets/blocks/machine.css',
  '/stylesheets/blocks/midi.css',
  '/stylesheets/blocks/oscilloscope.css',
  '/stylesheets/blocks/output-cable.css',
  '/stylesheets/blocks/power-switch.css',
  '/stylesheets/blocks/upper-controls.css',

  'https://fonts.googleapis.com/css?family=Press+Start+2P|Inconsolata:700&display=swap',
  'https://fonts.gstatic.com/s/inconsolata/v18/QldXNThLqRwH-OJ1UHjlKGHiw71m5_zIDQ.woff2',
  'https://fonts.gstatic.com/s/inconsolata/v18/QldXNThLqRwH-OJ1UHjlKGHiw71n5_zIDQ.woff2',
  'https://fonts.gstatic.com/s/inconsolata/v18/QldXNThLqRwH-OJ1UHjlKGHiw71p5_w.woff2',
  'https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nYivN04w.woff2',
  'https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nRivN04w.woff2',
  'https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nWivN04w.woff2',
  'https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nbivN04w.woff2',
  'https://fonts.gstatic.com/s/pressstart2p/v8/e3t4euO8T-267oIAQAu6jDQyK3nVivM.woff2',
]

self.addEventListener('install', function (evt) {
  // Precache static resources here.
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.info('[ServiceWorker] Pre-caching offline page')
      return cache.addAll(FILES_TO_CACHE)
    }),
  )
  // Remove previous cached data from disk.
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.info('[ServiceWorker] Removing old cache', key)
            return caches.delete(key)
          }
        }),
      )
    }),
  )
})

self.addEventListener('fetch', function (evt) {
  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(evt.request)
        .then(response => {
          // If the response was good, clone it and store it in the cache.
          if (response.status === 200) {
            cache.put(evt.request.url, response.clone())
          }
          return response
        })
        .catch(err => {
          // Network request failed, try to get it from the cache.
          return cache.match(evt.request)
        })
    }),
  )
})
