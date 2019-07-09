const varint = require('varint')
const Hash = require('./hash')
const TrieBuilder = require('./trie-builder')

const EMPTY = Buffer.alloc(0)

class Node {
  constructor (key, value = null, links = null) {
    this.seq = 0 // set by storage
    this.blockSize = 0 // set by storage
    this.key = key
    this.value = value
    this.trieBuilder = links ? null : new TrieBuilder()
    this.links = links
    this.hash = new Hash(this.key)
  }

  finalise () {
    const { deflated, links } = this.trieBuilder.finalise()
    const buf = Buffer.allocUnsafe(encodingLength(this, deflated))
    const val = this.value || EMPTY

    this.links = links
    this.trieBuilder = null

    let offset = 9 // we need 9 bytes for the storage header

    varint.encode(this.key.length, buf, offset)
    offset += varint.encode.bytes

    this.key.copy(buf, offset)
    offset += this.key.length

    varint.encode(deflated.length, buf, offset)
    offset += varint.encode.bytes

    deflated.copy(buf, offset)
    offset += deflated.length

    varint.encode(val.length, buf, offset)
    offset += varint.encode.bytes

    val.copy(buf, offset)
    offset += val.length

    return buf
  }

  static decode (buf) {
    let offset = 9

    const kl = varint.decode(buf, offset)
    offset += varint.decode.bytes
    const key = buf.slice(offset, offset += kl)

    const tl = varint.decode(buf, offset)
    offset += varint.decode.bytes
    const trieBuffer = buf.slice(offset, offset += tl)

    const vl = varint.decode(buf, offset)
    offset += varint.decode.bytes
    const value = vl ? buf.slice(offset, offset += vl) : null

    const links = TrieBuilder.inflate(trieBuffer)

    return new Node(key, value, links)
  }
}

function encodingLength (node, trieBuffer) { // excluding the free list link
  const val = node.value || EMPTY

  const nl = varint.encodingLength(node.key.length)
  const vl = varint.encodingLength(val.length)
  const tl = varint.encodingLength(trieBuffer.length)

  return 9 + nl + node.key.length + vl + val.length + tl + trieBuffer.length
}

module.exports = Node
