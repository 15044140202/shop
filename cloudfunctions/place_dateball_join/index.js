// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

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
//创建新加入队员对象名称
function creatNewMemberObjName(dateBallOrder) {
  const objNameArr = Object.keys(dateBallOrder)
  for (let index = 0; index < 50; index++) {
    if (!objNameArr.includes(`joinPerson${index}`)) {
      return `joinPerson${index}`
    }
  }
  throw new Error('创建新成员对象名称错误');
}
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
  hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
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
// 数据验证函数
function validateInput(version, order) {
  if (!order || version === undefined) {
    throw new Error('Invalid order data');
  }
  if (typeof version !== 'number') {
    throw new Error('Invalid orderversion');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { version, order } = event
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  // 获取事务对象
  const transaction = await db.startTransaction();
  //const task = []
  try {
    // 输入数据验证********************
    validateInput(version, order);
    //验证版本号是否正确online_dateball
    const versionRes = await transaction.collection('online_dateball').doc(order.dateOrderId).get()
    //版本号不对 或者 桌台订单不为空 证明桌台被占用
    if (versionRes.data.version !== version) {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,订单版本号不正确`,
        data: versionRes,
      }
    }
    const dateOrder = versionRes.data
    //添加成员订单
    const addDataRes = await transaction.collection('online_dateball').add({
      data: order
    })
    if (addDataRes.errMsg !== "collection.add:ok") {
      throw addDataRes
    }
    const memberOrderId = addDataRes._id
    //构建关联订单数据
    const newObjName = creatNewMemberObjName(dateOrder)
    const orderUpData = {
      [newObjName]: {
        personGender: order.userGender,
        personHeadImage: order.userHeadImage,
        personLevel: order.userLevel,
        personName: order.userName,
        personOpenid: order.userOpenid,
        personOrderNum: order.orderNum,
        personOrderId: memberOrderId,
        personPledge: order.userPledge,
        personTelephone: order.userTelephone,
        payState: 1,
        message: order.message
      },
      dateState: order.orderState,
      version: _.inc(1),
      logs: _.push(`${getNowTime(new Date())}---${order.userName}接受邀约.`)
    }
    const tUpDateRes = await transaction.collection('online_dateball').doc(dateOrder._id).update({
      data: orderUpData,
      condition: _.eq('version', version)
    })
    if (tUpDateRes.stats.updated === 1) {
      //提交事务
      await transaction.commit();
      //await Promise.all(task)
      return {
        success: true,
        message: `place joinDateBallorder success`,
        data: { transactionId: transaction._id }
      }
    } else {
      throw 'error --- tUpDateRes ERROR'
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('place joinDateBallorder error:', err); // 记录错误日志
    return {
      success: false,
      message: `place joinDateBallorder error`,
      data: err,
    }
  }
}