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
    shopFlag,
    date,
    propertyName,
    property
  } = event;
  await cloud.callFunction({ //处理账单数据函数 
    name: 'autoClear',
    data: {}
  })

  if (shopFlag === '') {
    return 'shopFlag不能为空';
  } else if (date === '') {
    return 'date不能为空!';
  }
  var data = [];
  while (data.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection(collection).where({
      shopFlag: shopFlag
    }).field({
      [date]: true,
      shopFlag: true
    }).get()
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection(collection).add({
        data: {
          shopFlag: shopFlag,
          [date]: []
        }
      })
    } else {
      //判断有无今日数据
      if (!(date in res.data[0])) { //如果没有今日数据  则创建
        await db.collection(collection).where({
          shopFlag: shopFlag
        }).update({
          data: {
            [date]: [],
          }
        })
      } else {
        if (property === 'null') { //无查询条件  返回全部数据
          return res.data[0];
        } else { //根据条件索引 返回找到的数据  没有找到 返回 []
          const targetMember = res.data[0][date].find(member => member[propertyName] === property);
          if (targetMember) { //返回找到的数据
            return targetMember;
          } else { //返回 []
            return null;
          }
        }
      }

    }
  }
}