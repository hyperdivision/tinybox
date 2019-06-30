module.exports = class HashPath {
  constructor (key) {
    this.hash = hash(key)
    this.length = this.hash.length * 4 + 1
  }

  get (i) {
    const j = i >> 2
    if (j >= this.hash.length) return 4
    return (this.hash[j] >> (2 * (i & 3))) & 3
  }
}

function hash (data) {
  return require('crypto').createHash('sha256').update(data).digest()
}
