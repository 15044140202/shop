// 云函数入口文件
const cloud = require('wx-server-sdk')

function getPayMode(pledgeMode) {
  var payMode = '';
  if (pledgeMode.includes('wx')) {
    payMode === '' ? payMode = 'wx' : payMode = payMode + '&wx'
  }
  if (pledgeMode.includes('card')) {
    payMode === '' ? payMode = '会员卡' : payMode = payMode + '&会员卡'
  }
  if (pledgeMode.includes('mtCoupon')) {
    payMode === '' ? payMode = '美团券' : payMode = payMode + '&美团券'
  }
  if (pledgeMode.includes('dyCoupon')) {
    payMode === '' ? payMode = '抖音券' : payMode = payMode + '&抖音券'
  }
  if (pledgeMode.includes('cashCoupon')) {
    payMode === '' ? payMode = '代金券' : payMode = payMode + '&代金券'
  }
  if (payMode === '') {
    payMode = '现金'
  }
  return payMode;
}

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
//获取随机字符串
function getRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async () => {
  const promises = []; // 创建一个空数组来存储所有的异步操作  
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  let now = new Date();
  let yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let today = now;
  // 格式化日期为 YYYY-MM-DD
  let formatted_yesterday = `${yesterday.getFullYear()}年${String(yesterday.getMonth() + 1).padStart(2, '0')}月${String(yesterday.getDate()).padStart(2, '0')}日`;
  let formatted_today = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

  //处理昨天数据
  const yesterday_res = await db.collection('orderForm').field({
    [formatted_yesterday]: true,
    shopFlag: true
  }).get();
  if (yesterday_res.errMsg === "collection.get:ok" && yesterday_res.data.length > 0) { //调用成功!
    const yesterday_data = yesterday_res.data
    for (let index = 0; index < yesterday_data.length; index++) { //每个店铺的昨日数据
      const element = yesterday_data[index];
      //判断有无昨日数据模版
      if (Object.keys(element).length > 2) { //对象成员 大于2  说明有昨日数据模版{_ip,shopFlag,日期账单}
        const orderForm = element[formatted_yesterday];
        const shopFlag = element.shopFlag;
        for (let i = 0; i < orderForm.length; i++) {
          const e = orderForm[i];
          if (e.orderName === "自助开台订单" || e.orderName === "店员开台订单" || e.orderName === "自助套餐订单") {
            if (e.endTime === "未结账" && e.cashPledge > 0) { //只处理未结账订单 并且押金模式的订单
              //判断是否到时间
              const nowTime = new Date().getTime();
              var orderTime = undefined;
              if ('orderTotalTimeLong' in e) {
                orderTime = new Date(e.startTime).getTime() + 1000 * 60 * (e.orderTotalTimeLong)
              } else {
                orderTime = new Date(e.startTime).getTime() + 1000 * 60 * 60 * (e.cashPledge / e.price)
              }
              if (nowTime >= orderTime) { //到时间的单子
                var newOrderForm = e;
                newOrderForm.endTime = getNowTime(new Date(orderTime))
                newOrderForm.tableCost = parseInt(newOrderForm.cashPledge) + (newOrderForm.cashCoupon ? newOrderForm.cashCoupon : 0)
                newOrderForm.payMode = getPayMode(newOrderForm.pledgeMode)
                newOrderForm.log.push(`${getNowTime(new Date(orderTime))}${newOrderForm.openPerson.openPersonName}---自动结算`)
                //修改会员余额
                if (newOrderForm.pledgeMode.includes('card')) {
                  await db.collection('vipList').where({
                    shopFlag: shopFlag,
                    vipList: {
                      userOpenid: newOrderForm.openPerson.openPersonOpenid
                    }
                  }).update({
                    data: {
                      ['vipList.$.amount']: _.inc(-newOrderForm.cashPledge)
                    }
                  })
                }
                //vip修改积分
                if (newOrderForm.integral > 0) {
                  await db.collection('vipList').where({
                    shopFlag: shopFlag,
                    vipList: {
                      userOpenid: newOrderForm.openPerson.openPersonOpenid
                    }
                  }).update({
                    data: {
                      'vipList.$.integral': _.inc(newOrderForm.integral)
                    }
                  })
                }
                //修改订单数据
                await db.collection('orderForm').where({
                  shopFlag: shopFlag,
                  [formatted_yesterday]: {
                    orderNum: newOrderForm.orderNum,
                    endTime: '未结账'
                  }
                }).update({
                  data: {
                    [`${formatted_yesterday}.$`]: newOrderForm
                  }
                })
                //修改桌台数据
                await db.collection('shopAccount').where({
                  shopFlag: shopFlag,
                }).update({
                  data: {
                    [`shop.tableSum.${newOrderForm.tableNum - 1}.orderForm`]: '',
                    [`shop.tableSum.${newOrderForm.tableNum - 1}.orderEndTime`]: ''
                  }
                })
                //修改用户信息 数据
                await db.collection('userInfo').where({
                  _openid: newOrderForm.openPerson.openPersonOpenid,
                }).update({
                  data: {
                    ['userInfo.orderForm']: _.set({})
                  }
                })

                //发送播报信息
                promises.push(
                  cloud.callFunction({
                    name: 'announcerSendMessage',
                    data: {
                      shopFlag: shopFlag,
                      announcerId: null,
                      first: `7572`,
                      tableNum: `${newOrderForm.tableNum}`,
                      last: '7580',
                      randomNum: getRandomString(5) + new Date().getTime()
                    }
                  })
                )
              } else { //没到时间的

              }
            }
          }
        }
      }

    }
  }
  //处理今天数据
  const today_res = await db.collection('orderForm').field({
    [formatted_today]: true,
    shopFlag: true
  }).get();
  if (today_res.errMsg === "collection.get:ok" && today_res.data.length > 0) { //调用成功!
    const today_data = today_res.data
    for (let index = 0; index < today_data.length; index++) { //每个店铺的今日数据
      const element = today_data[index];
      //判断有无昨日数据模版
      if (Object.keys(element).length > 2) { //对象成员 大于2  说明有昨日数据模版 {_ip,shopFlag,日期账单}
        const orderForm = element[formatted_today];
        const shopFlag = element.shopFlag;
        for (let i = 0; i < orderForm.length; i++) {
          const e = orderForm[i];
          if (e.orderName === "自助开台订单" || e.orderName === "店员开台订单" || e.orderName === "自助套餐订单") {
            if (e.endTime === "未结账" && e.cashPledge > 0) { //只处理未结账订单 并且押金模式的订单
              //判断是否到时间
              const nowTime = new Date().getTime();
              var orderTime = undefined;
              if ('orderTotalTimeLong' in e) {
                orderTime = new Date(e.startTime).getTime() + 1000 * 60 * (e.orderTotalTimeLong)
              } else {
                orderTime = new Date(e.startTime).getTime() + 1000 * 60 * 60 * (e.cashPledge / e.price)
              }

              if (nowTime >= orderTime) { //到时间的单子
                var newOrderForm = e;
                newOrderForm.endTime = getNowTime(new Date(orderTime))
                newOrderForm.tableCost = parseInt(newOrderForm.cashPledge) + (newOrderForm.cashCoupon ? newOrderForm.cashCoupon : 0);
                newOrderForm.commotidyCost = parseInt(newOrderForm.commotidyCost)
                newOrderForm.log.push(`${getNowTime(new Date(orderTime))}${newOrderForm.openPerson.openPersonName}---自动结算`)
                newOrderForm.payMode = getPayMode(newOrderForm.pledgeMode)
                console.log('触发自动结账!')
                //修改会员余额
                if (newOrderForm.pledgeMode.includes('card')) {
                  await db.collection('vipList').where({
                    shopFlag: shopFlag,
                    vipList: {
                      userOpenid: newOrderForm.openPerson.openPersonOpenid
                    }
                  }).update({
                    data: {
                      ['vipList.$.amount']: _.inc(-newOrderForm.cashPledge)
                    }
                  })
                }
                //修改订单数据
                await db.collection('orderForm').where({
                  shopFlag: shopFlag,
                  [formatted_today]: {
                    orderNum: newOrderForm.orderNum,
                    endTime: '未结账'
                  }
                }).update({
                  data: {
                    [`${formatted_today}.$`]: newOrderForm
                  }
                })
                //vip修改积分
                if (newOrderForm.integral > 0) {
                  await db.collection('vipList').where({
                    shopFlag: shopFlag,
                    vipList: {
                      userOpenid: newOrderForm.openPerson.openPersonOpenid
                    }
                  }).update({
                    data: {
                      'vipList.$.integral': _.inc(newOrderForm.integral)
                    }
                  })
                }
                //修改桌台数据
                await db.collection('shopAccount').where({
                  shopFlag: shopFlag,
                }).update({
                  data: {
                    [`shop.tableSum.${newOrderForm.tableNum - 1}.orderForm`]: '',
                    [`shop.tableSum.${newOrderForm.tableNum - 1}.orderEndTime`]: ''
                  }
                })
                //修改用户信息 数据
                await db.collection('userInfo').where({
                  _openid: newOrderForm.openPerson.openPersonOpenid,
                }).update({
                  data: {
                    ['userInfo.orderForm']: _.set({})
                  }
                })
                //发送播报信息
                // console.log('播报信息:' + shopFlag + `--${7570 + newOrderForm.tableNum}--7595---randomNum:` + randomNum)
                promises.push(cloud.callFunction({
                  name: 'announcerSendMessage',
                  data: {
                    shopFlag: shopFlag,
                    announcerId: null,
                    first: `7572`,
                    tableNum: `${newOrderForm.tableNum}`,
                    last: '7580',
                    randomNum: getRandomString(5) + new Date().getTime()
                  }
                }))
              } else { //没到时间的

              }
            }
          }
        }
      } //没有 今日数据 模版
    }
  }
  await Promise.all(promises)

}