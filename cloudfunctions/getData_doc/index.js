// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection , _id} = event
  try{
    const res = await db.collection(collection).doc(_id).get()
    if (res.errMsg === 'document.get:ok') {
      return {
        success:true,
        message:'doc data success',
        data:res.data
      }
    }else{
      return {
        success:false,
        message:'doc data failed',
        data:res
      }
    }
  }catch(e){
    return{
      success:false,
      message:'doc data error',
      data:e
    }
  }
}