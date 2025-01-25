// 云函数入口文件
const cloud = require('wx-server-sdk')
let userinfoCfg = {
  _openid:'',
  lastShop:'',
  taskId:'',
  usedShopId:[],
  userInfo:{
    birthday:'',
    gender:'男',
    headImage:'',
    name:'未修改昵称',
    telephone:''
  }
}
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  userinfoCfg._openid = wxContext.FROM_OPENID
  //先获取用户信息或插入新用户信息
  const userInfoRes = await cloud.callFunction({
    name:"getOrInsertData",
    data:{
      collection:'user_info',
      query:{
        _openid:userinfoCfg._openid
      },
      dataToInsert:userinfoCfg
    }
  })
  if (userInfoRes.result.success) {
    return {
      success:true,
      message:'get data ok',
      data:userInfoRes.result.data
    }
  }

  return {
    success:false,
    message:'get data error',
    data:userInfoRes
  }
}