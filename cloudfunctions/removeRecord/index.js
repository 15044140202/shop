// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { collection, query } = event
  
  try {
    // 情况1：query是数组，批量删除多个记录
    if (Array.isArray(query)) {
      // 使用Promise.all并行删除
      const deletePromises = query.map(q => 
        db.collection(collection).where(q).remove()
      )
      
      const results = await Promise.all(deletePromises)
      const successCount = results.filter(
        res => res.errMsg === 'collection.remove:ok'
      ).length
      
      return {
        success: successCount === query.length,
        message: successCount === query.length 
          ? 'all records removed successfully' 
          : `${successCount} of ${query.length} records removed successfully`,
        data: results,
        deletedCount: successCount
      }
    }
    // 情况2：query不是数组，按条件删除单个或多个记录
    else if (query) {
      const res = await db.collection(collection).where(query).remove()
      return {
        success: res.errMsg === 'collection.remove:ok',
        message: res.errMsg === 'collection.remove:ok' 
          ? 'remove records success' 
          : 'remove records failed',
        data: res,
        deletedCount: res.stats?.removed || 0
      }
    }
    // 参数不合法的情况
    else {
      return {
        success: false,
        message: 'invalid parameters: query is required',
        data: null
      }
    }
  } catch (e) {
    return {
      success: false,
      message: 'remove records error',
      data: e
    }
  }
}