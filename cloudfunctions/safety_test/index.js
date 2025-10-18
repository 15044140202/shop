// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  console.log(wxContext)
  const { message, pic, media, scene = 2 } = event
  const userOpenid = wxContext.FROM_OPENID
  if (!message && !pic && !media) {
    return {
      success: false,
      message: '请至少提供文本/图片/视频的一种'
    }
  }
  const task = []
  //文本检测
  if (message) {
    task.push(cloud.openapi({ appid: wxContext.FROM_APPID }).security.msgSecCheck({
      "openid": userOpenid,
      "scene": 2,//1 资料；2 评论；3 论坛；4 社交日志
      "version": 2,//接口版本号，2.0版本为固定值2
      "content": message
    })) 
    //	result{	suggest:	有risky、pass、review三种值 ,label:100 正常；10001 广告；20001 时政；20002 色情；20003 辱骂；20006 违法犯罪；20008 欺诈；20012 低俗；20013 版权；21000 其他}
    //此处加判断
  }
  const res = await Promise.all(task)
  return res
  //图片检测
  //视频检测
  //const res = await Promise.all(task)
 // 此处分析  出结果  
 //返回分析出的结果类型 {success:true/false, massage:suggest ,pic:suggest , media:suggest }
}