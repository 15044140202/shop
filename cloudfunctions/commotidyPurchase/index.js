// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const { order } = event
  const commotidyList = order.commotidyList
  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    // // 验证输入
    // validateInput(event);
    // 增加商品 进货数量
    for (let index = 0; index < commotidyList.length; index++) {
      const element = commotidyList[index];
      await transaction.collection('shop_commotidy').where({
        _id:element._id
      }).update({
        data:{
          sum:_.inc(element.sum)
        }
      })
    }
    //添加进货记录
    await transaction.collection('shop_commotidy_po').add({
      data:order
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