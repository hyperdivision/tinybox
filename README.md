# tinystore

Tiny, single file, scalable key value store based on HAMTs

```
npm install tinystore
```

Uses the [Hypertrie](https://github.com/mafintosh/hypertrie) trie without the replication parts,
and auto compacts.

Still under development but the storage format should be stable. Upcoming features include batching,
deletions and getting all values out of the store.

## Usage

``` js
const Tinystore = require('tinystore')

const db = new Tinystore('./db')

db.put('hello', 'world', function () {
  db.get('hello', console.log)
})
```

## API

#### `db = new TinyStore(storage)`

Create a new tiny store. Storage can be any (random-access-storage](https://github.com/random-access-storage) instance.
For conveinience you can pass a filename as storage as well.

#### `db.get(key, callback)`

Looks up a value. Key can be a buffer or string. If the key does not exist null is passed, otherwise
the a Node object looking like this:

```js
{
  key: <key as a buffer>,
  value: <value stored>
}
```

#### `db.put(key, [value], [callback])`

Insert a key and optional value.

## License

MIT
