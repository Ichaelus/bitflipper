/***
 * Service class to switch between audio input sources
***/
window.SourceController = new (class {
  constructor() {
    this.registeredSources = []
    this.currentIndex = 0
    up.on('plug-in-failed', this.switchToNextSource)
  }

  registerSource(node) {
    this.registeredSources.push(node)
  }

  currentSource() {
    return this.registeredSources[
      this.currentIndex % this.registeredSources.length
    ]
  }

  setActive(node) {
    this.currentIndex = this.registeredSources.findIndex(otherNode => node === otherNode)
    // will trigger a "plug-in-success" event if successful; else wise "plug-in-failed"
    up.emit('plug-in', { target: node })
  }

  switchToNextSource() {
    this.currentIndex++
    up.emit('plug-in', { target: this.currentSource() })
  }
})()
