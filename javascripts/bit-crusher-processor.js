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
      },
      {
        name: 'frequencyReduction',
        defaultValue: 1,
        minValue: 0,
        maxValue: 1,
      },
    ]
  }

  constructor() {
    super()
    this.MINIMUM_FLOAT_RANGE = 0.005
    this.phase = 0
    this.lastSampleValue = 0
    this.setBits(8)
    this.port.onmessage = this.onMessageFromAudioWorklet.bind(this)
  }

  setBits(newBits) {
    const previousBits = this.bits
    this.bits = newBits
    this.maxFloatRange = 2 ** this.bits
    if (newBits !== previousBits) {
      this.floatRange = 1
      this.bitModifiers = Array(this.bits).fill(1) // N bits, each controllable
    }
  }

  onMessageFromAudioWorklet(event) {
    const eventType = event.data[0]
    if (eventType === 'bit-state') {
      const bit = event.data[1]
      const modifier = event.data[2]
      if (bit < this.bits) {
        this.bitModifiers[bit] = modifier
      } else {
        console.warn(`cannot set modifier on bit ${bit}`)
      }
    } else if (eventType === 'float-range') {
      this.floatRange = Math.max(event.data[1], this.MINIMUM_FLOAT_RANGE)
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]

    this.setBits(parameters.bits[0])
    const frequencyReduction = parameters.frequencyReduction

    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel]
      const outputChannel = output[channel]
      for (let i = 0; i < inputChannel.length; ++i) {
        const currentValue = inputChannel[i]

        if (frequencyReduction.length === 1) {
          // using the initial value
          this.phase += frequencyReduction[0]
        } else {
          // modulated values for all channels (see index.html)
          this.phase += frequencyReduction[i]
        }
        if (this.phase >= 1.0) {
          this.phase -= 1.0

          this.lastSampleValue = this.applyFloatRange(
            this.applyBitFilters(currentValue),
          )
        }

        outputChannel[i] = this.lastSampleValue
      }
    }

    // keep running
    return true
  }

  applyBitFilters(sampleValue) {
    const sign = Math.sign(sampleValue)
    let modifiedIntValue = Math.abs(this.convertToInt(sampleValue))
    this.bitModifiers.forEach(function (modifier, bitToFlip) {
      let bitmask = 1 << (this.bits - bitToFlip)
      if (modifier === -1) {
        modifiedIntValue ^= bitmask // invert the bit
      } else if (modifier === 0) {
        modifiedIntValue &= ~bitmask // set the bit to zero
      } // Else: Don't alter the bit
    })
    const modifiedFloat = this.convertBackToFloat(modifiedIntValue * sign)
    return modifiedFloat
  }

  convertToInt(float32) {
    return Math.floor(float32 * 2 ** this.bits)
  }
  convertBackToFloat(int32) {
    return int32 / 2 ** this.bits
  }
  applyFloatRange(sampleValue) {
    const currentFloatRange = this.floatRange * this.maxFloatRange
    let modifiedIntValue = Math.floor(sampleValue * currentFloatRange) // Rounding => distorted sound effect
    const modifiedFloat = modifiedIntValue / currentFloatRange
    return modifiedFloat
  }
}

registerProcessor('bit-crusher-processor', BitCrusherProcessor)
