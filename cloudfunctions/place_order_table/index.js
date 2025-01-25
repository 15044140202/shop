// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 数据验证函数
function validateInput(order, tableVersion) {
  if (!order || !order.shopId || !order.tableNum || !order.orderNum) {
    throw new Error('Invalid order data');
  }
  if (typeof tableVersion !== 'number') {
    throw new Error('Invalid tableVersion');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { order, tableVersion } = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // 输入数据验证********************
    validateInput(order, tableVersion);
    //修改桌台信息为**********************
    let tableUpData = {
      version: _.inc(1),
      orderForm: order.orderNum
    }
    if (!order.cashPledge) {//后结账模式
      tableUpData.ONOFF = 1
      tableUpData.closeTableTime = new Date(order.time + 1000 * 60 * 60 * 100).getTime()//100小时
    }else if (order.pledgeMode === '现金' || order.pledgeMode === 'cash'){//现金模式
      tableUpData.ONOFF = 1
      tableUpData.closeTableTime = new Date(order.time + order.cashPledge/order.price * 1000 * 60 * 60).getTime()
    }
    const tUpDateRes = await transaction.collection('shop_table').where({
      shopId: order.shopId,
      tableNum: order.tableNum,
    }).update({
      data: tableUpData,
      condition: _.eq('version', tableVersion)
    })
    if (tUpDateRes.stats.updated === 1) {
      await transaction.collection('table_order').add({
        data: order
      })
      await transaction.commit();
      return {
        success: true,
        message: `place table_order success`,
        data: { transactionId: transaction._id }
      }
    } else {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用`,
        data: { errorCode: -100, message: '桌台被占用或版本号不匹配' },
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