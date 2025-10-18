// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
async function announcerSendMessage(overOrder) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: overOrder.shopId, //此参数可以为  null   announcerId 和 shopId  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopId  需有一个为非null
      first: '7575',//服务提示
      tableNum: overOrder?.tableNum || 0,
      last: '7587',//"新助教订单,请及时查看."
      randomNum: new Date().getTime() + overOrder.orderNum
    }
  })
  return
}

async function getAllInfo(event) {
  const returnData = {}
  //获取订单信息
  if (event?.order) {//没有订单信息
    returnData = event.order
  } else {//没有订单信息  加载订单信息
    const orderNum = event?.girlInfo?.orderNum || event?.orderNum
    if (!orderNum) {
      const error = {
        success: false,
        message: '参数错误,未提供订单信息或订单编号orderNum或order!',
        data: event
      }
      throw error
    }
    const orderRes = await db.collection('table_order').where({
      orderNum: event.orderNum
    }).get()
    if (orderRes.data.length < 1) {
      const error = {
        success: false,
        message: '获取订单信息错误!',
        data: orderRes
      }
      throw error
    }
    returnData.orderData = orderRes.data[0]
  }
  return returnData
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone_girl调用来源环境信息:', {
    event: event
  });
  const transaction = await db.startTransaction()
  const task = []
  try {
    const { orderData  } = await getAllInfo(event)
    if (orderData.payState === 1) {//订单已支付
      return {
        success: false,
        message: 'payment false, order payMent doned',
        orderNum: orderData.orderNum
      }
    }
    //修改助教信息  state = 2  orderPayState= 1 endTime=订单结束时间   
    const tableUpdataRes = await transaction.collection('shop_member').where({
      _id: orderData.girlId,
    }).update({
      data: {
        state: 2,
        orderPayState: 1,
        endTime:orderData.time + 60 * 60 * 1000 * orderData.duration//订单结束时间
      }
    })
    if (tableUpdataRes.stats.updated === 0) {
      await transaction.rollback()
      return {
        success: false,
        message: `助教信息保存失败`,
        data: tableUpdataRes,
        orderNum: orderData.orderNum
      }
    }
    //发送开台语音播报
    task.push(announcerSendMessage(orderData))
    //修改订单信息pledgeState = 1
    await transaction.collection('table_order').where({
      orderNum: orderData.orderNum
    }).update({
      data: {
        payState: 1
      }
    })
    await transaction.commit()
    await Promise.all(task)
    return {
      success: true,
      message: 'payment done success',
      orderNum: orderData.orderNum
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