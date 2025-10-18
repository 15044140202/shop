const cloud = require('wx-server-sdk')
function validateInput(event) {
  if (!event.orderNum) {
    const error = 'Invalid input: orderNum 无效'
    throw error
  }
}
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { orderNum } = event
  const transaction = await db.startTransaction()
  try {
    validateInput(event)
    //获取订单详情
    const res = await db.collection('table_order').where({
      orderNum: orderNum
    }).get()
    if (res.data.length === 0) {
      return {
        success: false,
        message: '未查询到该笔订单!',
        data: res
      }
    }
    const orderInfo = res.data[0]
    // 修改订单为已支付
    const updateResult = await transaction.collection('table_order').where({
      orderNum: orderInfo.orderNum
    }).update({
      data: {
        payMode: 'wx'
      },
      condition: _.eq('payMode', '未支付')
    })
    if (updateResult.stats.updated === 0) {
      throw { Error: '订单状态不是未支付，无法更新',...orderInfo}
    }
    //生成会员账户余额变更记录数据
    const vipAmountChangeOrder = {
      shopId: orderInfo.shopId,
      userOpenid: orderInfo.userOpenid,
      changeName: '用户储值',
      changeAmount: parseInt(orderInfo.amount + orderInfo.giveAmount),
      oldAmount: orderInfo.oldAmount,
      reason: `用户在线充值,充值:${orderInfo.amount}元,赠送:${orderInfo.giveAmount}元`,
      status: orderInfo.userName,
      time: orderInfo.time
    }
    //增加会员账户余额变更数据
    await transaction.collection('vip_amount_change').add({
      data: vipAmountChangeOrder
    })
    //修改会员账户余额 首先判断是否时首充, 首充修改会员数据首充以完成,并且修改充值积分
    const upData = {
      amount: _.inc(vipAmountChangeOrder.changeAmount),
      integral: _.inc(orderInfo.integral)
    }
    if (orderInfo.firstStorage) {
      upData.firstStorage = false
    }
    await transaction.collection('vip_list').where({
      shopId: orderInfo.shopId,
      userOpenid: orderInfo.userOpenid
    }).update({
      data: upData
    })
    await transaction.commit()
    return {
      success: true,
      message: '用户储值事务提交成功!',
    }
  } catch (e) {
    console.error('Transaction Error:', e)
    // 显式回滚事务
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('事务已回滚');
      } catch (rollbackError) {
        console.error('回滚失败:', rollbackError);
      }
    }
    return {
      success: false,
      message: '用户储值事务提交失败!',
      data: e
    }
  }
}