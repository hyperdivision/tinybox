const Hash = require('./hash')

module.exports = get

function get (store, key, cb) {
  store.head(function (err, head) {
    if (err) return cb(err)
    update(store, head, key, new Hash(key), 0, cb)
  })
}

function getNodeAndUpdate (store, key, hash, i, seq, cb) {
  store.getNode(seq, function (err, node) {
    if (err) return cb(err)
    update(store, node, key, hash, i + 1, cb)
  })
}

function update (store, head, key, hash, i, cb) {
  if (!head) return cb(null, null)

  for (; i < hash.length; i++) {
    const val = hash.get(i)
    if (val === head.hash.get(i)) continue

    if (i >= head.trie.length) return cb(null, null)

    const bucket = head.trie[i]
    if (!bucket) return cb(null, null)

    const seq = bucket[val]
    if (!seq) return cb(null, null)

    getNodeAndUpdate(store, key, hash, i, seq, cb)
    return
  }

  if (head.key.equals(key)) return cb(null, head)
  cb(null, null)
}
