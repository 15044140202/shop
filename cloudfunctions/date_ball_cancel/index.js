// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command;
// 数据验证函数
function validateInput(event) {
  if (!event.order || !event.myRoleInfo) {
    throw new Error('Invalid order data');
  }
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
//构建主订单 修改内容
function getDateOrderUpdata(event) {
  const upData = {}
  const { order, myRoleInfo, breach } = event
  //判断 角色信息
  if (myRoleInfo.role === 'launchPerson') {//发起人
    if (breach) {//违约
      upData.dateState = 'cancel'
      upData.breach = breach,
      uuData.version = _.inc(1)
      upData.logs = _.push(`${getNowTime(new Date())}---发起人违约取消订单.`)
    } else {//非违约
      upData.dateState = 'cancel'
      upData.breach = breach,
      uuData.version = _.inc(1)
      upData.logs = _.push(`${getNowTime(new Date())}---发起人取消订单.`)
    }
    return upData
  } else {//成员  应约人
    if (breach) {//违约
      upData.dateState = 'cancel'
      upData.version = _.inc(1)
      upData.logs = _.push(`${getNowTime(new Date())}---应约人违约取消订单.`)
    } else {//不违约
      upData.dateState = 'draft'
      upData.version = _.inc(1)
      upData.logs = _.push(`${getNowTime(new Date())}---应约人取消订单.`)
      upData[myRoleInfo.joinPersonObjName] = _.remove()
    }
    return upData
  }

}
function getMmeberOrderUpData(event) {
  const upData = {}
  let _id = ''
  const { order, myRoleInfo, breach } = event
  if (myRoleInfo.role === 'joinPerson') {
    _id = order[myRoleInfo.joinPersonObjName].personOrderId
    upData.breach = breach
    upData.orderState = 'cancel'
  }else{
    return {}
  }
  return {
    _id: _id,
    upData
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { order } = event
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // 输入数据验证********************
    validateInput(event);

    //修改约球订单状态
    const dateOrderUpdata = getDateOrderUpdata(event)
    await transaction.collection('online_dateball').doc(order._id).update({
      data: dateOrderUpdata
    })
    //修改应约人订单 
    const memberOrderUpData = getMmeberOrderUpData(event)
    if (Object.keys(memberOrderUpData).length > 0) {
      await transaction.collection('online_dateball').doc(memberOrderUpData._id).update({
        data: memberOrderUpData.upData
      })
    }

    //提交事务
    await transaction.commit();
    return {
      success: true,
      message: `date order cancel  success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('date order cancel error:', err); // 记录错误日志
    return {
      success: false,
      message: `date order cancel error`,
      data: err,
    }
  }
}