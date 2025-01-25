// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 输入验证函数
function validateInput(event) {
  if (!event.collection || !event.dataToInsert) {
    throw new Error('Invalid input: collection and dataToInsert are required');
  }
}

// 设置默认 _openid
function setDefaultOpenid(query, wxContext) {
  const _openid = wxContext.OPENID;
  if ('_openid' in query && !query._openid) {
    query._openid = _openid;
  }
  return query;
}

// 插入数据函数
async function insertData(collection, dataToInsert) {
  try {
    const result = await db.collection(collection).add({ data: dataToInsert });
    if (result.errMsg !== 'collection.add:ok') {
      throw new Error(`Failed to insert data: ${JSON.stringify(result)}`);
    }
    return { success: true, message: 'Data inserted', data: dataToInsert };
  } catch (err) {
    //logger.error('Error inserting data:', err);
    throw err;
  }
}

// 查询数据函数
async function queryData(collection, query) {
  try {
    const result = await db.collection(collection).where(query).get();
    if (result.errMsg !== 'collection.get:ok') {
      throw new Error(`Failed to query data: ${JSON.stringify(result)}`);
    }
    return result;
  } catch (err) {
    //logger.error('Error querying data:', err);
    throw err;
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 验证输入
    validateInput(event);

    // 初始化上下文
    const wxContext = cloud.getWXContext();
    let { collection, query, dataToInsert } = event;

    // 设置默认 _openid
    query = setDefaultOpenid(query, wxContext);
    if ("_openid" in query) {
      dataToInsert._openid = query._openid;
    }

    // 查询数据
    const queryResult = await queryData(collection, query);

    // 处理查询结果
    if (queryResult.data.length > 0) {
      // 数据存在，返回数据
      return {
        success: true,
        message: 'Data found',
        data: queryResult.data
      };
    } else {
      // 数据不存在，插入新数据
      return await insertData(collection, dataToInsert);
    }
  } catch (err) {
    // 返回详细的错误信息
    return {
      success: false,
      message: 'Error occurred',
      error: err.message || 'Unknown error'
    };
  }
}