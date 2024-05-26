// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const {code} = event;
  const wxContext = cloud.getWXContext();
  var data = {};
  if("FROM_APPID" in wxContext === true){
    data = {appid: wxContext.FROM_APPID}
  }
  try {
      const result = await cloud.openapi(data).phonenumber.getPhoneNumber({
        "code":code
        })
    return result
  } catch (err) {
    return err
  }
}