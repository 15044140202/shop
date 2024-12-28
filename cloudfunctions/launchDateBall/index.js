// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event) => {
  const {cityName,dateBallOrder} = event;
  const res = db.collection('dateBall').update({
    data:{
      [cityName]:dateBallOrder
    }
  })
  if (result.stats.updated === 1) {
    await db.collection('payOrderList').where({
      orderList: {
        payOrderNum: dateBallOrder.launchPerson.personPayOrder
      }
    }).update({
      data: {
        [`orderList.$.payState`]: 'payEnd'
      }
    })
    return 'ok'
  }else{
    return 'error'
  }


}