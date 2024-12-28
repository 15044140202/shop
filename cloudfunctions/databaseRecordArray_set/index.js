// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {
    collection,
    flagName,
    flag,
    record,
    arrayFlagName,
    arrayFlagValue,
    arrayRecord,
    value
  } = event;
  const res = await db.collection(collection).where({
    [flagName]: flag,
    [record]:{
      [arrayFlagName]:arrayFlagValue
    }
  }).update({
    data: {
      [`${record}.$.${arrayRecord}`]: _.set(value)
    }
  })
  if (res.stats.updated === 1) {
    return 'ok'
  } else {
    return 'error'
  }
}