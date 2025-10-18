// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { shop_table, order, groupBuyData } = event
  const transaction = await db.startTransaction()
  const res = {}
  try {
    //更改账单信息
    res.i = await transaction.collection('table_order').where({
      orderNum: order.orderNum
    }).update({
      data: {
        price: groupBuyData.price,
        cashPledge: groupBuyData.price,
        setmealTimeLong: groupBuyData.timeLong,
        groupBuyInspection:true
      }
    })
    //更新桌台关台时间 
    res.i1 = await transaction.collection('shop_table').where({
      _id: shop_table._id
    }).update({
      data:{
        closeTableTime: order.time + groupBuyData.timeLong * 60 * 60 * 1000
      }
    })
    //提交
    await transaction.commit()
    return{
      success:true,
      message:'重新选择团购套餐成功!',
      data:res
    }
  } catch (e) {
    await transaction.rollback()
    return {
      success: false,
      message: 'reselect error',
      data: e
    }
  }
}