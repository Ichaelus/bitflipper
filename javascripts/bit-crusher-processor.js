// This processor was derived from Google's bitcrusher example:
// https://github.com/GoogleChromeLabs/web-audio-samples/blob/master/audio-worklet/basic/bit-crusher/bit-crusher-processor.js
// This is the original copyright notice:
// Copyright (c) 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file:

class BitCrusherProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'bits',
        defaultValue: 8,
        minValue: 1,
        maxValue: 8,
      }, {
        name: 'frequencyReduction',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
      },
    ];
  }

  constructor() {
    super();
    this.phase_ = 0;
    this.lastSampleValue_ = 0;
    this.setBits(8)
    this.port.onmessage = this.onMessageFromAudioWorklet.bind(this);
  }

  setBits(newBits) {
    const previousBits = this.bits
    this.bits = newBits
    this.maxFloatRange = 2**this.bits;
    if (newBits !== previousBits) {
      this.floatRange = this.maxFloatRange;
      this.bitModifiers = Array(this.bits).fill(1); // N bits, each controllable
    }
  }

  onMessageFromAudioWorklet(event){
    const eventType = event.data[0];
    if (eventType === 'bit-state'){
      const bit = event.data[1];
      const modifier = event.data[2];
      if (bit < this.bits) {
        this.bitModifiers[bit] = modifier;
      } else {
        throw(`cannot set modifier on bit ${bit}`)
      }
    } else if(eventType === 'float-range'){
      this.floatRange = event.data[1];
    }
  };

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    this.setBits(parameters.bits);
    const frequencyReduction = parameters.frequencyReduction;

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; ++i) {
        if(frequencyReduction.length === 1){
          // using the initial value
          this.phase_ += frequencyReduction[0];
        }else{
          // modulated values for all channels (see index.html)
          this.phase_ += frequencyReduction[i];
        }
        if (this.phase_ >= 1.0) {
          this.phase_ -= 1.0;

          this.lastSampleValue_ = this.applyBitFilters(inputChannel[i]);
        }

        outputChannel[i] = this.lastSampleValue_;
      }
    }

    // keep running
    return true;
  }

  applyBitFilters(sampleValue){
    const sign = Math.sign(sampleValue);
    let modifiedIntValue = Math.abs(this.convertToNBitInt(sampleValue));
    // const bit = (modifiedIntValue >>> 0).toString(2)
    // if (bit === '111111')
    //   debugger
    this.bitModifiers.forEach(function(modifier, index){
      let bitmask = 1 << index;
      if(modifier === -1){
        modifiedIntValue ^= bitmask; // invert the bit
      }else if(modifier === 0){
        modifiedIntValue &= ~bitmask; // set the bit to zero
      } // Else: Don't alter the bit
    });
    return (modifiedIntValue * 1.0 / this.floatRange) * sign;
  }

  convertToNBitInt(float32){
    return Math.round(float32 * this.maxFloatRange);
  }
}

registerProcessor('bit-crusher-processor', BitCrusherProcessor);
