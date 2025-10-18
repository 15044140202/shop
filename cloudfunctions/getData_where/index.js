// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
function buildQuery(event) {
  const query = event.query || {};

  // 处理各种查询操作符
  const operators = ['_lt', '_lte', '_gt', '_gte', '_in', '_nin'];
  operators.forEach(op => {
    if (event[op]) {
      query[event[op].record] = _[op.replace('_', '')](event[op].value);
    }
  });
  return query;
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { collection } = event
  // 参数验证
  if (!collection) { 
    return { success: false, message: '缺少必要参数: collection' };
  }
  //构建 query
  const QUERY = buildQuery(event)
  try {
    const res = await db.collection(collection).where(QUERY).get()
    if (res.errMsg === 'collection.get:ok') {
      return {
        success: true,
        message: 'collection.get data success',
        data: res.data
      }
    } else {
      return {
        success: false,
        message: 'collection.get data failed',
        data: res
      }
    }
  } catch (e) {
    return {
      success: false,
      message: 'collection.get data error',
      data: e
    }
  }
}