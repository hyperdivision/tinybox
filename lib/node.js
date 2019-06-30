const varint = require('varint')
const TrieCompressor = require('./trie-compressor')
const Hash = require('./hash')

const EMPTY = Buffer.alloc(0)

module.exports = class Node {
  constructor (buf) {
    this.seq = 0

    let offset = 2
    let len = varint.decode(buf, offset)
    offset += varint.decode.bytes
    this.key = buf.slice(offset, offset + len)

    offset += len
    len = varint.decode(buf, offset)
    offset += varint.decode.bytes
    this.trie = TrieCompressor.inflate(buf.slice(offset, offset + len))

    offset += len
    len = varint.decode(buf, offset)

    offset += varint.decode.bytes
    this.value = len ? buf.slice(offset, offset + len) : null

    this.hash = new Hash(this.key)

    this.byteLength = buf.length
  }

  static encode (key, val, trie) {
    if (!val) val = EMPTY

    const trieBuffer = trie.deflate()
    const len = varint.encodingLength(key.length) + key.length
      + varint.encodingLength(trieBuffer.length) + trieBuffer.length
      + varint.encodingLength(val.length) + val.length

    const buf = Buffer.allocUnsafe(4 + len)
    let offset = 2

    buf[1] = 0 // type 0 -> a node
    varint.encode(key.length, buf, offset)
    offset += varint.encode.bytes

    key.copy(buf, offset)
    offset += key.length

    varint.encode(trieBuffer.length, buf, offset)
    offset += varint.encode.bytes

    trieBuffer.copy(buf, offset)
    offset += trieBuffer.length

    varint.encode(val.length, buf, offset)
    offset += varint.encode.bytes

    val.copy(buf, offset)

    return buf
  }
}
