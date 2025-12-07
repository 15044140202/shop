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
  hours = hours < 10 ? '0' + hours : hours;
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
async function getOverOrderAndPayForOrder(payForOrderNum) {
  const now = new Date()
  //获取代付订单
  const res = await db.collection('table_order').where({
    orderNum: payForOrderNum
  }).get()
  if (res.data.length === 0) {
    throw 'error 未找到对应代付订单'
  }
  const payForOrder = res.data[0]
  //获取关台订单
  const res1 = await db.collection('table_order').doc(payForOrder.payForOrderId).get()
  if (!res.data) {
    throw 'error 未找到对应代付的订单'
  }
  const overOrder = res1.data

  //整理overOrder
  overOrder.payFor = {
    userOpenid: payForOrder.operaterOpenid,
    userName: payForOrder.operaterName,
    payMode: 'wx',
    time: new Date().getTime()
  }
  overOrder.refundOrder = 'refund' + overOrder.orderNum
  overOrder.payforOrderNum = payForOrder.orderNum
  overOrder.payMode = 'wx'
  overOrder.tableCost = payForOrder.orderAmount / 100
  overOrder.log.push(`${getNowTime(now)}---代付结账.${payForOrder.operaterName}`)//添加日志信息
  overOrder.endTime = getNowTime(now)

  return { payForOrder, overOrder }
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('close_table调用来源环境信息:', {
    event: event
  });
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { payForOrderNum } = event
  const { overOrder, payForOrder } = await getOverOrderAndPayForOrder(payForOrderNum)
  if (payForOrder.payState !== 0) {//以调用过 代付完成的
    return{
      success: true,
      message: `payFor doned`,
    }
  }
  //调用关台函数
  const res = await cloud.callFunction({
    name: 'close_table',
    data: { 
      overOrderForm: overOrder,
      tableVersion: payForOrder.tableVersion,
      sub_mchid: payForOrder.sub_mchid,
      orderNum: undefined
    }
  })
  //上传payFor 订单支付状态
  const payForRes = await db.collection('table_order').doc(payForOrder._id).update({
    data:{
      payState:1
    }
  })
  console.log(payForRes)
  if (res.result.success) {
    return {
      success: true,
      message: `payFor close table done`,
      data: res,
      payForRes:payForRes
    }
  }else{
    return {
      success: false,
      message: `payFor close table error`,
      data: res,
    }
  }
}