# tinystore

Tiny, single file, scalable key value store based on HAMTS

```
npm install tinystore
```

(Uses the [Hypertrie](https://github.com/mafintosh/hypertrie) trie without the replication parts)

## Usage

``` js
const Tinystore = require('tinystore')

const db = new Tinystore('./db')

db.put('hello', 'world', function () {
  db.get('hello', console.log)
})
```

## License

MIT
