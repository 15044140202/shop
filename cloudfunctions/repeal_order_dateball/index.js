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
async function getOrder(event) {
  if (event.order) {
    return event.order
  } else if (!event.orderNum) {
    throw new Error('Invalid order and orderNum all is  Invalid');
  }
  const res = await db.collection('online_dateball').where({
    orderNum: event.orderNum
  }).get()
  if (res.data.length < 1) {
    const error = {
      success: false,
      message: '根据单号orderNum获取订单信息错误!',
      data: res
    }
    throw error
  }
  return res.data[0]
}
async function getObjNameOfPrimaryOrder(order) {
  const res = await db.collection('online_dateball').where({
    orderNum: order.dateOrderNum
  }).get()
  if (res.data.length > 0) {
    const primaryOrder = res.data[0]
    for (const key of Object.keys(primaryOrder)) {
      if (key.includes('joinPerson') && primaryOrder[key].personOpenid === order.userOpenid) {
        return key
      }
    }
  }
  throw 'error 获取主订单错误!'
}
async function markAbnormalOrder(order) {
  //标记异常订单
  await db.collection('online_dateball').where({
    orderNum: order.orderNum,
  }).update({
    data: {
      abnormalOrder: 1
    }
  })
}
// 云函数入口函数
exports.main = async (event, context) => {
  console.log('paymentDone调用来源环境信息:', {
    event: event
  });
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const transaction = await db.startTransaction()
  try {
    //获取订单
    const order = await getOrder(event)
    //先取消支付订单
    const closePayOrderRes = await cloud.callFunction({
      name: 'wx_pay',
      data: {
        item: 'closeOrder',
        parameter: {
          out_trade_no: order.orderNum,
          sub_mch_id: order.sub_mch_id
        }
      }
    })

    if (!closePayOrderRes.result?.success) {
      await markAbnormalOrder(order)
      throw {
        data: closePayOrderRes,
        message: 'error closePayOrder Error'
      }
    }
    if (closePayOrderRes.result.data?.err_code_des !== "ORDERCLOSED" && closePayOrderRes.result.data.result_code !== "SUCCESS") {//订单未关闭成功
      //标记异常订单
      await markAbnormalOrder(order)
      throw {
        success: false,
        message: '支付订单关闭失败!',
        data: closePayOrderRes
      }
    }
    //console.log('处理本人订单')
    //处理本人订单
    let upData = {}
    if (Object.keys(order).includes('launchPerson')) {//发起人订单
      upData.payState = 3
      upData.dateState = 'cancel'
    } else {
      upData.payState = 3
    }
    const updateResult1 = await transaction.collection('online_dateball').where({
      orderNum: order.orderNum,
    }).update({
      data: upData
    })
    //console.log('updateResult1:', updateResult1);
    //处理关联订单
    if (Object.keys(order).includes('launchPerson')) {//发起人订单
      //如果是发起人 则 不处理成员订单 成员的约球订单处或显示这个订单已取消 添加手动退款功能
    } else {//是成员
      //移除主约球订单的 的本人成员
      const objName = await getObjNameOfPrimaryOrder(order)
      //console.log('objName:' + objName)
      await transaction.collection('online_dateball').where({
        orderNum: order.dateOrderNum,
      }).update({
        data: {
          [objName]: _.remove()
        }
      })
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