// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const { orderNum, tableNum, shopId, tableVersion, pledgeState, endTime } = event
  const transaction = await db.startTransaction()
  try {
    //先撤桌台订单状态
    const updateTableResult = await transaction.collection('shop_table').where({
      shopId: shopId,
      tableNum: tableNum
    }).update({
      data: {
        ONOFF:_.set(0),
        orderForm: _.set(''),
        version: _.inc(1)
      },
      condition: _.eq('version', tableVersion)
    })
    console.log('updateTableResult:', updateTableResult);
    //标记订单为撤销单
    const updateOrderResult = await transaction.collection('table_order').where({
      orderNum: orderNum
    }).update({
      data: {
        pledgeState: pledgeState,//1.已支付 2.未支付 3.客户端撤销 4.服务器撤销
        endTime: endTime,
        payMode:'wx'
      }
    })
    console.log('updateOrderResult:', updateOrderResult);
    await transaction.commit()
    return {
      success: true,
      message: '订单撤销成功'
    }
  } catch (e) {
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
      message: '订单撤销失败',
      data: e
    }
  }
}