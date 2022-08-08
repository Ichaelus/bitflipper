/***
 *
***/
window.Logger = new (class {
  majorUserEvent(evt, message) {
    console.info(`%c ${evt.type}`, 'border: 1px solid #ccc; color: #888; padding-right: 6px', message)
  }

  minorUserEvent(evt, message) {
    console.debug(`%c ${evt.type}`, 'border: 1px solid #ccc; color: #888; padding-right: 6px', message)
  }

  logo() {
    console.log(`%c
      =====================================================================
      =  ======================    ===  ===================================
      =  =====================  ==  ==  ===================================
      =  ==========  =========  ======  ===================================
      =  =====  ==    =======    =====  ==  ==    ===    ====   ===  =   ==
      =    ========  =========  ======  ======  =  ==  =  ==  =  ==    =  =
      =  =  ==  ===  =========  ======  ==  ==  =  ==  =  ==     ==  ======
      =  =  ==  ===  =========  ======  ==  ==    ===    ===  =====  ======
      =  =  ==  ===  =========  ======  ==  ==  =====  =====  =  ==  ======
      =    ===  ===   ========  ======  ==  ==  =====  ======   ===  ======
      =====================================================================
      
      Source: https://github.com/ichaelus/bitflipper
      `, 'background: white, color: black')
  }
})()

Logger.logo()
up.on('power:on', (evt) => Logger.majorUserEvent(evt, 'Booting up for the first time') )
up.on('reset:on', (evt) => Logger.majorUserEvent(evt, 'Continuing audio processing') )
up.on('reset:off', (evt) => Logger.majorUserEvent(evt, 'Going into stand-by mode') )
up.on('bits-changed', (evt) => Logger.majorUserEvent(evt, `Setting bit crusher to ${evt.bits} bits`))
up.on('status-text-changed', (evt) => Logger.minorUserEvent(evt, `Display: ${evt.text}`))
