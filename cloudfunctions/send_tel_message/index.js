// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.cloudbase.sendSmsV2({
      "env": 'billiards-0g53628z5ae826bc',
      "urlLink": event.url_link,
      "templateId": '2053122',
      "templateParamList":event.template_param_list,
      "phoneNumberList":event.phone_number_list,
    })
    return{
      success:true,
      message:'短信发送成功!',
      data:result
    }
  } catch (err) {
    return{
      success:false,
      message:'短信发送失败!',
      data:err
    }
  }
}