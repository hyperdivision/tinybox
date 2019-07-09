const varint = require('varint')

module.exports = class TrieBuilder {
  constructor () {
    this.offset = -1
    this.result = []
    this.end = 0
    this.buckets = 0
  }

  bucket (offset) {
    if (this.end > 0) {
      this.result[this.end - 1] = this.result.length - this.end
    }
    this.result.push(offset, 0)
    this.end = this.result.length
    this.buckets++
    this.offset = offset
  }

  addLink (offset, val, seq) {
    if (this.offset !== offset) this.bucket(offset)
    this.result.push(val, seq)
    return this.result.length - 1
  }

  updateLink (ptr, seq) {
    this.result[ptr] = seq
  }

  finalise () {
    if (this.end > 0) {
      this.result[this.end - 1] = this.result.length - this.end
    }

    const links = new Array(this.buckets && this.offset + 1)
    const buffer = Buffer.allocUnsafe(this.result.length * 8)

    let ptr = 0
    let pos = 0

    while (pos < this.result.length) {
      const bucket = this.result[pos]
      const count = this.result[pos + 1]

      const start = pos + 2
      const end = start + count

      const tmp = [0, 0, 0, 0, 0]
      let bitfield = 0

      for (let i = start; i < end; i += 2) {
        let val = this.result[i]
        const seq = this.result[i + 1]

        let updated = bitfield | (1 << val)
        while (updated === bitfield) {
          val += 5
          updated = bitfield | (1 << val)
          tmp.push(0, 0, 0, 0, 0)
        }

        bitfield = updated
        tmp[val] = seq
      }

      varint.encode(bucket, buffer, ptr)
      ptr += varint.encode.bytes

      varint.encode(bitfield, buffer, ptr)
      ptr += varint.encode.bytes

      links[bucket] = tmp

      for (let i = 0; i < tmp.length; i++) {
        if (tmp[i] > 0) {
          varint.encode(tmp[i], buffer, ptr)
          ptr += varint.encode.bytes
        }
      }

      pos = end
    }

    return { deflated: buffer.slice(0, ptr), links }
  }

  static inflate (buf) {
    if (!buf.length) return []

    const offsets = []
    const buckets = []

    let pos = 0
    while (pos < buf.length) {
      const offset = varint.decode(buf, pos)
      pos += varint.decode.bytes

      let bitfield = varint.decode(buf, pos)
      pos += varint.decode.bytes

      const vals = []

      while (bitfield > 0) {
        const zeros = Math.clz32(bitfield)
        bitfield &= (0x7fffffff >>> zeros)
        vals.push(31 - zeros)
      }

      const seqs = new Array(vals[vals.length - 1] <= 5 ? 5 : 30)
      seqs.fill(0)

      for (let i = vals.length - 1; i >= 0; i--) {
        seqs[vals[i]] = varint.decode(buf, pos)
        pos += varint.decode.bytes
      }

      buckets.push(seqs)
      offsets.push(offset)
    }

    const links = new Array(offsets[offsets.length - 1])
    for (let i = 0; i < offsets.length; i++) links[offsets[i]] = buckets[i]
    return links
  }
}
