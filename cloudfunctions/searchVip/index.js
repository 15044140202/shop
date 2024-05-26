// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const {shopFlag,userTelephone,userName} = event;
  var vipList = [];
  //现获取店铺会员列表
  const res = await cloud.callFunction({
    name:'getDatabaseRecord_fg',
    data:{
      collection:'vipList',
      record:'vipList',
      shopFlag:shopFlag
    }
  })
  if (res.errMsg === "callFunction:ok") {//调用函数成功!  赋值vipList
    vipList = res.result;
  }else{
    return 'error';
  }
  for (let index = 0; index < vipList.length; index++) {
    const element = vipList[index];
    if (userTelephone !== 'null') { //优先匹配电话号  如果电话号为null  则匹配名字
      if (userTelephone === element.telephone) {
        return element;
      }
    }else if (userName !== 'null'){ //优先匹配名字  如果名字也为null  则匹配OPENID
      if (userName === element.name) {
        return element;
      }
    }else if(element.userOpenid === wxContext.FROM_OPENID){
      return element;
    }else if(index === vipList.length -1){//没有此会员信息
      return 'noVipInfo';
    }

  }
  return 'noVipInfo';
  // return {
  //   event,
  //   openid: wxContext.OPENID,
  //   appid: wxContext.APPID,
  //   unionid: wxContext.UNIONID,
  // }
}