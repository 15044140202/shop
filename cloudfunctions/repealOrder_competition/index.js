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
function validateInput(orderNum) {
  if (!orderNum) {
    throw new Error('Invalid order data');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { orderNum , isRefound} = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // 输入数据验证********************
    validateInput(orderNum);
    //获取选手订单
    const orderRes = await db.collection('competition').where({
      orderNum: orderNum,
    }).get()
    const playerOrder = orderRes.data[0]
    if (playerOrder.payState !== 0 && !isRefound) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,订单状态 不是可撤销的状态`,
        data: playerOrder,
      }
    }
    //修改赛事人数信息**********************
    let cptUpData = {
      nowPlayerSum: _.inc(-1),
    }
    const cptUpDataRes = await transaction.collection('competition').doc(playerOrder.competitionId).update({
      data: cptUpData
    })
    //修改选手订单信息 为已取消状态**************************
    const pUpDataRes = await transaction.collection('competition').doc(playerOrder._id).update({
      data: {
        payState:2
      }
    })
    //提交事务
    await transaction.commit();
    return {
      pUpDataRes: pUpDataRes,
      cptUpDataRes:cptUpDataRes,
      success: true,
      message: `repeal playerOrder success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('repeal playerOrder error:', err); // 记录错误日志
    return {
      success: false,
      message: `repeal playerOrder error`,
      data: err,
    }
  }
}