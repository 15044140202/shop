// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const { pages,appid} = event

  if ('scene' in event) {
    try {
      const result = await cloud.openapi({appid:appid?appid:'wxad610929898d4371'}).wxacode.getUnlimited({
        "page": pages,
        "scene":event.scene
      })
      return result
    } catch (err) {
      return err
    }
  } else {
    try {
      const result = await cloud.openapi.wxacode.get({
        "path": pages
      })
      return result
    } catch (err) {
      return err
    }
  }

} 