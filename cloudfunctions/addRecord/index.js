// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const {collection , data} = event
  try{
    const res = await db.collection(collection).add({
      data:data
    })
    if (res.errMsg === 'collection.add:ok') {//成功
      return {
        success:true,
        meaasge:'add record success',
        data:res
      }
    }else{
      return{
        success:false,
        meaasge:'add record failed',
        data:res
      }
    }
  }catch(e){
    return{
      success:false,
      meaasge:'add record error',
      data:e
    }
  }

}