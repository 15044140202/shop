// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
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
  const wxContext = cloud.getWXContext()
  const { skip, limit, collection, query, orderBy } = event
  console.log(event)
  //构建 query
  const QUERY = buildQuery(event)
  try {
    const count = await db.collection(collection).where(QUERY).count()
    let result
    if (orderBy) {
      result = await db.collection(collection).where(QUERY).orderBy(orderBy.split('|')[0], orderBy.split('|')[1]).skip(skip).limit(limit).get()
    } else {
      result = await db.collection(collection).where(QUERY).skip(skip).limit(limit).get()
    }
    if (result.errMsg === 'collection.get:ok') {
      return {
        success: true,
        message: 'fetchData success',
        data: result,
        count: count
      }
    } else {
      return {
        success: false,
        message: 'fetchData false',
        data: result
      }
    }
  } catch (e) {
    return {
      success: false,
      message: 'fetchData Error',
      data: e
    }
  }
}