// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const user_openid = wxContext.FROM_OPENID
  const {shopId} = event
  const task = []
  //获取shopInfo
  task.push(db.collection('shop_account').where({
    _id:shopId
  }).get())
  //获取vipInfo
  task.push(db.collection('vip_list').where({
    shopId:shopId,
    userOpenid:user_openid
  }).get())
  //获取所选店铺幸运九宫格数据
  task.push(db.collection('shop_lucksudoku_set').where({
    shopId:shopId
  }).get())
  //获取店铺会员级别设置信息
  task.push(db.collection('shop_vip_set').where({
    shopId:shopId
  }).get())
  const res = await Promise.all(task)
  return res
}