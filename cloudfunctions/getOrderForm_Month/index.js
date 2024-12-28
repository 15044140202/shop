// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag,
    month
  } = event //month 格式为:'2024-08'
  const res = await db.collection('orderForm').where({
    shopFlag: shopFlag
  }).field(month).get()
  if (res.data.length > 0) {
    const orderArray = [];
    const data = res.data[0];
    for (let key in data) {
      if (key !== '_id') {
        for (let index = 0; index < data[key].length; index++) {
          const element = data[key][index];
          orderArray.push(element)
        }
      }
    }
    return orderArray;
  } else {
    return [];
  }
}