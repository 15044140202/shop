function getNowTime(time) {
  var now = undefined;
  if (time === undefined) {
    // 获取当前的北京时间
    now = new Date();
  } else {
    // 获取当前的北京时间
    now = new Date(time);
  }
  // 格式化时间为 "YYYY/MM/DD HH:mm:ss"
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const nowTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  return nowTime;
}
// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
// 云函数入口函数
exports.main = async (event) => {
  const {
    userOpenid,
    shopFlag,
    value,
    reason,
    status
  } = event;
  const db = cloud.database();
  const _ = db.command;
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const now = getNowTime()
  const res = await db.collection('vipList').where({
    shopFlag: shopFlag,
    vipList: {
      userOpenid: userOpenid
    }
  }).update({
    data: {
      [`vipList.$.amount`]: _.inc(parseInt(value)),
      [`vipList.$.amountChange`]: _.push({
        status: status,
        time: now,
        amount: value,
        reason: reason
      }),
    }
  })
  if (res.stats.updated === 1) {
    return {
      massage: 'ok',
      data: res
    }
  } else {
    return {
      massage: 'error',
      data: res
    }
  }
}