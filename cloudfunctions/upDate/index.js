// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection, query, upData = {}, _push = {}, _pull = {} , _inc = {},_shift = {},_unshift = {} } = event
  const UPDATA = upData || {}
  //计算upDta
  for (let key in _push) {
    UPDATA[key] = _.push(_push[key])
  }
  for (let key in _inc) {
    UPDATA[key] = _.inc(_inc[key])
  }
  for (let key in _pull) {
    UPDATA[key] = _.pull(_pull[key])
  }
  for (let key in _shift) {//数组更新操作符，对一个值为数组的字段，将数组头部元素删除
    UPDATA[key] = _.shift()
  }
  for (let key in _unshift) {//数组更新操作符，对一个值为数组的字段，往数组头部添加一个或多个值。或字段原为空，则创建该字段并设数组为传入值
    UPDATA[key] = _.unshift(_unshift[key])
  }
  try {
    const res = await db.collection(collection).where(query).update({
      data: UPDATA
    })
    if (res.errMsg === 'collection.update:ok') {
      return {
        success: true,
        message: 'update success',
        data: res
      }
    }
    return {
      success: false,
      message: 'update failed',
      data: res
    }
  } catch (e) {
    return {
      success: false,
      message: 'update error',
      data: e
    }
  }


}