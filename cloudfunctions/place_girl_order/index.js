// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 数据验证函数
function validateInput(order, girlVersion) {
  if (!order || !girlVersion) {
    throw new Error('Invalid order data');
  }
  if (typeof girlVersion !== 'number') {
    throw new Error('Invalid girlVersion');
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { order, girlVersion } = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  const task = []
  try {
    // 输入数据验证********************
    validateInput(order, girlVersion);
    //验证版本号是否正确
    const versionRes = await transaction.collection('shop_member').where({
      _id: order.girlId,
    }).get()
    //版本号不对 或者 桌台订单不为空 证明助教忙或者 未在岗
    if (versionRes.data[0].version !== girlVersion || versionRes.data[0].state !== 1) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,助教未空闲/未在岗`,
        data: versionRes,
      }
    }
    //修改助教信息为**********************
    let girlUpData = {
      version: _.inc(1),
      state: 2,
      orderNum:order.orderNum,
      orderPayState:0,
      endTime:order.time + 2 * 60 * 1000
    }
    const tUpDateRes = await transaction.collection('shop_member').where({
      _id: order.girlId,
    }).update({
      data: girlUpData,
      condition: _.eq('version', girlVersion)
    })
    if (tUpDateRes.stats.updated === 1) {
      //添加订单信息
      await transaction.collection('table_order').add({
        data: order
      })
      //提交事务
      await transaction.commit();
      await Promise.all(task)
      return {
        success: true,
        message: `place girl_order success`,
        data: { transactionId: transaction._id }
      }
    } else {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,助教被占用或不在岗`,
        data: { errorCode: -100, message: '助教被占用或不在岗或版本号不匹配' },
      }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('place order error:', err); // 记录错误日志
    return {
      success: false,
      message: `place order error`,
      data: err,
    }
  }
}