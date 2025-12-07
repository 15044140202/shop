// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const { userOpenid, shopId, phoneNum, userName, headImage ,birthday,gender} = event
  const task = []
  //修改用户手机号码
  const userData = {}
  if (phoneNum) userData[`userInfo.telephone`] = phoneNum
  if (userName) userData[`userInfo.name`] = userName
  if (headImage) userData['userInfo.headImage'] = headImage
  if (birthday) userData['userInfo.birthday'] = birthday
  if (gender) userData['userInfo.gender'] = gender
  task.push(
    db.collection('user_info').where({
      _openid: userOpenid
    }).update({
      data:userData
    })
  )
  //修改会员信息里的用户手机号码
  const vipData = {}
  if (phoneNum) vipData.telephone = phoneNum
  if (userName) vipData.name = userName
  if (headImage) vipData.headImage = headImage
  if (birthday) vipData.birthday = birthday
  if (gender) vipData.gender = gender
  task.push(
    db.collection('vip_list').where({
      userOpenid: userOpenid
    }).update({
      data: vipData
    })
  )
  //更改商家 获取电话号码次数    减获取电话号码次数
  if (shopId) {
    task.push(
      db.collection('shop_account').where({
        _id: shopId
      }).update({
        data: {
          shortMsgDegree: _.inc(-1)
        }
      })
    )
  }
  const res = await Promise.all(task)
  return {
    success: true,
    message: '修改成功!函数运行成功,是否成功请以返回数据为准!',
    data: res
  }
}