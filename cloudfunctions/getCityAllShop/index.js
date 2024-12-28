// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
const MAX_LIMIT = 100;
// 云函数入口函数
exports.main = async (event) => {
  const {
    cityName
  } = event;
  // 先取出集合记录总数
  const countResult = await db.collection('shopAccount').count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / 100)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('shopAccount').skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  const res = (await Promise.all(tasks)).reduce((acc, cur) => {
    return {
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg,
    }
  })
  const reCityShop = [];
  for (let index = 0; index < res.data.length; index++) {
    const element = res.data[index];
    if (element.shop.shopAdd.includes(cityName)) {
      reCityShop.push(element)
    }
  }
  return reCityShop;
}