// 云函数入口文件
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

function getNowTime(time) {
  var now = undefined;
  if (time === undefined) {
    // 获取当前的北京时间
    now = new Date();
  } else {
    // 获取当前的北京时间
    now = new Date(time);
  }
  // 格式化时间为 "YYYY/MM/DD HH:mm:ss"
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const nowTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  return nowTime;
}
// 云函数入口函数
exports.main = async (event) => {
  const {
    pledge,
    pledgeMode, // wx   cash mtCoupon dyCoupon cashCoupon 
    cashCoupon,
    openPersonName, //开台人 名字
    openPersonOpenid, //开台人 openid
    openPersonPhone, //开台人 电话
    orderNum,
    orderName, //自助开台  店员开台
    orderTotalTimeLong, //套餐订单 总时长 分钟
    price, //单价
    integral,
    shopFlag,
    tableNum, //桌台号码
    userOpenid,
  } = event;
  //获取现在 北京时间*******************
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  // 获取当前的北京时间
  const now = new Date();
  const nowTime = getNowTime(now)
  var order = {
    orderTotalTimeLong: orderTotalTimeLong,
    cashPledge: pledge, //押金  
    cashCoupon: cashCoupon,
    pledgeMode: pledgeMode,
    commotidyCost: 0,
    joinCost: 0,
    endTime: '未结账',
    integral: integral,
    log: [`${nowTime}---开台.${getPayMode(pledgeMode)} ${pledge}元${cashCoupon ? '代金券'+cashCoupon+'元' : ''}`],
    openPerson: {
      openPersonName: openPersonName,
      openPersonOpenid: openPersonOpenid,
      openPersonPhone: openPersonPhone
    },
    orderName: orderName,
    orderNum: orderNum,
    payMode: '未结账', //此数据  结账时添加   
    price: price,
    startTime: nowTime,
    tableCost: 0, //结账时  根据结算时间 计算台费
    tableNum: tableNum
  }
  if (orderTotalTimeLong !== undefined) { //套餐订单 添加套餐总时长
    order = {
      ...order,
      orderTotalTimeLong: orderTotalTimeLong
    }
  }
  //添加订单 *******************
  const date = nowTime.split(' ')[0].split('/')[0] + '年' + nowTime.split(' ')[0].split('/')[1] + '月' + nowTime.split(' ')[0].split('/')[2] + '日';
  const result = await db.collection('orderForm').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      [date]: _.push({
        ...order
      })
    }
  })
  //判断押金 是否为0
  var orderEndTime = '-1'
  if (pledge > 0) { //非押金模式
    //结算 预计 结束时间
    if (orderTotalTimeLong !== undefined) { //套餐
      orderEndTime = getNowTime(new Date(nowTime).getTime() + parseInt(orderTotalTimeLong) * 60 * 1000);
    } else {
      orderEndTime = getNowTime(new Date(nowTime).getTime() + pledge / price * 60 * 60 * 1000);
    }
  } else { //非计时模式 默认开台 12小时
    //结算 预计 结束时间
    orderEndTime = getNowTime(new Date(nowTime).getTime() + 12 * 60 * 60 * 1000);
  }
  if (result.stats.updated === 1) {
    const tasks = [];
    //发送播报信息
    // console.log('播报信息:' + shopFlag + `--${7570 + newOrderForm.tableNum}--7595---randomNum:` + randomNum)
    const res_4 = cloud.callFunction({
      name: 'announcerSendMessage',
      data: {
        shopFlag: shopFlag,
        announcerId: null,
        first: `7571`,
        tableNum: `${tableNum}`,
        last: `7581`,
        randomNum: getRandomString(5) + new Date().getTime()
      }
    })
    // tasks.push(res_4)

    if (pledgeMode.includes('wx') && userOpenid !== '店员') {
      //修改支付检测订单  为payEnd
      const res_1_1 = db.collection('payOrderList').where({
        orderList: {
          payOrderNum: orderNum,
        }
      }).update({
        data: {
          [`orderList.$.payState`]: 'payEnd'
        }
      })
      tasks.push(res_1_1)
    }

    //修改 店铺桌台状态
    const res_1 = db.collection('shopAccount').where({
      shopFlag: shopFlag
    }).update({
      data: {
        [`shop.tableSum.${tableNum - 1}.orderForm`]: orderNum,
        [`shop.tableSum.${tableNum - 1}.orderEndTime`]: orderEndTime
      }
    })
    tasks.push(res_1)
    //修改 用户信息里面的订单
    if (userOpenid !== '店员') { //用户openid === '店员' 为店员开台
      const res_2 = db.collection('userInfo').where({
        _openid: userOpenid
      }).update({
        data: {
          ['userInfo.lastShop']: shopFlag,
          ['userInfo.orderForm']: {
            shopFlag: shopFlag,
            tableNum: tableNum,
            orderNum: orderNum
          },
          ['orderList']: _.push({
            orderName: orderName,
            orderNum: orderNum,
            shopFlag: shopFlag,
            tableNum: tableNum,
            time: nowTime,
            pledgeMode: pledgeMode,
            cashPledge: pledge
          })
        }
      })
      tasks.push(res_2)
      //修改会员信息 里面的最近消费时间
      const res_3 = db.collection('vipList').where({
        shopFlag: shopFlag,
        vipList: {
          userOpenid: openPersonOpenid
        }
      }).update({
        data: {
          [`vipList.$.lastTime`]: nowTime
        }
      })
      tasks.push(res_3)
    }
    const RES = await Promise.all(tasks);
    return 'ok';
  } else { //添加订单失败  
    return 'error';
  }
}