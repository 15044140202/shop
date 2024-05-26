// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const {tableNum,time,amount,payMode,openid} = event;
  try {
    const result = await cloud.openapi.subscribeMessage.send({
        "touser": openid,
        "page": 'index',
        "lang": 'zh_CN',
        "data": {
          "thing1": {
            "value": '结账通知'
          },
          "thing2": {
            "value": `${tableNum}号台`
          },
          "date3": {
            "value": time
          },
          "amount4": {
            "value": amount
          },
          "thing5": {
            "value": payMode
          }
        },
        "templateId": 'b9jaMeRRdsOtwj89DNVpo6yLGLpr2ynIziZUaFdZBn0',
        "miniprogramState": 'developer'
      })
    return result
  } catch (err) {
    return err
  }
}