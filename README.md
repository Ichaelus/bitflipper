## BITFLIPPER

![Bitflipper Example](assets/bitflipper.png)

Bitflipper is a little "synthesizer" build using modern web techniques like AudioWorklet. It's main functionallity is the bit-wise control over the sound input using the colored buttons - hence the name. 

Check it out live: https://bitflipper.leimstaedtner.it

You can even plug-in your MIDI-controller and use it on stage - all assets are chached offline!

Currently, [only a few Browsers](https://caniuse.com/#search=AudioWorklet) support AudioWorklets. I recommend using Chrome for now.


### Development

* Start a local https server
  * E.g. with ruby:
  ```ruby
  ruby -r webrick/https -e 'WEBrick::HTTPServer.new(Port: 8000, DocumentRoot: ".", SSLEnable: true, SSLCertName: [%w[CN localhost]]).start'
  ```
* Open https://localhost:8000/ or https://bitflipper.lvh.me:8000/
* When done, increase the version number in the manifest.appdata file and commit your changes. 
* Your code will be synced to production once merged into `master`.