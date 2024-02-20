const lodash = require('lodash')

function log (msg) {
  // console.log(msg)
}

function ifEmpty (obj, defaultValue) {
  return obj || defaultValue || ''
}

/**
 * 找出 newObj 中相对于 oldObj 有变化的部分
 *
 * @param oldObj
 * @param newObj
 * @param parentKey
 * @returns {{}|*}
 */
function doDiff (oldObj, newObj, parentKey) {
  if (lodash.isEmpty(newObj)) {
    return oldObj
  }
  const diffObj = {}
  for (const key in newObj) {
    const newValue = newObj[key]
    const oldValue = oldObj[key]
    log(`${ifEmpty(parentKey)}.key:`, key, ', newValue:', newValue, ', oldValue:', oldValue)

    // 新旧值相等时，忽略
    if (lodash.isEqual(newValue, oldValue)) {
      log(`skip ${ifEmpty(parentKey)}.${key} isEquals`)
      continue
    }
    // 新值不为空，旧值为空时，直接取新值
    if (!lodash.isEmpty(newValue) && lodash.isEmpty(oldValue)) {
      diffObj[key] = newValue
      log(`${ifEmpty(parentKey)}.${key} = `, newValue)
      continue
    }
    // 新的值为数组时，直接取新值
    if (lodash.isArray(newValue)) {
      diffObj[key] = newValue
      log(`${ifEmpty(parentKey)}.${key} = `, newValue)
      continue
    }

    // 新的值为对象时，递归合并
    if (lodash.isObject(newValue)) {
      log('------------------')
      const diffObj2 = doDiff(oldValue, newValue, key)
      if (!lodash.isEmpty(diffObj2)) {
        diffObj[key] = diffObj2
        log(`${ifEmpty(parentKey)}.${key} = `, diffObj[key])
      } else {
        log(`skip ${ifEmpty(parentKey)}.${key} isEmpty(diffObj2)`)
      }
      log('------------------')
      continue
    }

    // 新值为空时，忽略
    if (newValue == null) {
      log(`skip ${ifEmpty(parentKey)}.${key} isEmpty(newValue):`, newValue)
      continue
    }

    // 基础类型，直接覆盖
    diffObj[key] = newValue
    log(`${ifEmpty(parentKey)}.${key} = `, newValue)
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
