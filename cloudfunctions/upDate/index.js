// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection, query, upData } = event
  try {
    const res = await db.collection(collection).where(query).update({
      data: upData
    })
    if (res.errMsg === 'collection.update:ok') {
      return{
        success:true,
        message:'update success',
        data:res
      }
    }
    return {
        success:false,
        message:'update failed',
        data:res
    }
  }catch(e){
    return{
      success:false,
      message:'update error',
      data:e
    }
  }


}