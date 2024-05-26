// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const {collection,record,arrayFlag,data} = event; //合集名称   数组型字段名称  数组里面的标志  新成员数据
  const result = await db.collection(collection).where({
    [record]:{
       [arrayFlag]: data[arrayFlag]
    }
  }).update({
    data: {
     [ `${record}.$`]: data
    }
  })
  if (result.stats.updated === 1) {
    //添加成功!
    return 'ok';
  } else {
    return 'error';
  }
}