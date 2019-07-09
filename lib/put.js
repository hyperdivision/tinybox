const Node = require('./node')

module.exports = put

function put (store, key, value, cb) {
  const target = new Node(key, value)

  store.lock(function (unlock) {
    update(store.data, store.data.latest, target, 0, unlock, cb)
  })
}

function update (storage, head, target, i, unlock, cb) {
  if (!head) {
    finalize(storage, null, target, unlock, cb)
    return
  }

  for (; i < target.hash.length; i++) {
    const headVal = head.hash.get(i)
    const headLink = i < head.links.length ? head.links[i] : null
    const val = target.hash.get(i)

    if (headLink) {
      for (let j = 0; j < headLink.length; j++) {
        if (j === val || !headLink[j]) continue // we are closest
        target.trieBuilder.addLink(i, j, headLink[j])
      }
    }

    if (val === headVal) continue
    target.trieBuilder.addLink(i, headVal, head.seq)

    if (!headLink) break
    const seq = headLink[val]
    if (!seq) break

    getNodeAndUpdate(storage, target, i, seq, unlock, cb)
    return
  }

  finalize(storage, head, target, unlock, cb)
}

function getNodeAndUpdate (storage, target, i, seq, unlock, cb) {
  storage.get(seq, function (err, node) {
    if (err) return cb(err)
    update(storage, node, target, i + 1, unlock, cb)
  })
}

function finalize (storage, head, target, unlock, cb) {
  storage.append(target, function (err) {
    if (err) return done(err)

    if (head && head.key.equals(target.key)) { // if same, we can free old one
      storage.free(head, done)
      return
    }

    done(null)
  })

  function done (err) {
    if (err) return unlock(cb, err)
    storage.writeHeader(unlock.bind(null, cb))
  }
}
