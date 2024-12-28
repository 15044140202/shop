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

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {shopFlag,orderNum,date,waiterName} = event;
   // 设置时区为亚洲/上海
   process.env.TZ = 'Asia/Shanghai';
   // 获取当前的北京时间
   const now = new Date();
   const nowTime = getNowTime(now)

  const res = await db.collection('orderForm').where({
    shopFlag:shopFlag,
    [date]:{
      orderNum:orderNum
    }
  }).update({
    data:{
      [`${date}.$.sweep`]:waiterName,
      [`${date}.$.sweepTime`]:nowTime,
    }
  })
  if (res.stats.updated === 1) {
    return 'ok';
  }else{
    return 'error'
  }
}