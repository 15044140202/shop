// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
const {memberOpenid,shopFlag,attendanceInfo,dateYM} = event;
//获取时间
const res = await cloud.callFunction({
  name:'getBeiJingTime',
  data:{}
});
const time =  res.result ;
//修改shopAccount合集 里面 shopInfo.shop.member数组 里面 此店员的 打卡数据
const r = await cloud.callFunction({
  name:'getDatabaseRecord_fg',
  data:{
    collection:'shopAccount',
    shopFlag:shopFlag,
    record:'shop'
  }
}); 
const member = r.result.member;
if (member.length > 0) {
  for (let index = 0; index < member.length; index++) {
    const element = member[index];//每个店员的信息
    if (memberOpenid === element.memberOpenid) {//锁定成员
      //修改服务器的成员打卡状态
      await cloud.callFunction({
        name:'amendDatabase_fg',
        data:{
          collection:'shopAccount',
          flagName:'shopFlag',
          flag:shopFlag,
          objName:`shop.member.${index}.attendanceState`,
          data:attendanceInfo
        }
      })
      //向服务器添加打卡记录
      await cloud.callFunction({
        name:'addArrayDatabase_fg',
        data:{
          collection:'memberAttendance',
          shopFlag:shopFlag,
          objName:`attendance${dateYM}`,
          data:{
            name:element.name,
            memberOpenid:element.memberOpenid,
            telephone:element.telephone,
            time:time,
            state:attendanceInfo === true ? '上班' : '下班'
          }
        }
      })
      return 'ok'
    }
  }
}else{//如果返回 成员数据 长度等于0  则 成员被删除了
  return 'error-店铺成员为0'
}
return 'error-意外退出';
}