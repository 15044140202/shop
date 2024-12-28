// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {userOpenid,shopFlag,value} = event;

  const res =await db.collection('vipList').where({
    shopFlag:shopFlag,
    vipList:{
      userOpenid:userOpenid
    }
  }).update({
    data:{
      ['vipList.$.vipLevel']: _.set(parseInt(value))
    }
  });
  if (res.stats.updated === 1) {//成功
    return 'ok';
  }else{//更新失败!
    return 'error';
  }
}