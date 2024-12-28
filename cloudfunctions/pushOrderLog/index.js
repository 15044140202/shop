// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {shopFlag,orderNum,orderFormDate,log} = event;
   //  修改订单 
   await db.collection('orderForm').where({
    shopFlag: shopFlag,
    [orderFormDate]: {
      orderNum: orderNum
    }
  }).update({
    data:{
      [`${orderFormDate}.$.log`]: _.push(log)
    }
  })
  return 'ok'
}