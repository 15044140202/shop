// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection , query} = event
  try{
    const res = await db.collection(collection).where(query).get()
    if (res.errMsg === 'collection.get:ok') {
      return {
        success:true,
        message:'collection.get data success',
        data:res.data
      }
    }else{
      return {
        success:false,
        message:'collection.get data failed',
        data:res
      }
    }
  }catch(e){
    return{
      success:false,
      message:'collection.get data error',
      data:e
    }
  }
}