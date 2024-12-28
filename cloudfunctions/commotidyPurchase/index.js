// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag,
    addCommotidy,
    list,
    date,
    orderData
  } = event;
  //修改商品库存数量
  for (let index = 0; index < addCommotidy.length; index++) {
    const element = addCommotidy[index];
    const res = await db.collection('commotidy').where({
      shopFlag: shopFlag
    }).update({
      data: {
        [`commotidy.${element.class.toString()}.commotidy.${element.index.toString()}.sum`]: _.inc(parseInt(element.sum))
      }
    })
    if (res.stats.updated !== 1) { //更新成功
      return 'error';
    }
  }
  //添加入库记录
  const listRes = await db.collection('commotidy').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      ['list']: _.push(list)
    }
  })
  //添加入库订单
  const addOrderRes = await db.collection('orderForm').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      [date]: _.push(orderData)
    }
  })
  return 'ok'
}