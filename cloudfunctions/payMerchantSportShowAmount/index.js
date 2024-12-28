// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {shopFlag,orderNum,amount,payTime} = event;
  var res = undefined;
  //修改桌台剩余使用时间
  const shopInfo = await db.collection('shopAccount').where({
    shopFlag:shopFlag
  }).get()
  if ('sportShowAmount' in shopInfo) {
    if (typeof shopInfo.sportShowAmount === "number") {//该对象为  数字类型
      res = await db.collection('shopAccount').where({
        shopFlag:shopFlag
      }).update({
        data:{
          sportShowAmount:_.inc(amount) ,
          order:_.push({orderNum:orderNum,date:payTime,amount:amount})
        }
      })
    }else{//该对象为非数字类型
      res = await db.collection('shopAccount').where({
        shopFlag:shopFlag
      }).update({
        data:{
          sportShowAmount:_.set(amount) ,
          order:_.push({orderNum:orderNum,date:payTime,amount:amount})
        }
      })
    }
  }else{//没有该对象
    res = await db.collection('shopAccount').where({
      shopFlag:shopFlag
    }).update({
      data:{
        sportShowAmount:amount ,
        order:_.push({orderNum:orderNum,date:payTime,amount:amount})
      }
    })
  }
  if (res.stats.updated === 1) {
    return 'ok'
  }else{
    return 'error'
  }
}