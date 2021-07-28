import { clamp } from 'app/utils/math'

type Options = {
  float32?: boolean
}

export function bufferToWAV(buffer: AudioBuffer, opts: Options = {}) {
  return encodeWAV(
    buffer.numberOfChannels === 2
      ? interleave(buffer.getChannelData(0), buffer.getChannelData(1))
      : buffer.getChannelData(0),
    opts.float32 ? 3 : 1,
    buffer.sampleRate,
    buffer.numberOfChannels,
    opts.float32 ? 32 : 16
  )
}

function encodeWAV(
  samples: Float32Array,
  format: number,
  sampleRate: number,
  numChannels: number,
  bitDepth: number
) {
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
  const view = new DataView(buffer)

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + samples.length * bytesPerSample, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(view, 36, 'data')
  view.setUint32(40, samples.length * bytesPerSample, true)
  ;(format === 1 ? floatTo16BitPCM : writeFloat32)(view, 44, samples)

  return buffer
}

function interleave(left: Float32Array, right: Float32Array) {
  const result = new Float32Array(left.length + right.length)
  for (let i = 0, e = 0; i < result.length; e++) {
    result[i++] = left[e]
    result[i++] = right[e]
  }
  return result
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++)
    view.setUint8(offset + i, str.charCodeAt(i))
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = clamp(-1, input[i], 1)
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
}

function writeFloat32(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 4)
    view.setFloat32(offset, input[i], true)
}
