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
    userOpenid,
    shopFlag,
    name,
    image,
    telephone,
  } = event;
  //首先获取这个店的 会员列表
  var vipList = [];
  while (vipList.length === 0) {
    const res = await db.collection('vipList').where({
      shopFlag: shopFlag
    }).get()
    console.log(res)
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection('vipList').add({
        data: {
          shopFlag: shopFlag,
          vipList: []
        }
      })
    } else {
      vipList = res.data;
      console.log(vipList)
    }
  }
  var list = vipList.vipList;
  var now = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai'
  });
  const newVipInfo = {
    telephone: telephone,
    userOpenid: userOpenid,
    amount: 0,
    integral: 0,
    coupon: [],
    amountChange: [],
    lastTime: now,
    startTime: now,
    name:name,
    image:image,
    vipLevel:0,
    totalTableCost:0,
    totalCommotidyCost:0,
    totalTime:0,
  }
  for (let i = 0; i < 20; i++) {
    const res = await db.collection('vipList').where({
      shopFlag: shopFlag
    }).get()
    var list = res.data[0].vipList;
    if (list.length > 0) {
      for (let index = 0; index < list.length; index++) {
        const element = list[index];
        if (element.userOpenid === userOpenid) {
          return element;
        } else if (index === list.length - 1) { //列表中没有此会员信息  添加会员信息
          await db.collection('vipList').where({
            shopFlag: shopFlag
          }).update({
            data: {
              ['vipList']: _.push(newVipInfo)
            }
          })
        }
      }
    } else { //此店铺一个会员信息都没有 添加一个
      await db.collection('vipList').where({
        shopFlag: shopFlag
      }).update({
        data: {
          ['vipList']: _.push(newVipInfo)
        }
      })
    }
  }
  return 'error'
}