const Tinystore = require('./')
const t = new Tinystore(require('random-access-file')('test.db'))

t.put('hi', null)
t.put('ho', Buffer.alloc(9))
t.put('ha', null)
t.put('hi', Buffer.alloc(120))
t.put('hx', null)
t.put('soo', null)

for (let i = 0; i < 1e4; i++) {
  t.put('hi-' + i, 'hi-' + i)
}

console.time()
t.flush(function () {
  console.timeEnd()
  t.get('hi-4240', print)
  t.get('hi', print)
  t.get('ho', print)
  t.get('ha', print)
  t.get('hx', print)
  t.get('soo', print)
  t.get('hi-424', print)
})

function print (err, node) {
  if (err) throw err
  console.log(node.key.toString() + ' --> ' + (node.value ? node.value.length : 0) + ' bytes', node.seq)
}
