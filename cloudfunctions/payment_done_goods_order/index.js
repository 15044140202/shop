// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
async function announcerSendMessage(order) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: order.shopId, //此参数可以为  null   announcerId 和 shopId  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopId  需有一个为非null
      first: '7573',//配送提示
      tableNum: order?.tableNum || 0,
      last: '7584',//"号台购买商品,请及时配送."
      randomNum: new Date().getTime() + order.orderNum
    }
  })
  return
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone_goods_order调用来源环境信息:', {
    event: event
  });
  const transaction = await db.startTransaction()
  const task = []
  try {
    let { orderNum, order } = event
    if (!order) {
      const res = await db.collection('table_order').where({
        orderNum: orderNum
      }).get()
      if (res.data.length === 0) {
        throw 'error --- getOrder ERROR'
      }
      order = res.data[0]
    }

    //发送开台语音播报
    task.push(announcerSendMessage(order))
    //修改订单信息pledgeState = 1
    await transaction.collection('table_order').doc(order._id).update({
      data: {
        payState: 1
      }
    })
    await transaction.commit()
    await Promise.all(task)
    return {
      success: true,
      message: 'payment done success',
      orderNum: orderNum
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