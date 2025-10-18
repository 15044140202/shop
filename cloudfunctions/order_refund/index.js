// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
async function wxRefund(orderNum, refundOrderNum, orderAmount, refundAmount, sub_mchid) {
  const res = await cloud.callFunction({
    name: 'wx_pay',
    data: {
      item: 'refund',
      parameter: {
        out_trade_no: orderNum,
        out_refund_no: refundOrderNum,
        total_fee: orderAmount * 100,
        refund_fee: refundAmount * 100,
        sub_mch_id: sub_mchid
      }
    }
  })
  return res
}
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
// 云函数入口函数
exports.main = async (event, context) => {
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { orderNum, refundOrderNum, orderAmount, refundAmount, sub_mchid, userName } = event
  const transaction = await db.startTransaction()
  const nowTime = getNowTime()
  try {
    //退款
    const refRes = await wxRefund(orderNum, refundOrderNum, orderAmount, refundAmount, sub_mchid)
    if (refRes.errMsg !== 'callFunction:ok' || refRes.result.data.result_code !== 'SUCCESS') {
      return {
        success: false,
        message: `退款失败!`,
        data: refRes,
      }
    }
    //添加账单日志
    await transaction.collection('table_order').where({
      orderNum: orderNum
    }).update({
      data: {
        log: _.push(`${nowTime}---退款${refundAmount}元.${userName}`)
      }
    })
    //添加退款账单
    await transaction.collection('refund_order').add({
      data: {
        orderNum: refundOrderNum,
        originalOrderNum: orderNum,
        originalTotalCost: orderAmount,
        refundCost: refundAmount,
        sub_mchid: sub_mchid,
        time: nowTime,
        refundState: 0
      }
    })
    await transaction.commit();
    return {
      success: true,
      message: `refund  success`,
      data: refRes
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('close table error:', err); // 记录错误日志
    return {
      success: false,
      message: `refund order error`,
      data: err,
    }
  }

}