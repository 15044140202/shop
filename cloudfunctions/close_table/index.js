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
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  // 返回组合成只包含数字的字符串
  //console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
  if (item === 'hms') {
    return `${hours}:${minutes}:${seconds}`;
  } else if (item === '年月日') {
    return `${year}年${month}月${date}日`
  } else {
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  }
}
/**
 * @description 发送订阅消息
 * @param {string} merchantName  商户名称
 * @param {string} orderNum 订单编号
 * @param {string} orderState 订单状态
 * @param {string} couponName 优惠券名称
 * @param {string} note 备注信息
 */
async function sendMessage(userOpenid, merchantName, orderNum, orderState, couponName, note) {
  try {
    const result = await cloud.openapi({ appid: "wxb7d587d7faabe931" }).subscribeMessage.send({
      "touser": userOpenid,
      "page": 'pages/my/sportShow/sportShow',
      "lang": 'zh_CN',
      "data": {
        "thing3": {
          "value": merchantName
        },
        "character_string1": {
          "value": orderNum
        },
        "thing2": {
          "value": orderState
        },
        "thing12": {
          "value": couponName
        },
        "thing10": {
          "value": note
        }
      },
      "templateId": 'nei-pzkaZ2juTDWQ1JQHjZcM5FkWwuoiQzHAZS8sJ2o',
      "miniprogramState": 'formal'
    })
    console.log('发送消息订阅结果:' + result)
    return result
  } catch (err) {
    console.log('订阅消息发送错误:' + err)
    return err
  }
}
async function getOverOrder(overOrderForm, orderNum) {
  //获取订单
  if (!orderNum && !overOrderForm.orderNum) {
    throw "错误---订单信息和订单编号不能都为空!"
  }
  const overOrder = {}
  //1.获取 overOrder && 获取overOrder._id
  if (!overOrderForm || !overOrderForm._id) {
    //获取订单
    const res = await db.collection('table_order').where({
      orderNum: orderNum || overOrderForm.orderNum
    }).get()
    if (res.data.length === 0) {
      throw { "错误---获取订单错误!": res }
    }
    if (overOrderForm) {//仅需 添加 _id 属性
      Object.assign(overOrder, overOrderForm)
      overOrder._id = res.data[0]._id
    } else {
      const now = new Date()
      //整理订单
      Object.assign(overOrder, res.data[0])
      overOrder.endTime = getNowTime(now)
      overOrder.log.push(`${getNowTime(now)}---结账.系统`)
      overOrder.payMode = getPayMode(overOrder.pledgeMode)
      overOrder.tableCost = overOrder.cashPledge + (overOrder.couponAmount ? overOrder.couponAmount : 0)
    }
  } else {
    //传过来的 overOrderNum  有完整的信息(order 且 有_id 属性)
    Object.assign(overOrder, overOrderForm)
  }
  //2.获取这个 用户所在账单店铺 的vip _id
  if (!overOrder.userVipId && ["自助开台订单", "自助套餐订单"].includes(overOrder.orderName)) {
    const res = await db.collection('vip_list').where({
      shopId: overOrder.shopId,
      userOpenid: overOrder.userOpenid
    }).get()
    if (res.data.length === 0) {
      throw { "错误---获取VIPinfo错误!": res }
    }
    overOrder.userVipId = res.data[0]._id
  }
  //3.结账订单  里面如果有payFor 信息 获取  payFor.user_vip_id
  if (overOrder.payFor && !overOrder.payFor.user_vip_id && overOrder.payFor.payMode === 'card') {//有payFor信息
    const res = await db.collection('vip_list').where({
      userOpenid: overOrder.payFor.userOpenid,
      shopId: overOrder.shopId
    }).get()
    if (res.data.length === 0) {
      throw { "错误---获取代付人Id错误!": res }
    }
    overOrder.payFor.user_vip_id = res.data[0]._id
  }
  return overOrder
}
function getPayMode(pledgeMode) {
  console.log(pledgeMode)
  switch (pledgeMode) {
    case 'wx':
      return '微信'
    case 'cash':
      return '现金'
    case 'card':
      return '会员卡'
    case 'wx&cashCoupon':
      return '微信&代金券'
    case 'cash&cashCoupon':
      return '现金&代金券'
    case 'card&cashCoupon':
      return '会员卡&代金券'
    case 'dyCoupon':
      return '抖音券'
    case 'mtCoupon':
      return '美团券'
    case 'ksCoupon':
      return '快手券'
    default:
      return '未知付款方式'
  }
}
/**
 * @description 计算两个时间的小时差
 * @param {string||number} timeStr1 时间截或者时间字符串
 * @param {string||number} timeStr2 时间截或者时间字符串
 * @returns {number} 两个时间的小时差
 */
