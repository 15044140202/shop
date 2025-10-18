// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 数据验证函数
function validateInput(dataArr) {
  if ( !Array.isArray(dataArr) || dataArr.length === 0) {
    throw new Error('Invalid dataArr data,must be Array and length greater than 0');
  }
  for(let upDate of dataArr){
    const keyArr = Object.keys(upDate)
    if (!keyArr.includes('collection') || !keyArr.includes('_id') ||  !keyArr.includes('upData')) {
      throw new Error('member of dataArr must be include key (collection && _id && upData)');
    }
  }
}
// 云函数入口函数
exports.main = async (event, context) => {
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const { dataArr } = event
  const transaction = await db.startTransaction()
  try {
    // 输入数据验证********************
    validateInput(dataArr)
    //开始事务
    for(let upData of dataArr){
      await transaction.collection(upData.collection).doc(upData._id).update({
        data:upData.upData
      })
    }
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