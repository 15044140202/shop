// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: 'billiards-0g53628z5ae826bc'
})
// 云函数入口函数
exports.main = async (event, context) => { 
  const appId = event.appId || 'wxad610929898d4371'
  try {
    const result = await cloud.openapi({ appid: appId }).urllink.generate({
      path: event.path, // 小程序路径
      isExpire: true,
      expire_type: 1, // 默认值0.小程序 URL Link 失效类型，失效时间：0，失效间隔天数：1 
      expire_interval: 30, // 到期失效的URL Link的失效间隔天数。生成的到期失效URL Link在该间隔时间到达前有效。最长间隔天数为30天。expire_type 为 1 必填
    });
    return {
      sucess: true,
      message: '生成 URL Link 成功',
      data: result
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '生成 URL Link 失败',
      data: err
    };
  }
}