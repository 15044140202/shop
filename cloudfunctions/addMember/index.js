// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const transaction = await db.startTransaction();
  try {
    // // 验证输入
    // validateInput(event);
    // 获取事务中的集合引用
    const { shopId, shopName, position, telephone } = event
    // 向merchant_info 里添加店铺信息
    await transaction.collection('merchant_info').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        shopId: _.push({ shopName: shopName, shopId: shopId })
      }
    })
    //向shop_member里面添加 本店员信息
    await transaction.collection('shop_member').add({
      data: {
        shopId: shopId,
        memberOpenid: wxContext.OPENID,
        position: position,
        telephone: telephone
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