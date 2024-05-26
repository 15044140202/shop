// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const {
    collection,
    record,
    shopFlag
  } = event;
  var data = [];
  while (data.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection(collection).where({
      shopFlag: shopFlag
    }).get()
    if (res.data.length === 0 && record != 'all') { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection(collection).add({
        data: {
          shopFlag: shopFlag,
          [record]: record === 'integral' || record === 'operateSet' ? {} :  []
        }
      })
    } else {
      if (record === 'all') { //如果获取全部数据  则直接返回全部数据
        return res.data[0]
      } else {
        if (record in res.data[0]) {
          return res.data[0][record];
        } else { //没有此 字段自动添加
          await db.collection(collection).where({
            shopFlag: shopFlag
          }).update({
            data: {
              [record]: record === 'integral' ? {} : []
            }
          })
        }
      }
    }
  }
}