window.InputController = new class{
  constructor() {
    this.registeredInputs = [];
    this.currentIndex = 0;
    up.on('plug-in-failed', this.switchToNextInput)
  }

  registerInput(node){
    this.registeredInputs.push(node);
  }

  currentInput(){
    return this.registeredInputs[this.currentIndex % this.registeredInputs.length];
  }

  setActive(node){
    let index = this.registeredInputs.findIndex((otherNode) => node == otherNode)
    this.currentIndex = index;
    // will trigger a "plug-in-success" event if sucessful; elsewise "plug-in-failed"
    up.emit('plug-in', { target: node }); 
  }

  switchToNextInput(){
    this.currentIndex++;
    up.emit('plug-in', { target: this.currentInput() }); 
  }

}


