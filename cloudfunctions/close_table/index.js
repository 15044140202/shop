// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

function calculateTimeDifferenceInHours(timeStr1, timeStr2) {
  // 解析时间字符串为Date对象
  const date1 = new Date(timeStr1); 
  const date2 = new Date(timeStr2);

  // 检查日期是否有效
  if (isNaN(date1) || isNaN(date2)) {
    throw new Error('无效的时间格式');
  }

  // 计算两个日期的毫秒差
  const differenceInMs = Math.abs(date2 - date1);

  // 将毫秒差转换为小时
  const differenceInHours = differenceInMs / (1000 * 60 * 60);

  return differenceInHours;
}
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { overOrderForm, tableVersion, sub_mchid } = event
  const transaction = await db.startTransaction()
  try {
    //修改桌台信息
    const res = await transaction.collection('shop_table').where({
      shopId: overOrderForm.shopId,
      tableNum: overOrderForm.tableNum
    }).update({
      data: {
        ONOFF: _.set(0),
        orderForm: _.set(''),
        version: _.inc(1),
        closeTableTime:_.set(0)
      },
      condition: _.eq('version', tableVersion)
    })
    if (res.stats.updated !== 1) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用`,
        data: { errorCode: -100, message: '桌台被占用或版本号不匹配' },
      }
    }
    //添加退款订单
    if (overOrderForm.refundOrder) {
      await transaction.collection('refund_order').add({
        data: {
          orderNum: overOrderForm.refundOrder,
          originalOrderNum: overOrderForm.orderNum,
          originalTotalCost: overOrderForm.cashPledge,
          refundCost: overOrderForm.refundCost,
          sub_mchid: sub_mchid,
          appid: 'wxad610929898d4371',
          time: ''
        }
      })
    }
    //修改订单信息
    await transaction.collection('table_order').where({
      orderNum: overOrderForm.orderNum
    }).update({
      data: overOrderForm
    })
    //修改用户 积分 最后消费时间 总时长 余额扣款
    if (overOrderForm.orderName === '自助开台订单' || overOrderForm.orderName === '自助套餐订单') {
      const upData = {
        integral:_.inc(overOrderForm.integral),
        lastTime:overOrderForm.endTime,
        totalTime:_.inc(calculateTimeDifferenceInHours(overOrderForm.time,overOrderForm.endTime))
      }
      //需要卡口 余额
      if (overOrderForm.pledgeMode === 'card' || overOrderForm.pledgeMode === '会员卡') {
        upData.amount = _.icn(- overOrderForm.tableCost)
      }
      await transaction.collection('vip_list').where({
        shopId: overOrderForm.shopId,
        userOpenid: overOrderForm.userOpenid
      }).update({
        data:upData
      })
    }
    await transaction.commit();
    return {
      success: true,
      message: `close table success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('close table error:', err); // 记录错误日志
    return {
      success: false,
      message: `close table error`,
      data: err,
    }
  }
}