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
 * @description 获取加入成员的 对象名称
 * @param {object} order 
 * @param {object} correlationOrder 
 * @returns {string} //加入成员的对象名称
 */
function getJoinPersonObj(order, correlationOrder) {
  for (const [key, value] of Object.entries(correlationOrder)) {
    if (value?.personOpenid === order.userOpenid) {//这个人
      return key
    }
  }
  //没有找到对象
  const error = {
    success: false,
    message: '没有找到加入人的对应OBJ名!',
    data: '没有找到加入人的对应OBJ名'
  }
  throw error
}
/**
 * @description 获取支付约球 的账单Id  与支付人信息 launchPerson{payOrderNum} or joinPerson[{payOrderNum}]
 * @param {string} payOrderNum 
 */
async function getPayInfo(event) {
  if (!event?.order && !event?.orderNum) {
    const error = {
      success: false,
      message: '获取订单信息错误!',
      data: orderRes
    }
    throw error
  }
  const returnData = {}
  if (event?.order) {//有订单信息  是客户端发起的
    returnData.order = event.order
  } else {//没有订单信息  根据提供的订单号码 获取订单 
    //获取订单信息
    const res = await db.collection('online_dateball').where({
      orderNum: event.orderNum
    }).get()
    if (res.data.length < 1) {
      const error = {
        success: false,
        message: '获取订单信息错误!',
        data: res
      }
      throw error
    }
    returnData.order = res.data[0]
  }

  if (returnData.order?.launchPerson) {//发起订单
    return returnData
  } else {//加入订单  获取相关联的发起单
    const res = await db.collection('online_dateball').where({
      orderNum: returnData.order.dateOrderNum
    }).get()
    if (res.data.length < 1) {
      const error = {
        success: false,
        message: '获取订单信息错误!',
        data: res
      }
      throw error
    }
    returnData.correlationOrder = res.data[0]
  }
  return returnData
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone调用来源环境信息:', {
    event: event
  });
  const transaction = await db.startTransaction()
  try {
    const { order, correlationOrder } = await getPayInfo(event)//获取订单 和相关订单
    console.log({order, correlationOrder})
    //判断是否是 发起订单
    if (order?.launchPerson) {//发起订单
      //标记 发起订单支付成功
      await transaction.collection('online_dateball').where({
        orderNum: order.orderNum
      }).update({
        data: {
          payState: 1
        },
      })
    } else {//加入人订单
      //标记 加入订单支付成功
      await transaction.collection('online_dateball').where({
        orderNum: order.orderNum
      }).update({
        data: {
          payState: 1
        },
      })
      
      //标记 发起人加入成员 支付成功
      const joinPersonObjName = getJoinPersonObj(order, correlationOrder)
      await transaction.collection('online_dateball').where({
        orderNum: correlationOrder.orderNum
      }).update({
        data: {
          [`${joinPersonObjName}.payState`]: 1
        },
      })
    }
    await transaction.commit()
    return {
      success: true,
      message: 'dateball payment done success',
      orderNum: order.orderNum
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