const Trie = require('./lib/trie-compressor')
const Storage = require('./lib/storage')
const get = require('./lib/get')
const put = require('./lib/put')
const Node = require('./lib/node')
const mutexify = require('mutexify')
const thunky = require('thunky')

module.exports = class Tinystore {
  constructor (file) {
    this.data = new Storage(file)
    this.lock = mutexify()
    this.opened = false
    this.ready = thunky(open.bind(this))
  }

  head (cb) {
    if (!this.data.head) return cb(null, null)
    this.getNode(this.data.head, cb)
  }

  getNode (seq, cb) {
    this.data.get(seq, function (err, data) {
      if (err) return cb(err, null)
      const node = new Node(data)
      node.seq = seq
      cb(null, node)
    })
  }

  get (key, cb) {
    if (!Buffer.isBuffer(key)) key = Buffer.from(key)
    if (!this.opened) return openAndGet(this, key, cb)
    get(this, key, cb)
  }

  put (key, value, cb) {
    if (!cb) cb = noop
    if (!Buffer.isBuffer(key)) key = Buffer.from(key)
    if (!this.opened) return openAndPut(this, key, value || null, cb)
    if (value && !Buffer.isBuffer(value)) value = Buffer.from(value)
    put(this, key, value || null, cb)
  }

  flush (cb) {
    this.ready((err) => {
      if (err) return cb(err)
      this.lock(unlock => unlock(cb, null))
    })
  }
}

function noop () {}

function openAndGet (self, key, cb) {
  self.ready(function (err) {
    if (err) return cb(err)
    self.get(key, cb)
  })
}

function openAndPut (self, key, value, cb) {
  self.ready(function (err) {
    if (err) return cb(err)
    self.put(key, value, cb)
  })
}

function open (cb) {
  this.data.open((err) => {
    if (err) return cb(err)
    this.opened = true
    cb(null)
  })
}
