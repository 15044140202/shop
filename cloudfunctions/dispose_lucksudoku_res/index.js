// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
/**
 * @description 获取三天前的时间字符串
 * @param {string} time  时间字符串  2024/02/05 22:22:22格式的
 * @returns {string} 时间字符串  2024/02/05 22:22:22格式的
 */
function getThreeLaterTime(time) {
  const now = new Date(time)
  now.setDate(now.getDate() + 3)
  // 获取年、月、日、小时、分钟和秒
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份是从0开始的，所以需要+1，并且补零
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 拼接成指定格式的时间字符串
  const threeAgoTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

  return threeAgoTime;
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { userOpenid, userName, shopId, prizeName, prizeIndex, amount, time } = event
  const vip_info_upData = {}
  const task = []
  if (prizeName === '代金券') {
    //增加用户代金券
    vip_info_upData.coupon = _.push({
      amount: amount,
      cancellation: getThreeLaterTime(time) 
    })
  }
  if (prizeName === '会员卡') {
    //生成会员账户余额变更记录数据
    const vipAmountChangeOrder = {
      shopId: shopId,
      userOpenid: userOpenid,
      changeName: '抽奖赠送',
      changeAmount: amount,
      reason: `用户在线抽奖,赠送:${amount}元`,
      status: '用户本人',
      time: new Date(time).getTime()
    }
    //增加会员账户余额变更数据
    task.push(
      db.collection('vip_amount_change').add({
        data: vipAmountChangeOrder
      })
    )
    //增加用户会员卡
    vip_info_upData.amount = _.inc(amount)
  }
  //修改vipx数据
  if (Object.keys(vip_info_upData).length > 0) {
    task.push(
      db.collection('vip_list').where({
        shopId: shopId,
        userOpenid: userOpenid
      }).update({
        data: vip_info_upData
      })
    )
  }
  //添加用户中奖记录
  const winnerData = {
    _openid: userOpenid,
    userName: userName,
    shopId: shopId,
    prizeName: prizeName,
    time: time
  }
  if (amount) winnerData.amount = amount
  if (prizeName === '代金券' || prizeName === '会员卡') {
    winnerData.cashing = true
  } else if (prizeName !== '谢谢') {
    winnerData.cashing = false
  }
  task.push(
    db.collection('winner_list').add({
      data: winnerData
    })
  )
  //扣除店铺对应奖项额度
  task.push(
    db.collection('shop_lucksudoku_set').where({
      shopId: shopId
    }).update({
      data: {
        [`prize.${prizeIndex}.totalSum`]: _.inc(-1)
      }
    })
  )
  return await Promise.all(task)
}