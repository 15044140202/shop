// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
const {userOpenid,shopFlag,value,reason,status} = event;
const db = cloud.database();
const res =await db.collection('vipList').where({
  shopFlag:shopFlag
}).get();
if('data' in res){
  var i = -1;
  var data = [];
  const array = res.data[0].vipList;
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    if(element.userOpenid === userOpenid){
      i = index ;
      data = element;
      break;
    }
  }
  data.amount = parseInt(data.amount) + parseInt(value);
  var now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  data.amountChange.push({status:status,time:now,amount:value,reason:reason})
  if(i > -1){
    const r =await db.collection('vipList').where({
      shopFlag:shopFlag
    }).update({
      data:{
        [`vipList.${i}`]:data
      }
    });
    return {massage:'ok',data:r} ;
  }else{
    return {massage:'数据库中无此用户!'};
  }
}else{
  return {massage:'无此商家数据!'};
}

}