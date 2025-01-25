// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const {collection,query} = event
  let res
  if (query) {
    res = await db.collection(collection).where(query).count()
  }else{
    res = await db.collection(collection).count()
  }

  return res
}