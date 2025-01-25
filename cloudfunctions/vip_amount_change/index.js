// 云函数入口文件
const cloud = require('wx-server-sdk')
// 输入验证函数
function validateInput(event) {
  if (!event.shopId || !event.userOpenid ||!event.value||!event.reason||!event.status || !event.time) {
    throw new Error('Invalid input: 存在不允许为空的参数');
  }

}
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { shopId, userOpenid, oldAmount, value, reason, status ,time} = event
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // 验证输入
    validateInput(event);
    // 获取事务中的集合引用
    vipAmonutChangeOrder = {
      shopId:shopId,
      userOpenid:userOpenid,
      changeName:'店铺主动变更',
      changeAmount:parseInt(value) ,
      oldAmount:oldAmount,
      reason:reason,
      status:status,
      time:time
    }
    //添加账户变更记录
    await transaction.collection('vip_amount_change').add({
      data:vipAmonutChangeOrder
    })
    //修改用户账户金额
    await transaction.collection('vip_list').where({
      shopId:shopId,
      userOpenid:userOpenid
    }).update({
      data:{
        amount:_.inc(parseInt(value))
      }
    })
    // 提交事务
    await transaction.commit();
    return {
      success: true,
      message: 'Transactions committed successfully'
    };
  } catch (e) {
    console.error(`transaction error`, e)
    return {
      success: false,
      error: e
    }
  }



}