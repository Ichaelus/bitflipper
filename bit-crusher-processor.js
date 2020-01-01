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
        name: 'bitDepth',
        defaultValue: 8,
        minValue: 1,
        maxValue: 16,
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
    this.floatRange = 256;
    this.channelModifiers = [
      1, // 1st bit
      1, // 2nd bit
      1, // 3nd bit
      1, // 4th bit
      1, // 5th bit
      1, // 6th bit
      1, // 7th bit
      1, // 8th bit
    ];
    
    // listen for modifier changers
    this.port.onmessage = (event) => {
      const eventType = event.data[0];
      if(eventType == 'channel-state'){
        let channel = event.data[1];
        let modifier = event.data[2];
        this.channelModifiers[channel] = modifier;
      }else if(eventType == 'float-range'){
        this.floatRange = event.data[1];
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // AudioParam array can be either length of 1 or 128. Generally, the code
    // should prepare for both cases. In this particular example, |bitDepth|
    // AudioParam is constant but |frequencyReduction| is being automated.
    const bitDepth = parameters.bitDepth;
    const frequencyReduction = parameters.frequencyReduction;
    const isBitDepthConstant = bitDepth.length === 1;

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      let step = Math.pow(0.5, bitDepth[0]); // square root
      for (let i = 0; i < inputChannel.length; ++i) {
        // We only take care |bitDepth| because |frequencuReduction| will always
        // have 128 values.
        if (!isBitDepthConstant) {
          step = Math.pow(0.5, bitDepth[i]); // square root - simulate 8 bit channels
        }
        if(frequencyReduction.length == 1){
          // using the initial value
          this.phase_ += frequencyReduction[0];
        }else{
          // modulated values for all channels (see index.html)
          this.phase_ += frequencyReduction[i];
        }
        if (this.phase_ >= 1.0) {
          this.phase_ -= 1.0;
          //TODO: bitDepth reduction did not seem to have any effect. trying to improve this - then remove bitdepth code
          // this.lastSampleValue_ = step * Math.floor(inputChannel[i] / step + 0.5);
 
          this.lastSampleValue_ = this.applyChannelFilters(inputChannel[i]);
        }

        outputChannel[i] = this.lastSampleValue_;
      }
    }

    // keep running
    return true;
  }

  convertToNBitFloat(float32){
    return this.convertToNBitInt(float32) * 1.0 / this.floatRange;
  }

  convertToNBitInt(float32){
    return Math.round(float32 * this.floatRange);
  }

  applyChannelFilters(sampleValue){
    // TODO: Remove old tryhard code 
    // let reducedBitIndex = Math.floor(i / 16); // 128 / 8 == 16 channels per bit
    // outputChannel[i] = this.channelModifiers[reducedBitIndex] * this.lastSampleValue_;
    const sign = Math.sign(sampleValue);
    let modifiedIntValue = Math.abs(this.convertToNBitInt(sampleValue));
    this.channelModifiers.forEach(function(modifier, index){
      let bitmask = 1 << index;
      if(modifier == -1){
        modifiedIntValue ^= bitmask; // invert the bit
      }else if(modifier == 0){
        modifiedIntValue &= ~bitmask; // set the bit to zero
      }
    });

    return (modifiedIntValue * 1.0 / this.floatRange) * sign;
  }
}

registerProcessor('bit-crusher-processor', BitCrusherProcessor);