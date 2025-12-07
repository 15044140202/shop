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
  console.log(p_date ?? '未传入date')
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
  console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
  if (item === 'hms') {
    return `${hours}:${minutes}:${seconds}`;
  } else if (item === '年月日') {
    return `${year}年${month}月${date}日`
  } else if (item === '年月日时分') {
    return `${year}年${month}月${date}日 ${hours}:${minutes}`
  } else {
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  }
}
// 数据验证函数
function validateInput(order, competitionVersion) {
  if (!order || !order.competitionId || !order.playerOpenid || !order.orderNum) {
    throw new Error('Invalid order data');
  }
  if (typeof competitionVersion !== 'number') {
    throw new Error('Invalid competitionVersion');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { order, competitionVersion } = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // 输入数据验证********************
    validateInput(order, competitionVersion);
    //验证版本号是否正确
    const versionRes = await db.collection('competition').where({
      _id: order.competitionId,
    }).get()
    const competition = versionRes.data[0]
    //版本号不对 或者 桌台订单不为空 证明桌台被占用
    if ((competition?.version ?? 0) !== competitionVersion) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,赛事版本号不正确,数据已刷新`,
        data: versionRes,
      }
    }
    //赛事信息**********************
    let cptUpData = {
      version: _.inc(1),
      nowPlayerSum: _.inc(1),
    }
    const cptUpDataRes = await transaction.collection('competition').doc(order.competitionId).update({
      data: cptUpData
    })
    //添加选手订单信息**************************
    const addOrderRes = await transaction.collection('competition').add({
      data: order
    })
    //提交事务
    await transaction.commit();
    return {
      addOrderRes: addOrderRes,
      success: true,
      message: `place CPTorder success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('place CPTorder error:', err); // 记录错误日志
    return {
      success: false,
      message: `place CPTorder error`,
      data: err,
    }
  }
}