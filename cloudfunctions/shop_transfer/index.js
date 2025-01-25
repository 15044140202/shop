// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const merchant_openid = wxContext.OPENID
  const { shopId, shopName, tel, old_openid } = event
  //获取新商家用户资料  新用户插入商家用户基本信息
  const merchant_info = await cloud.callFunction({
    name: 'getOrInsertData',
    data: {
      collection: 'merchant_info',
      query: {
        _openid: merchant_openid,
      },
      dataToInsert: {
        shopId: []
      }
    }
  })
  if (!merchant_info.result.success) {
    return {
      success: false,
      message: 'getOrInsertData merchant_info error',
      data:merchant_info
    }
  }
  //获取老商户merchant_info 信息  获取成功后删除里面 转让的店铺信息
  const res = await db.collection('merchant_info').where({
    _openid: old_openid
  }).get()
  let old_merchant_info = undefined
  if (res.errMsg === 'collection.get:ok') {
    old_merchant_info = res.data[0]
    const newData = []
    for (let index = 0; index < old_merchant_info.length; index++) {
      const element = old_merchant_info[index];
      if (element.shopId !== shopId) {
        newData.push(element)
      }
    }
    old_merchant_info = newData
  } else {
    return {
      success: false,
      message: '获取老商户merchant_info error'
    }
  }

  // 获取事务对象
  const transaction = await db.startTransaction();
  try {
    //向新店主 商家用户里面添加店铺信息
    await transaction.collection('merchant_info').where({
      _openid: merchant_openid
    }).update({
      data: {
        shopId: _.push({ shopId: shopId, shopName: shopName })
      }
    })
    //删除 老店主 商家信息里面的 店铺信息
    await transaction.collection('merchant_info').where({
      _openid: old_openid,
    }).update({
      data: {
        shopId: old_merchant_info
      }
    })
    //修改shop_account 里面的老板openid
    await transaction.collection('shop_account').where({
      _id:shopId
    }).update({
      data:{
        _openid:merchant_openid,
        [`shopInfo.telephone`]:tel
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




  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}