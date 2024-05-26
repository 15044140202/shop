// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  //初始化集合
  const db = cloud.database()
  var data = []
  while (data.length < 1) {
    //获取shopFlag合集
    const res = await db.collection("merchantInfo").where({
      _openid: wxContext.OPENID
    }).get()
    data = res.data;
    if (data.length > 0) {
      //返回用户 shopFlag信息
      return data;
    } else { //此用户信息不存在 添加
      await db.collection('merchantInfo').add({
        data: {
          _openid: wxContext.OPENID,
          shopFlag: []
        }
      })
    }
  }

}