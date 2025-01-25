// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { collection, query, record, data } = event
  try {
    // 构建更新数据对象
    let updateData = {};
    if (Array.isArray(record) && Array.isArray(data)) {//两个变量都是数组
      if (record.length !== data.length) {
        throw new Error('变量record 和 data 的长度不一致!');
      }
      for (let i = 0; i < record.length; i++) {
        updateData[record[i]] = _.set(data[i]);
      }
    } else if (!Array.isArray(record) && !Array.isArray(data)) {//两个变量都不是数组
      updateData[`${record}`] = _.set(data)
    } else {//一个是数组一个不是数组
      throw new Error('变量record 和 data 的数据类型不一致!');
    }

    const res = await db.collection(collection).where(query).update({
      data:updateData
    })
    if (res.errMsg === 'collection.update:ok') {
      return {
        success: true,
        message: 'update success',
        data: res
      }
    }
    return {
      success: false,
      message: 'update failed',
      data: res
    }
  } catch (e) {
    return {
      success: false,
      message: 'update error',
      data: e
    }
  }
}