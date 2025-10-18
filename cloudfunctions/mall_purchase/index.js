const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function buildColorUpdate(commotidyList) {
  const colorUpdates = {}
  commotidyList.forEach(element => {
    if (!element.colorOBJ) return
    
    // 初始化颜色对象（如果不存在）
    if (!colorUpdates[element.colorOBJ]) {
      colorUpdates[element.colorOBJ] = { sum: _.inc(0) }
    }
    
    // 累加数量
    colorUpdates[element.colorOBJ].sum = _.inc(element.sum || 0)
  })
  return colorUpdates
}

exports.main = async (event, context) => {
  const { order } = event
  if (!order || !order.commotydi) {
    return { success: false, error: 'Invalid order data' }
  }

  const transaction = await db.startTransaction()
  try {
    // 1. 更新商品库存
    const colorUpdates = buildColorUpdate(order.commotydi)
    await transaction.collection('shop_mall')
      .doc(order.commotydi_id)  // 更推荐使用doc()而非where()
      .update({
        data: {
          color: colorUpdates
        }
      })

    // 2. 添加订单记录
    await transaction.collection('shop_mall_order').add({
      data: order
    })

    await transaction.commit()
    return { success: true }
  } catch (e) {
    console.error('Transaction failed:', e)
    await transaction.rollback()  // 重要！失败时回滚
    return {
      success: false,
      error: e.message,
      code: e.errCode || -1
    }
  }
}