// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
const {shopOpenid,vipInfo} = event;//vip Info  可以是会员电话号  或者会员名称 
//下面获取本店的会员列表  为个会员级别添加会员数量
const res = await cloud.callFunction({
  name: 'getDatabaseArray_op',
  data: {
    collection: 'vipList',
    openid: shopOpenid,
    ojbName: 'vipList',
    startSum: 0,
    endSum: -1
  }
})

if (res.errMsg === "callFunction:ok") {//获取会员列表成功!
    if (res.result.length > 0) {
      const vipList = res.result;
      for (let index = 0; index < vipList.length; index++) {
        const element = vipList[index];
        if (element.flag === vipInfo || element.telephone === vipInfo || element.name === vipInfo) {
          return element; //返回查询到的会员信息
        }
      }
      return [];//无查询会员信息
    }else{//此店铺无会员数据
      return [];
    }
}else{//获取会员列表失败!
  return "error";
}
}