function calculateTimeDifferenceInHours(timeStr1, timeStr2) {
  // 解析时间字符串为Date对象
  const date1 = new Date(timeStr1);
  const date2 = new Date(timeStr2);

  // 检查日期是否有效
  if (isNaN(date1) || isNaN(date2)) {
    throw new Error('无效的时间格式');
  }

  // 计算两个日期的毫秒差
  const differenceInMs = Math.abs(date2 - date1);

  // 将毫秒差转换为小时
  const differenceInHours = differenceInMs / (1000 * 60 * 60);

  return differenceInHours;
}
async function announcerSendMessage(overOrder) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: overOrder.shopId, //此参数可以为  null   announcerId 和 shopFlag  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopFlag  需有一个为非null
      first: '7572',
      tableNum: overOrder.tableNum,
      last: '7580',
      randomNum: new Date().getTime() + overOrder.orderNum
    }
  })
  return
}
async function wxRefund(overOrder, sub_mchid, refund_amount) {
  const res = await cloud.callFunction({
    name: 'wx_pay',
    data: {
      item: 'refund',
      parameter: {
        out_trade_no: overOrder.orderNum,
        out_refund_no: overOrder.refundOrder,
        total_fee: overOrder.cashPledge * 100,
        refund_fee: (refund_amount ? refund_amount : overOrder.cashPledge - overOrder.tableCost) * 100,
        sub_mch_id: sub_mchid
      }
    }
  })
  return res
}
async function orderRefund(transaction, task, overOrder, sub_mchid) {
  //代付 进行全部押金退款
  if (overOrder.payFor) {
    await transaction.collection('refund_order').add({
      data: {
        orderNum: overOrder.refundOrder,
        originalOrderNum: overOrder.orderNum,
        originalTotalCost: overOrder.cashPledge,
        refundCost: overOrder.cashPledge,
        sub_mchid: sub_mchid,
        appid: 'wxad610929898d4371',
        time: getNowTime(),
        refundState: 0
      }
    })
    task.push(wxRefund(overOrder, sub_mchid, overOrder.cashPledge))
  } else if (overOrder.refundOrder) {//部分退款
    await transaction.collection('refund_order').add({
      data: {
        orderNum: overOrder.refundOrder,
        originalOrderNum: overOrder.orderNum,
        originalTotalCost: overOrder.cashPledge,
        refundCost: overOrder.refundCost,
        sub_mchid: sub_mchid,
        appid: 'wxad610929898d4371',
        time: getNowTime(),
        refundState: 0
      }
    })
    task.push(wxRefund(overOrder, sub_mchid, overOrder.refundCost))
  }
}
async function getOverTbale(overOrder) {
  const { tableNum, shopId } = overOrder
  const res = await db.collection('shop_table').where({
    tableNum: tableNum,
    shopId: shopId
  }).get()
  if (res.data.length === 0) {
    throw { "获取桌台信息错误!": res }
  }
  return res.data[0]
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('close_table调用来源环境信息:', {
    event: event
  });
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { overOrderForm, tableVersion, sub_mchid, orderNum } = event
  const overOrder = await getOverOrder(overOrderForm, orderNum)
  console.log('以获取到 overOrder')
  const transaction = await db.startTransaction()
  const task = []
  try {
    //先获取 订单 的桌台,和订单信息
    const overTable = await getOverTbale(overOrder)

    if (overTable.version !== tableVersion) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用或版本号不匹配`,
        data: { errorCode: -100, message: '桌台被占用或版本号不匹配' },
      }
    }
    //修改桌台信息
    await transaction.collection('shop_table').doc(overTable._id).update({
      data: {
        ONOFF: _.set(0),
        orderForm: _.set(''),
        version: _.inc(1),
        closeTableTime: _.set(0)
      }
    })
    console.log('检查退款')
    //添加退款订单  部分退款
    await orderRefund(transaction, task, overOrder, sub_mchid)
    //修改订单信息
    const { _id, ...upDataOrder } = overOrder
    console.log(upDataOrder)
    console.log('修改桌台信息')
    await transaction.collection('table_order').doc(_id).update({
      data: upDataOrder
    })
    console.log('修改用户积分')
    //修改用户 积分 最后消费时间 总时长 余额扣款
    if (["自助开台订单", "自助套餐订单"].includes(overOrder.orderName)) {
      const upData = {
        lastTime: overOrder.endTime,
        totalTime: _.inc(Math.round(calculateTimeDifferenceInHours(overOrder.time, overOrder.endTime))),
        totalTableCost: _.inc(Math.round(overOrder.tableCost)),
      }
      //积分
      if (!overOrder.payFor) upData.integral = _.inc(Math.round(overOrder.integral))
      //需要卡口 余额(非代付)
      if ((overOrder.pledgeMode.includes('card') || overOrder.pledgeMode.includes('会员卡')) && !overOrder.payFor) {
        //使用代金券 扣全部押金 不使用扣除实际金额
        const amount = overOrder.couponAmount ? overOrder.cashPledge : overOrder.tableCost
        upData.amount = _.inc(- Math.round(amount))
        //生成会员账户余额变更记录数据
        const vipAmountChangeOrder = {
          shopId: overOrder.shopId,
          userOpenid: overOrder.userOpenid,
          changeName: '消费',
          changeAmount: parseInt(- amount),
          oldAmount: overOrder.oldAmount,
          reason: `${overOrder.tableNum}号台台费:${overOrder.cashPledge}元`,
          status: overOrder.userName,
          time: overOrder.time
        }
        //增加会员账户余额变更数据
        await transaction.collection('vip_amount_change').add({
          data: vipAmountChangeOrder
        })
      }
      await transaction.collection('vip_list').doc(overOrder.userVipId).update({
        data: upData
      })
    }
    console.log('检测是否代付')
    //代付 使用会员卡代付的
    if (overOrder.payFor && overOrder.payFor.payMode === 'card') {
      //生成会员账户余额变更记录数据
      const vipAmountChangeOrder = {
        shopId: overOrder.shopId,
        userOpenid: overOrder.payFor.userOpenid,
        changeName: '代付台费',
        value: parseInt(- overOrder.tableCost),
        oldAmount: overOrder.payFor.oldAmount,
        reason: `代付${overOrder.tableNum}号台台费:${overOrder.tableCost}元`,
        status: overOrder.payFor?.userName || '用户名称获取错误!',
        time: overOrder.time
      }
      console.log('增加会员扣款记录!')
      console.log(vipAmountChangeOrder)
      //增加会员账户余额变更数据
      await transaction.collection('vip_amount_change').add({
        data: vipAmountChangeOrder
      })
      console.log('会员扣款')
      //扣除  代付人会员卡金额
      await transaction.collection('vip_list').doc(overOrder.payFor.user_vip_id).update({
        data: {
          amount: _.inc(Math.round(vipAmountChangeOrder.value))
        }
      })
    }
    console.log('发送播报信息')
    //发送 吧台 语音播报
    task.push(announcerSendMessage(overOrder))
    console.log('发送订阅信息!')
    //发送 精彩秀 顾客订阅消息
    if ('sportShowPrice' in overOrder) {//有精彩秀摄像机
      task.push(sendMessage(overOrder.userOpenid, overOrder.shopName, overOrder.orderNum, '已完成', `运动精彩秀${overOrder.sportShowPrice}元体验券`, '快来进入小程序,记录自己的高光时刻吧!'))
    }
    await transaction.commit();
    await Promise.all(task)
    return {
      success: true,
      message: `close table success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('close table error:', err); // 记录错误日志
    return {
      success: false,
      message: `close table error`,
      data: err,
    }
  }
}