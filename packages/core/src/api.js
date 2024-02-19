const lodash = require('lodash')

/**
 * 找出 newObj 中相对于 oldObj 有变化的部分
 *
 * @param oldObj
 * @param newObj
 * @param parentKey
 * @returns {{}|*}
 */
function doDiff (oldObj, newObj, parentKey) {
  const empty = ''
  if (lodash.isEmpty(newObj)) {
    return oldObj
  }
  const diffObj = {}
  for (const key in newObj) {
    const newValue = newObj[key]
    const oldValue = oldObj[key]
    console.log(`${parentKey ? parentKey : empty}.key:`, key, ', newValue:', newValue, ', oldValue:', oldValue)

    // 新旧值相等时，忽略
    if (lodash.isEqual(newValue, oldValue)) {
      console.log(`skip ${parentKey ? parentKey : empty}.${key} isEquals`)
      continue
    }
    // 新值不为空，旧值为空时，直接取新值
    if (!lodash.isEmpty(newValue) && lodash.isEmpty(oldValue)) {
      diffObj[key] = newValue
      console.log(`${parentKey ? parentKey : empty}.${key} = `, newValue)
      continue
    }
    // 新的值为数组时，直接取新值
    if (lodash.isArray(newValue)) {
      diffObj[key] = newValue
      console.log(`${parentKey ? parentKey : empty}.${key} = `, newValue)
      continue
    }

    // 新的值为对象时，递归合并
    if (lodash.isObject(newValue)) {
      console.log('------------------')
      const diffObj2 = doDiff(oldValue, newValue, key)
      if (!lodash.isEmpty(diffObj2)) {
        diffObj[key] = diffObj2
        console.log(`${parentKey ? parentKey : empty}.${key} = `, diffObj[key])
      } else {
        console.log(`skip ${parentKey ? parentKey : empty}.${key} isEmpty(diffObj2)`)
      }
      console.log('------------------')
      continue
    }

    // 新值为空时，忽略
    if (newValue == null) {
      console.log(`skip ${parentKey ? parentKey : empty}.${key} isEmpty(newValue):`, newValue)
      continue
    }

    // 基础类型，直接覆盖
    diffObj[key] = newValue
    console.log(`${parentKey ? parentKey : empty}.${key} = `, newValue)
  }

  return diffObj
}

module.exports = {
  doDiff,
  doMerge: function (oldObj, newObj) {
    return lodash.mergeWith(oldObj, newObj, function (objValue, srcValue) {
      if (lodash.isArray(objValue)) {
        return srcValue
      }
    })
  },
  toJson: function (obj) {
    return JSON.stringify(obj, null, '\t')
  }
}
