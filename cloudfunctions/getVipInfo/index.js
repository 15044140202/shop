// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}); // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag,
    getVipSum
  } = event;

  var vipInfo = [];
  while (vipInfo.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection('vipInfo').where({
      shopFlag: shopFlag
    }).get()
    console.log(res)
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection('vipInfo').add({
        data: {
          shopFlag: shopFlag,
          vipInfo: [{
            name: '青铜会员',
            defaultDiscount: 10,
            chargingDiscount: [],
            tableCardDeduct: false,
            commotidyCostDiscount: 10,
            commotidyCardDeduct: false,
            saveMoney: [{
              name: '首次存款',
              amount: 100,
              give: 0
            }],
            autoLevelUp: false,
            needIntegral: 0,
            noBalanceDiscount: false,
            autoApply: false,
            practiseBall: false,
            vipSum: 0
          }]
        }
      })
    } else {
      if (getVipSum === true) {
        vipInfo = res.data[0];
        break;
      } else {
        return res.data[0].vipInfo;
      }
    }
  }
  console.log({
    '数据': vipInfo
  }) //获得到的  vipInfo  下面获取本店的会员列表  为个会员级别添加会员数量
  const res = await cloud.callFunction({
    name: 'getDatabaseArray_fg',
    data: {
      collection: 'vipList',
      shopFlag: shopFlag,
      ojbName: 'vipList',
      startSum: 0,
      endSum: -1
    }
  })
  console.log(res)
  //下面是获取每个会员级别 人数的 程序  ↓↓↓
  for (let index = 0; index < vipInfo.vipInfo.length; index++) { //所有会员数量清零
    vipInfo.vipInfo[index].vipSum = 0;
  }
  if (res.result.length > 0) {
    for (let index = 0; index < res.result.length; index++) {
      const element = res.result[index];
      if (vipInfo.vipInfo.length > element.vipLevel ) { //不满足此条件  则用户的那个会员级别  已被删除 则添加到青铜会员里面
        vipInfo.vipInfo[element.vipLevel].vipSum += 1;
      } else {
        vipInfo.vipInfo[0].vipSum += 1;//基础会员  人数+1
      }

    }
    return vipInfo
  } else {
    return vipInfo
  }
}