const Node = require('./node')

module.exports = get

function get (store, key, cb) {
  const target = new Node(key, null, null)

  update(store.data, store.data.latest, target, 0, cb)
}

function getNodeAndUpdate (storage, target, i, seq, cb) {
  storage.get(seq, function (err, node) {
    if (err) return cb(err)
    update(storage, node, target, i + 1, cb)
  })
}

function update (storage, head, target, i, cb) {
  if (!head) return cb(null, null)

  for (; i < target.hash.length; i++) {
    const val = target.hash.get(i)
    if (val === head.hash.get(i)) continue

    if (i >= head.links.length) return cb(null, null)

    const link = head.links[i]
    if (!link) return cb(null, null)

    const seq = link[val]
    if (!seq) return cb(null, null)

    getNodeAndUpdate(storage, target, i, seq, cb)
    return
  }

  if (head.key.equals(target.key)) return cb(null, head)
  cb(null, null)
}
