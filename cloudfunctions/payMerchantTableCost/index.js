// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const { shopId, tableDataArray, orderNum, amount, payTime } = event;
  const task = []
  const tableNums = []
  const transaction = await db.startTransaction()
  try {
    //充值台费
    tableDataArray.forEach(item => {
      tableNums.push(`${item.tableNum}号台`)
      task.push(
        transaction.collection('shop_table').where({
          shopId:shopId,
          tableNum:item.tableNum
        }).update({
          data:{
            useEndTime:item.useEndTime
          }
        })
      )
    })
    //添加充值账单
    task.push(
      transaction.collection('shop_order').add({
        data:{
          orderNum:orderNum,
          orderName:'台费充值单',
          amount:amount,
          time:payTime,
          payMode:'wx',
          tableNums:tableNums
        }
      })
    )
    const res = await Promise.all(task)
    await transaction.commit()
    return{
      success: true,
      message: `merchant tableCost pay success!`,
      data: res,
    }
  } catch (e) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('merchant tableCost pay error:', err); // 记录错误日志
    return {
      success: false,
      message: `merchant tableCost pay error`,
      data: err,
    }
  }
}