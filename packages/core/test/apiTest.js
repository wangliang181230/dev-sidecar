const lodash = require('lodash')
const api = require('../src/api.js')

const oldConfig = { a: { aa: 1, bb: 2 }, b: { c: 2 }, d: [1, 2, 3], e: { ee: 1, aa: 2 } }
const newConfig = { a: { aa: 1, bb: 2 }, d: [5], e: { bb: 2, ee: 2, aa: 2 }, f: null, g: {} }

// const result = { d: [ 5 ],e:{ee:2} }

// const load = {a:1,d:[5,1,2,3]}
// const DELETE =  '____DELETE____'
// lodash.mergeWith(oldConfig,newConfig, (objValue, srcValue, key, object, source, stack) => {
//     console.log('stack', stack,'key',key)
//
//     if (lodash.isArray(srcValue)) {
//         return srcValue
//     }
//     if(lodash.isEqual(objValue,srcValue)){
//        //如何删除
//         return DELETE
//     }
// })

console.log('oldConfig:', oldConfig)
console.log('newConfig:', newConfig)
console.log('api.doDiff:', api.doDiff(oldConfig, newConfig))
console.log('api.merge:', api.doMerge(oldConfig, newConfig))
console.log('lodash.mergeWith:', lodash.mergeWith(oldConfig, newConfig))
console.log('lodash.merge:', lodash.merge(oldConfig, newConfig))
console.log('lodash.merge:', lodash.merge([1, 2, 3], [null, null, 4]))
