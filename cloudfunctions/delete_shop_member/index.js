// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const {userOpenid,shopId} = event
  // 前置校验 
if (!userOpenid || !shopId) {
  return { success: false, message: '参数缺失' }
}
  const transaction = await db.startTransaction()
  //先获取店员 用户信息里面的shopId
  const res = await db.collection('merchant_info').where({
    _openid:userOpenid
  }).get()
  const merchant_info_shopId = res.data[0]?.shopId
  if(!merchant_info_shopId || merchant_info_shopId.length  === 0){
    return{
      success:false,
      message:'获取店员信息失败!',
      data:res
    }
  }
  //删除店员信息里面要删除的信息
  const new_merchant_info_shopId = merchant_info_shopId.filter(item=> item.shopId !== shopId)
  try{
    //更改用户的 merchant_info  的shopId信息
    await transaction.collection('merchant_info').where({
      _openid:userOpenid
    }).update({
      data:{
        shopId:new_merchant_info_shopId
      }
    })
    //删除 店铺员工信息
    await transaction.collection('shop_member').where({
      shopId:shopId,
      memberOpenid:userOpenid
    }).remove()
    //提交
    await transaction.commit()
    return{
      success:true,
      message:'member delete success',
      data:new_merchant_info_shopId
    }
  }catch(e){
    await transaction.rollback()
    return{
      success:false,
      message:'delete merchant shopId error',
      data:e
    }
  }
}