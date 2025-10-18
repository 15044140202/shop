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
      if (query[event[op].record]) {//已有此字段  
        query[event[op].record] =  _.and(query[event[op].record], _[op.replace('_', '')](event[op].value));
      }else{
        query[event[op].record] = _[op.replace('_', '')](event[op].value);
      }
      
    }
  });
  return query;
}
// 云函数入口函数
exports.main = async (event, context) => {
  const { collection} = event
  //构建 query
  const QUERY = buildQuery(event)
  console.log(QUERY)
  let res
  if (QUERY) {
    res = await db.collection(collection).where(QUERY).count()
  } else {
    res = await db.collection(collection).count()
  }
  return res
}