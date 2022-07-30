/***
 * A service model to keep track of core Bitflipper metrics
 * like the power status across various events.
***/
window.Machine = new (class {
  constructor() {
    // Most inputs only react to events if the machine is powered on
    this.powered = false
  }
})()

up.on('reset:on', () => Machine.powered = true)
up.on('reset:off', () => Machine.powered = false)
