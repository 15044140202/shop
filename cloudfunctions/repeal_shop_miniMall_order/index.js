// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
/** 
 * @param {string} p_date 
 * @param {string} item  获取时间的格式 hms  为hh:mm:ss  年月日为2024年05月05日格式  其他参数为yy/mm/dd hh:mm:ss
 */
function getNowTime(p_date, item) {
  // 获取当前时间
  var now = new Date();
  if (p_date !== undefined) {
    now = p_date;
  }
  // 分别获取年、月、日、时、分、秒，并转换为数字
  const year = now.getFullYear();
  var month = now.getMonth() + 1; // 月份从0开始，需要加1
  var date = now.getDate();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  // 如果需要，可以添加前导零以确保总是两位数
  month = month < 10 ? '0' + month : month;
  date = date < 10 ? '0' + date : date;
  hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  // 返回组合成只包含数字的字符串
  //console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
  if (item === 'hms') {
    return `${hours}:${minutes}:${seconds}`;
  } else if (item === '年月日') {
    return `${year}年${month}月${date}日`
  } else {
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  }
}
async function closePayOrder(sub_mchid, orderNum) {
  return await cloud.callFunction({
    name: 'wx_pay',
    data: {
      item: 'closeOrder',
      parameter: {
        out_trade_no: orderNum,
        sub_mch_id: sub_mchid
      }
    }
  })
}
async function refundPayOrder(sub_mechid,order){
  return await cloud.callFunction({
    name: 'wx_pay',
    data: {
      item: 'refund',
      parameter: {
        out_trade_no: order.orderNum,
        out_refund_no: 'refund' + order.orderNum,
        total_fee: order.commotidyCost * 100,
        refund_fee: order.commotidyCost * 100,
        sub_mch_id: sub_mechid
      }
    }
  })
}
function judgeCancelResult(result) {
  if (result.result.data.result_code === 'SUCCESS') {//取消成功
    return true
  } else {
    throw {
      success: false,
      ...result.data
    }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone调用来源环境信息:', {
    event: event
  });
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { order, cancelOrRefund = 'cancel' } = event //order 需要包含 order._id 需要包含 sub_mchid
  const transaction = await db.startTransaction()
  try {
    //取消支付订单
    console.log('开始取消支付订单')
    if (order?.sub_mchid && ['微信', 'wx'].includes(order?.payMode)) {
      if (cancelOrRefund === 'refund') {
        //退款
        const res = await refundPayOrder(order.sub_mchid, order)
        console.log(res)
        judgeCancelResult(res)
      } else {
        //取消订单
        const res = await closePayOrder(order.sub_mchid, order.orderNum)
        console.log(res)
        judgeCancelResult(res)
        //判断是否关闭成功
      }
    } else if (['现金', 'cash'].includes(order?.payMode)) {
      //现金直接 退货 需要判断现有订单数据是否是 已支付状态  1
      const res = await db.collection('table_order').doc(order._id).get()
      if (res.data && res.data.payState === 1) {
        
      }else{
        console.log(res)
        throw 'error --- 现金模式,订单不是已支付状态!'
      }
    } else {
      throw '参数错误,无子商户号.'
    }
    
    console.log('变更订单支付状态为 已取消')
    //变更订单状态
    const updateTableResult = await transaction.collection('table_order').doc(order._id).update({
      data: {
        payState: _.set(cancelOrRefund === 'cancel' ? 2 : 3),
      }
    })
    console.log('updateTableResult:', updateTableResult);
    console.log('修改数据库商品数量.')
    //还原店铺商品数量
    for (let goods of order.goodsList) {
      await transaction.collection('shop_commotidy').doc(goods.goodsId).update({
        data: {
          sum: _.inc(goods.sum),
        }
      })
    }
    await transaction.commit()
    return {
      success: true,
      message: '商品订单撤销成功'
    }
  } catch (e) {
    // 显式回滚事务
    if (transaction) {
      try {
        await transaction.rollback();
        console.log('撤销商品订单事务已回滚');
      } catch (rollbackError) {
        console.error('撤销商品订单回滚失败:', rollbackError);
      }
    }
    return {
      success: false,
      message: '商品订单撤销失败',
      data: e
    }
  }
}