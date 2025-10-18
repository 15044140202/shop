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
async function announcerSendMessage(order) {
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: order.shopId, //此参数可以为  null   announcerId 和 shopId  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopId  需有一个为非null
      first: '7573',//配送提示
      tableNum: order?.tableNum || 0,
      last: '7584',//"号台购买商品,请及时配送."
      randomNum: new Date().getTime() + order.orderNum
    }
  })
  return
}
// 数据验证函数
function validateInput(order) {
  if (!order || !order.shopId || !order.orderNum || order.goodsList.length < 1) {
    throw new Error('Invalid order data');
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { order } = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  const task = []
  try {
    // 输入数据验证********************
    validateInput(order);
    if (order.payState === 1) {
      task.push(
        announcerSendMessage(order)
      )
    }
    //添加订单数据
    await transaction.collection('table_order').add({
      data: order
    })
    //修改商品 库存数量
    const goodsList = order.goodsList
    for (const item of goodsList) {
      await transaction.collection('shop_commotidy').doc(item.goodsId).update({
        data: {
          sum: _.inc(- item.sum)
        }
      })
    }
    //提交事务
    await transaction.commit();
    await Promise.all(task)
    return {
      success: true,
      message: `place goods order success`,
      data: { transactionId: transaction._id }
    }
  } catch (err) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('place goods order error:', err); // 记录错误日志
    return {
      success: false,
      message: `place goods order error`,
      data: err,
    }
  }
}