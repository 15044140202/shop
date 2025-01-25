// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const { orderNum, shopId, tableNum, tableVersion } = event
  const res = await db.collection('table_order').where({
    orderNum: orderNum
  }).get()
  if (res.data.length < 1) {
    return {
      success: false,
      message: 'get order info failed',
      data: res
    }
  }
  const orderData = res.data[0]
  const transaction = await db.startTransaction()
  try {
    //修改桌台信息  结束时间  ONOFF状态 
    const tableUpdataRes = await transaction.collection('shop_table').where({
      shopId: shopId,
      tableNum: tableNum
    }).update({
      data: {
        ONOFF: 1,
        closeTableTime: new Date(orderData.time + orderData.cashPledge / orderData.price * 1000 * 60 * 60).getTime()
      },
      condition: _.eq('version', tableVersion)
    })
    //修改订单信息pledgeState = 1
    const orderUpDataRes = await transaction.collection('table_order').where({
      orderNum: orderNum
    }).update({
      data: {
        pledgeState: 1
      }
    })
    await transaction.commit()
    return {
      success: true,
      message: 'payment done success'
    }
  } catch (e) {
    await transaction.rollback()
    return {
      success: false,
      message: 'transaction error',
      data: e
    }
  }


}