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
async function getOrderId(orderNum) {
  if (!orderNum) {
    throw 'error 指定参数错误,至少给定 orderNum 或者 orderId'
  }
  const res = await db.collection('table_order').where({
    orderNum: orderNum
  }).get()
  if (res.data.length > 0) {
    return res.data[0]._id
  } else {
    throw 'error 获取账单Id 错误!'
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone调用来源环境信息:', {
    event: event
  });
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { orderNum, orderId, tableNum, tableId, shopId, tableVersion, pledgeState, endTime, sub_mchid } = event
  let isDoc = false
  if (tableId || orderId) {
    isDoc = true
  }
  //获取订单 ID
  let ORDERID = orderId
  if (!ORDERID && isDoc) {
    ORDERID = await getOrderId(orderNum)
  }
  const transaction = await db.startTransaction()
  try {
    //取消支付订单
    if (sub_mchid) {
      const res = await closePayOrder(sub_mchid, orderNum)
      console.log(res)
      judgeCancelResult(res)
      //判断是否关闭成功
    } else {
      throw '参数错误,无子商户号.'
    }
    //先撤桌台订单状态
    if (isDoc) {
      const updateTableResult = await transaction.collection('shop_table').doc(tableId).update({
        data: {
          ONOFF: _.set(0),
          orderForm: _.set(''),
          version: _.inc(1),
          closeTableTime: _.set(0)
        }
      })
      console.log('updateTableResult:', updateTableResult);
    } else {
      const updateTableResult = await transaction.collection('shop_table').where({
        shopId,
        tableNum
      }).update({
        data: {
          ONOFF: _.set(0),
          orderForm: _.set(''),
          version: _.inc(1),
          closeTableTime: _.set(0)
        }
      })
      console.log('updateTableResult:', updateTableResult);
    }

    //标记订单为撤销单
    if (isDoc) {
      const updateOrderResult = await transaction.collection('table_order').doc(ORDERID).update({
        data: {
          log: _.push(`${getNowTime()}---取消订单.${pledgeState === 3 ? '客户取消' : '服务器取消'}`),
          pledgeState: pledgeState,//1.已支付 2.未支付 3.客户端撤销 4.服务器撤销
          endTime: endTime,
          payMode: 'wx'
        }
      })
      console.log('updateOrderResult:', updateOrderResult);
    }else{
      const updateOrderResult = await transaction.collection('table_order').where({
        orderNum
      }).update({
        data: {
          log: _.push(`${getNowTime()}---取消订单.${pledgeState === 3 ? '客户取消' : '服务器取消'}`),
          pledgeState: pledgeState,//1.已支付 2.未支付 3.客户端撤销 4.服务器撤销
          endTime: endTime,
          payMode: 'wx'
        }
      })
      console.log('updateOrderResult:', updateOrderResult);
    }

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