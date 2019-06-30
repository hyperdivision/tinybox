const Hash = require('./hash')
const TrieCompressor = require('./trie-compressor')
const Node = require('./node')

module.exports = put

function put (store, key, value, cb) {
  store.lock(function (unlock) {
    store.head(function (err, node) {
      if (err) return cb(err)
      update(store, node, key, value, new TrieCompressor(), new Hash(key), 0, unlock, cb)
    })
  })
}

function update (store, head, key, value, trie, hash, i, unlock, cb) {
  if (!head) {
    finalize(store, null, key, value, trie, unlock, cb)
    return
  }

  for (; i < hash.length; i++) {
    const headVal = head.hash.get(i)
    const headBucket = i < head.trie.length ? head.trie[i] : null
    const val = hash.get(i)

    if (headBucket) {
      for (let j = 0; j < headBucket.length; j++) {
        if (j === val || !headBucket[j]) continue // we are closest
        trie.push(i, j, headBucket[j])
      }
    }

    if (val === headVal) continue
    trie.push(i, headVal, head.seq)

    if (!headBucket) break
    const seq = headBucket[val]
    if (!seq) break

    getNodeAndUpdate(store, key, value, trie, hash, i, seq, unlock, cb)
    return
  }

  finalize(store, head, key, value, trie, unlock, cb)
}

function getNodeAndUpdate (store, key, value, trie, hash, i, seq, unlock, cb) {
  store.getNode(seq, function (err, node) {
    if (err) return cb(err)
    update(store, node, key, value, trie, hash, i + 1, unlock, cb)
  })
}

function finalize (store, head, key, value, trie, unlock, cb) {
  const buf = Node.encode(key, value, trie)

  store.data.append(buf, function (err) {
    if (err) return done(err)

    if (head && head.key.equals(key)) { // if same, we can free old one
      store.data.free(head.seq, head.byteLength, done)
      return
    }

    done(null)
  })

  function done (err) {
    if (err) return unlock(cb, err)
    store.data.writeHeader(unlock.bind(null, cb))
  }
}
