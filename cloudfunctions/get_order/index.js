// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { skip ,shopId,startTime,endTime } = event
  console.log(event)
  try {
    const count = await db.collection('table_order').where({
      shopId:shopId,
      time:_.gte(9998).and(_.lte(10000)) 
    }).count()
    const result = await db.collection('table_order').where({
      shopId:shopId,
      time:_.gte(9998).and(_.lte(10000))  
    }).orderBy('time', 'desc').skip(skip).limit(100).get()

    if (result.errMsg === 'collection.get:ok') {
      return {
        success: true,
        message: 'fetchData success',
        data: result,
        count: count
      }
    } else {
      return {
        success: false,
        message: 'fetchData false',
        data: result
      }
    }
  } catch (e) {
    return {
      success: false,
      message: 'fetchData Error',
      data: e
    }
  }
}