// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag
  } = event;
  var power = [];
  while (power.length === 0) {
    const res = await db.collection('shopAccount').where({
      shopFlag: shopFlag
    }).get()
    if (!('device' in res.data[0].shop)) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection('shopAccount').where({
        shopFlag: shopFlag
      }).update({
        data: {
          shop: {
            device: {
              lightCtrl: '',
              camera: [],
              announcer: '',
              printer: '',
              doorLock: '',
              cupboard:[]
            }
          }
        }
      })

    } else {
      return res.data[0].shop.device;
    }
  }




}