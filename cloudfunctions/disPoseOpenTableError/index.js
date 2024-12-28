// 云函数入口文件
const cloud = require('wx-server-sdk')

function getNowTime(now_p) {
  var now = new Date();
  if (now_p) {
    now = now_p
  }
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString();
  const day = now.getDate().toString();
  const hour = now.getHours().toString();
  const minute = now.getMinutes().toString();
  const seconds = now.getSeconds().toString();
  return year + '/' + month.padStart(2, '0') + '/' + day.padStart(2, '0') + ' ' + hour.padStart(2, '0') + ':' + minute.padStart(2, '0') + ':' + seconds.padStart(2, '0')
}
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => { //此函数 用于争抢开台 后 出现重复付款 清除出错的那个用户的错误信息 
  const {
    userOpenid,
    userOrderNum,
    shopFlag,
    date
  } = event;
  //清除用户的开台信息
  const res = await db.collection('userInfo').where({
    _openid: userOpenid
  }).update({
    data: {
      ['userInfo.orderForm']: _.set({})
    }
  })

  const res1 = await db.collection('orderForm').where({
    shopFlag: shopFlag,
    [date]: {
      orderNum: userOrderNum
    }
  }).update({
    data: {
      [`${date}.$.endTime`]: getNowTime(),
      [`${date}.$.log`]: _.push('开台信息异常处理完成!')
    }
  })

  return 'ok'

}