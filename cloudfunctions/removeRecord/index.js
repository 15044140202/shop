// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {collection , query} = event
  try{
    const res = await db.collection(collection).where(query).remove()
    if (res.errMsg === 'collection.remove:ok') {//成功
      return {
        success:true,
        meaasge:'remove record success',
        data:res
      }
    }else{
      return{
        success:false,
        meaasge:'remove record failed',
        data:res
      }
    }
  }catch(e){
    return{
      success:false,
      meaasge:'remove record error',
      data:e
    }
  }
}