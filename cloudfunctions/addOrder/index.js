// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}); // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event) => {
   const {
    shopFlag,
    date,
    data
  } = event;
  await cloud.callFunction({
    name:'autoClear',
    data:{}
  });
  //首先查询 是否有今日店铺模版
  await cloud.callFunction({
    name:'getOrderForm',
      data:{
        collection:"orderForm",
        record:"orderFrom",
        shopFlag:shopFlag,
        date:date,
      }
  })
 
  const result = await db.collection('orderForm').where({
    shopFlag: shopFlag,
    date:date
  }).update({
    data: {
      orderForm: _.push(data)
    }
  })
  if (result.stats.updated === 1) {
    console.log('添加成功!')
    //添加成功!
    return 'ok'
  } else {
    console.log('添加失败!')
    return 'error'
  }
}