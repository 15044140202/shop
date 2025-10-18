// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 数据验证函数
function validateInput(event) {
  if (!event.order) {
    throw new Error('order must be not undefined ');
  }
  if (!event.memberObjName) {
    throw new Error('memberObjName must be not undefined ');
  }
}
//判断该订单是否所有人已经全部到店 ***只能在 reachShop 函数中调用
function isAllreschShop(order , myObjName ,nowTimeStamp) {
  const reachShopTimeArr = []
  const memberSum = Object.keys(order).reduce((acc,item)=>{
    if (item.includes('joinPerson')) {
      acc += 1
    }
    return acc
  },0)

  if (memberSum + 1 !== order.peopleSum) {
    return false
  }
  for (let key of Object.keys(order)) {
    if ((key.includes('joinPerson') || key === 'launchPerson') && key !== myObjName) {
      if (!order[key]?.reach) {
        return false
      }
      reachShopTimeArr.push(order[key].reach)
    }
    if (key === myObjName) {
      reachShopTimeArr.push(nowTimeStamp)
    }
  }

  let maxdifference = 0
  reachShopTimeArr.forEach(item=>{
    const thisDifference = Math.abs(reachShopTimeArr[0] - item)
    maxdifference = Math.max(maxdifference , thisDifference)
  })
  //到店时间差  超过 30分钟则需要重新打卡   算没有全部打卡完毕
  if (maxdifference > 30 * 60 * 1000) {
    return false
  }
  return true
}
// 云函数入口函数
exports.main = async (event, context) => {
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { order, memberObjName } = event
  const transaction = await db.startTransaction()
  const nowTimeStamp = new Date().getTime()
  try {
    // 输入数据验证********************
    validateInput(event)
    //验证订单版本号
    const thisOrder = await db.collection('online_dateball').doc(order._id).get()
    if (!thisOrder.data) {
      throw 'error 查询的订单不存在.'
    }
    //检查版本号是否匹配（乐观锁）
    if (thisOrder.data.version !== order.version){
      throw new Error('版本号冲突，数据已被修改')
    }

    //更新主订单数据
    const primaryUpData = {
      [memberObjName]: {
        reach: nowTimeStamp
      },
      version: _.inc(0)
    }
    if (isAllreschShop(order ,memberObjName , nowTimeStamp)) {//判断是否全部成员都到店
      primaryUpData.dateState = 'playing'
      // 更改全部成员订单状态
      for (let key of Object.keys(order)) {
        if (key.includes('joinPerson')) {
          await transaction.collection("online_dateball").doc(order[key].personOrderId).update({
            data: {
              orderState:'playing'
            }
          })
        }
      }
    }
    await transaction.collection("online_dateball").doc(order._id).update({
      data: primaryUpData
    })
    //提交事务
    await transaction.commit()
    return {
      success: true,
      message: `transaction upDate success`,
      data: { transactionId: transaction._id }
    }
  } catch (e) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('transaction upDate error:', e); // 记录错误日志
    return {
      success: false,
      message: `transaction upDate error`,
      data: e,
    }
  }

}