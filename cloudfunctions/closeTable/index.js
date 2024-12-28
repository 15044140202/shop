// 云函数入口文件
//获取随机字符串
function getRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
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
    orderFormDate,
    overOrderForm
  } = event; //账单数据  需要已经计算完成的订单
  const tasks = [];
  //发送播报信息
  // console.log('播报信息:' + shopFlag + `--${7570 + newOrderForm.tableNum}--7595---randomNum:` + randomNum)
  cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopFlag: shopFlag,
      announcerId: null,
      first: `7572`,
      tableNum: `${overOrderForm.tableNum}`,
      last: `7580`,
      randomNum: getRandomString(5) + new Date().getTime()
    }
  })
  
  //  修改订单 
  const res = db.collection('orderForm').where({
    shopFlag: shopFlag,
    [orderFormDate]: {
      orderNum: overOrderForm.orderNum
    }
  }).update({
    data: {
      [`${orderFormDate}.$`]: overOrderForm
    }
  })
  tasks.push(res)
  // 修改会员余额
  //首先判断是否为代付
  var payFor = false
  if (overOrderForm.log.length > 1) {
    for (let index = 0; index < overOrderForm.log.length; index++) {
      const element = overOrderForm.log[index];
      const log1Array = element.split("---")
      if (log1Array.length > 1) {
        if (log1Array[1] === '代结算') {
          payFor = true
        }
      }
    }
  }
  const cashCoupon = overOrderForm.cashCoupon ? overOrderForm.cashCoupon : 0;
  const payAmount = overOrderForm.tableCost - cashCoupon > 0 ? overOrderForm.tableCost - cashCoupon  : 0;
  if (overOrderForm.pledgeMode.includes('card')  && payFor === false && payAmount > 0) {
    const res = db.collection('vipList').where({
      shopFlag: shopFlag,
      vipList: {
        userOpenid: overOrderForm.openPerson.openPersonOpenid
      }
    }).update({
      data: {
        ['vipList.$.amount']: _.inc(-payAmount),
        'vipList.$.amountChange': _.push({
          'amount': `-${payAmount}`,
          'reason': '桌台费',
          'status': overOrderForm.openPerson.openPersonName,
          'time': overOrderForm.endTime
        }),
      }
    })
    tasks.push(res);
  }
  //修改vip 总消费金额
  if (payFor === false && overOrderForm.pledgeMode !== 'card') {
    const res = db.collection('vipList').where({
      shopFlag: shopFlag,
      vipList: {
        userOpenid: overOrderForm.openPerson.openPersonOpenid
      }
    }).update({
      data: {
        ['vipList.$.totalTableCost']: _.inc(overOrderForm.tableCost)
      }
    })
    tasks.push(res)
  }
  //vip修改积分
  if (overOrderForm.integral > 0) {
    const res = db.collection('vipList').where({
      shopFlag: shopFlag,
      vipList: {
        userOpenid: overOrderForm.openPerson.openPersonOpenid
      }
    }).update({
      data: {
        'vipList.$.integral': _.inc(overOrderForm.integral)
      }
    })
    tasks.push(res)
  }
  //修改桌台数据
   const res_1 = db.collection('shopAccount').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      [`shop.tableSum.${overOrderForm.tableNum - 1}.orderForm`]: '',
      [`shop.tableSum.${overOrderForm.tableNum - 1}.orderEndTime`]: ''
    }
  })
  tasks.push(res_1)
  //修改用户信息 数据
  const res_2 = db.collection('userInfo').where({
    _openid: overOrderForm.openPerson.openPersonOpenid,
  }).update({
    data: {
      ['userInfo.orderForm']: _.set({})
    }
  })
  tasks.push(res_2)
  await Promise.all(tasks)
  return 'ok'
}