// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const {collection,shopFlag,date} = event;
  await cloud.callFunction({//处理账单数据函数 
    name:'autoClear',
    data:{}
  })

  if (shopFlag === ''){
    return 'shopFlag不能为空';
  }else if(date === ''){
    return 'date不能为空!';
  }
  var data = [];
  while (data.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection(collection).where({
     shopFlag:shopFlag,
     date:date
    }).get()
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
        await db.collection(collection).add({
        data:{
          shopFlag:shopFlag,
          date:date,
          orderForm: []
        }
      })
    } else {
      return res.data[0];
    }
  }
}