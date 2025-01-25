// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const collection = event.collection
  const shopId = event.query.shopId
  const openPersonOpenid = event.query.openPersonOpenid
  const startTime = event.query.startTime
  const endTime = event.query.endTime
  const orderNum = event.query.orderNum
  const query = {}
  //整理 query
  shopId ? query.shopId = shopId : null
  orderNum ? query.orderNum = orderNum : null
  openPersonOpenid ? query.openPersonOpenid = openPersonOpenid : null
  startTime ? query.startTime = _.gte(startTime).and(_.lt(endTime)) :null

  const res = await db.collection(collection).where(query).get()
  if (res.errMsg === "collection.get:ok") {
    return{
      success:true,
      message:'collection.get ok',
      data:res
    }
  }else{
    return{
      success:false,
      message:'collection.get error',
      data:res
    }
  }
}