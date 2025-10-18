// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
async function announcerSendMessage(overOrder) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: overOrder.shopId, //此参数可以为  null   announcerId 和 shopFlag  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopFlag  需有一个为非null
      first: '7571',
      tableNum: overOrder.tableNum,
      last: '7581',
      randomNum: new Date().getTime() + overOrder.orderNum
    }
  })
  return
}
/**
 * @description 根据订单详情 分析订单结束时间
 * @param {object} orderInfo 
 * @returns {number} 订单结束的时间stamp 
 */
function getCloseTbaleTime(orderInfo) {
  const oneHour = 60 * 60 * 1000
  //套餐开台
  if (orderInfo.orderName === '自助套餐订单') {
    //套餐总时长的 单位是分钟
    return orderInfo.time + Math.round(orderInfo.setmealTimeLong * 60 * 1000)
  }
  //使用代金券
  if (orderInfo.couponAmount) {
    const totalPledge = Math.round(orderInfo.cashPledge) + Math.round(orderInfo.couponAmount)
    return new Date(orderInfo.time + Math.round(totalPledge / orderInfo.price * oneHour)).getTime()
  }
  //不使用代金券
  return new Date(orderInfo.time + Math.round(orderInfo.cashPledge) / orderInfo.price * oneHour).getTime()
}
async function getAllInfo(event) {
  const returnData = {}
  //获取订单信息
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
  //获取桌台信息
  if (event.table_id) {
    returnData.table_id = event.table_id
  } else {
    const tableRes = await db.collection('shop_table').where({
      shopId: returnData.orderData.shopId,
      tableNum: returnData.orderData.tableNum
    }).get()
    if (tableRes.data[0].length < 1) {
      const error = {
        success: false,
        message: '获取桌台信息错误!',
        data: tableRes
      }
      throw error
    }
    returnData.table_id = tableRes.data[0]._id
  }
  return returnData
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone调用来源环境信息:', {
    event:event
  });
  const transaction = await db.startTransaction()
  const task = []
  const { orderData, table_id } = await getAllInfo(event)
  try {
    if (orderData.pledgeState === 3 || orderData.pledgeState === 4) {//1.已支付 2.未支付 3.客户端撤销 4.服务器撤销
      return {
        success: false,
        message: 'payment false, order repealed',
        orderNum:orderData.orderNum
      }
    }else if (orderData.pledgeState === 1){
      return {
        success: false,
        message: 'payment false, order payMent doned',
        orderNum:orderData.orderNum
      }
    }

    //修改桌台信息  结束时间  ONOFF状态 
    const tableUpdataRes = await transaction.collection('shop_table').doc(table_id).update({
      data: {
        ONOFF: 1,
        closeTableTime: getCloseTbaleTime(orderData)
      },
    })
    if (tableUpdataRes.stats.updated === 0) {
      await transaction.rollback()
      return {
        success: false,
        message: `修改桌台信息失败!`,
        data: tableUpdataRes,
        orderNum:orderData.orderNum
      }
    }
    //发送开台语音播报
    task.push(announcerSendMessage(orderData))
    //修改订单信息pledgeState = 1
    const orderUpDataRes = await transaction.collection('table_order').doc(orderData._id).update({
      data: {
        pledgeState: 1
      }
    })
    await transaction.commit()
    await Promise.all(task)
    return {
      success: true,
      message: 'payment done success',
      orderNum:orderData.orderNum
    }
  } catch (e) {
    await transaction.rollback()
    return {
      success: false,
      message: 'transaction error',
      data: e,
      orderNum:orderData.orderNum
    }
  }


}