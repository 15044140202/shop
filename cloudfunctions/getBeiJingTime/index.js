// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async () => {
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';

  // 获取当前的北京时间
  const now = new Date();

  // 格式化时间为 "YYYY/MM/DD-HH:mm:ss"
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const beijingTime = `${year}/${month}/${day}-${hours}:${minutes}:${seconds}`;

  return beijingTime;
}