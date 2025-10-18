// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
/**
 * @param {string} p_date 
 * @param {string} item  获取时间的格式 hms  为hh:mm:ss  年月日为2024年05月05日格式  其他参数为yy/mm/dd hh:mm:ss
 */
function getNowTime(p_date, item) {
  console.log(p_date ?? '未传入date')
  // 获取当前时间
  var now = new Date();
  if (p_date !== undefined) {
    now = p_date;
  }
  // 分别获取年、月、日、时、分、秒，并转换为数字
  const year = now.getFullYear();
  var month = now.getMonth() + 1; // 月份从0开始，需要加1
  var date = now.getDate();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();
  // 如果需要，可以添加前导零以确保总是两位数
  month = month < 10 ? '0' + month : month;
  date = date < 10 ? '0' + date : date;
  hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  // 返回组合成只包含数字的字符串
  console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
  if (item === 'hms') {
    return `${hours}:${minutes}:${seconds}`;
  } else if (item === '年月日') {
    return `${year}年${month}月${date}日`
  } else if (item === '年月日时分') {
    return `${year}年${month}月${date}日 ${hours}:${minutes}`
  } else {
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  }
}
async function getShopManagerOpenidArr(shopId) {
  const task = []
  task.push(db.collection('shop_account').where({
    _id: shopId
  }).get())
  task.push(db.collection('shop_member').where({
    shopId: shopId
  }).get())
  const res = await Promise.all(task)
  console.log(res)
  const shopManagerArr = res[1].data
  const openidArr = shopManagerArr.reduce((acc, item) => {
    if (['manager', 'cashier'].includes(item.position)) {
      acc.push(item.memberOpenid)
    }
    return acc
  }, [])
  if (res[0].data.length > 0) {
    openidArr.push(res[0].data[0]._openid)
  }
  return openidArr
}
/**
 * @description 发送订阅消息
 * @param {string} openid  订阅人Openid
 * @param {string} userName 订阅人名子
 * @param {string} time 订单发生事件
 * @param {string} orderNum 订单编号
 * @param {string} GBCODE 团购券码
 */
async function sendMessage(shopId, userName, time, orderNum, GBCODE) {
  //获取该商家所有员工Openid
  const openidArr = await getShopManagerOpenidArr(shopId)
  console.log('发送订阅人数:' + openidArr)
  const task = []
  try {
    openidArr.forEach(item => {
      task.push(cloud.openapi.subscribeMessage.send({
        "touser": item,
        "page": 'pages/login/login',
        "lang": 'zh_CN',
        "data": {
          "thing5": {
            "value": userName
          },
          "time3": {
            "value": time
          },
          "character_string12": {
            "value": orderNum
          },
          "character_string9": {
            "value": GBCODE
          },
          "thing8": {
            "value": '顾客团购券开台,请及时核验!'
          }
        },
        "templateId": 'EWkxfbkyuC9n7LmrxPdafgM0aFVfw38Sl4NmCOwO2kg',
        "miniprogramState": 'formal'
      }))
    })
    const result = await Promise.all(task)
    console.log('发送消息订阅结果:' + result)
    return result
  } catch (err) {
    console.log('订阅消息发送错误:' + err)
    return err
  }
}
async function announcerSendMessage(overOrder) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: overOrder.shopId, //此参数可以为  null   announcerId 和 shopFlag  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopFlag  需有一个为非null
      first: '7571',
      tableNum: overOrder.tableNum,
      last: '7581',
      randomNum: new Date().getTime() + overOrder.orderNum
    }
  })
  return
}
/**
 * @description 根据订单详情 分析订单结束时间
 * @param {object} orderInfo 
 * @returns {number} 订单结束的时间stamp 
 */
function getCloseTbaleTime(orderInfo) {
  //套餐开台
  if (orderInfo.orderName === '自助套餐订单') {
    //套餐总时长的 单位是分钟
    return orderInfo.time + Math.round(orderInfo.setmealTimeLong * 60 * 60 * 1000)
  }
  //使用代金券
  if (orderInfo.couponAmount) {
    return new Date(orderInfo.time + Math.round((Math.round(orderInfo.cashPledge) + Math.round(orderInfo.couponAmount)) / orderInfo.price * 1000 * 60 * 60)).getTime()
  }
  //不使用代金券
  return new Date(orderInfo.time + Math.round(orderInfo.cashPledge) / orderInfo.price * 1000 * 60 * 60).getTime()
}
// 数据验证函数
function validateInput(order, tableVersion) {
  if (!order || !order.shopId || !order.tableNum || !order.orderNum) {
    throw new Error('Invalid order data');
  }
  if (typeof tableVersion !== 'number') {
    throw new Error('Invalid tableVersion');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { order, tableVersion } = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  const task = []
  try {
    // 输入数据验证********************
    validateInput(order, tableVersion);
    //验证版本号是否正确
    const versionRes = await db.collection('shop_table').where({
      shopId: order.shopId,
      tableNum: order.tableNum,
    }).get()
    const thisTbale = versionRes.data[0]
    //版本号不对 或者 桌台订单不为空 证明桌台被占用
    if (thisTbale.version !== tableVersion || thisTbale.orderForm) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用`,
        data: versionRes,
      }
    }
    //添加 未核销团购券  订阅消息推送
    if (order.groupBuyInspection === false) {
      task.push(sendMessage(order.shopId, order.userName, getNowTime(new Date(order.time,), '年月日时分'), order.orderNum, order.groupBuyCode))
    }
    //修改桌台信息为**********************
    let tableUpData = {
      version: _.inc(1),
      orderForm: order.orderNum,
      //closeTableTime: getCloseTbaleTime(order)  //如果此时 加上此参数  会导致服务器不自动撤销订单
    }
    if (!order.cashPledge && !order.couponAmount && !order.setmealTimeLong) {//后结账模式
      tableUpData.ONOFF = 1
      tableUpData.closeTableTime = new Date(order.time + 1000 * 60 * 60 * 100).getTime()//100小时
      task.push(announcerSendMessage(order))
    } else if (['现金', 'cash', 'card', '会员卡', 'card&cashCoupon', '会员卡&代金券', 'mtCoupon', 'dyCoupon', 'ksCoupon'].includes(order.pledgeMode)) {//现金模式
      tableUpData.ONOFF = 1
      tableUpData.closeTableTime = getCloseTbaleTime(order)
      task.push(announcerSendMessage(order))
    }
    const tUpDateRes = await transaction.collection('shop_table').doc(thisTbale._id).update({
      data: tableUpData
    })
    if (tUpDateRes.stats.updated === 1) {
      const orderRes = await transaction.collection('table_order').add({
        data: order
      })
      //修改用户最后使用店铺 的店铺shopId 
      await db.collection('user_info').where({
        _openid: order.userOpenid
      }).update({
        data: {
          lastShopId: order.shopId
        }
      })
      //提交事务
      await transaction.commit();
      await Promise.all(task)
      return {
        addOrderRes:orderRes,
        success: true,
        message: `place table_order success`,
        data: { transactionId: transaction._id }
      }
    } else {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用`,
        data: { errorCode: -100, message: '桌台被占用或版本号不匹配' },
      }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('place order error:', err); // 记录错误日志
    return {
      success: false,
      message: `place order error`,
      data: err,
    }
  }
}