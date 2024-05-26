// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event) => {
  const {openid} = event
  const result = await db.collection('shopAccount').where({
    _openid:openid
  }).field({
        shop:true
  }).get()

  return result.data[0].shop
}