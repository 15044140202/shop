// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const {pages} = event
  try {
    const result = await cloud.openapi.wxacode.get({
        "path": pages
      })
    return result
  } catch (err) {
    return err
  }
} 