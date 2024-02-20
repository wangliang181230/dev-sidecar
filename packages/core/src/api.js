const lodash = require('lodash')

/**
 * 找出 newObj 相对于 oldObj 有差异的部分
 *
 * @param oldObj
 * @param newObj
 * @returns {{}|*}
 */
function doDiff (oldObj, newObj) {
  if (newObj == null) {
    return oldObj
  }
  const tempObj = { ...oldObj }
  const diffObj = {}
  for (const key in newObj) {
    const newValue = newObj[key]
    const oldValue = oldObj[key]

    // 新值不为空，旧值为空时，直接取新值
    if (newValue != null && oldValue == null) {
      diffObj[key] = newValue
      continue
    }
    // 新旧值相等时，忽略
    if (lodash.isEqual(newValue, oldValue)) {
      delete tempObj[key]
      continue
    }
    // 新的值为数组时，直接取新值
    if (lodash.isArray(newValue)) {
      diffObj[key] = newValue
      delete tempObj[key]
      continue
    }

    // 新的值为对象时，递归合并
    if (lodash.isObject(newValue)) {
      diffObj[key] = doDiff(oldValue, newValue)
      delete tempObj[key]
      continue
    }

    // 基础类型，直接覆盖
    delete tempObj[key]
    diffObj[key] = newValue
  }

  // tempObj 里面剩下的是被删掉的
  lodash.forEach(tempObj, (defValue, key) => {
    // 将被删除的属性设置为null，目的是为了重新merge回原对象时，将被删掉的对象设置为null，达到删除的目的
    diffObj[key] = null
  })
  return diffObj
}

function deleteDisabledItem (target) {
  lodash.forEach(target, (item, key) => {
    if (item == null) {
      delete target[key]
    }
    if (lodash.isObject(item)) {
      deleteDisabledItem(item)
    }
  })
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
  },
  deleteDisabledItem
}
