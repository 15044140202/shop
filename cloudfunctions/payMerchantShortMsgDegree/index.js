// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {shopFlag,degree,orderNum,amount,payTime} = event;

  const r = await db.collection('operateSet').where({
    shopFlag:shopFlag
  }).update({
    data:{
      operateSet:{
        startSet:{
          degree:_.inc(degree)
        }
      }
    }
  })
  const res = await db.collection('shopAccount').where({
    shopFlag:shopFlag
  }).update({
    data:{
      order:_.push({orderNum:orderNum,date:payTime,amount:amount,degree:degree})
    }
  })
  if (res.stats.updated === 1) {
    return 'ok'
  }else{
    return 'error'
  }


}