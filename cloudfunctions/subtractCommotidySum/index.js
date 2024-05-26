// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag,
    commotidyInfo
  } = event; //commotidyInfo 数据格式为  {class:number,index:number,sum:number} 型数组    对应为 商品分类的数组下表   商品的数组下表  减去商品的数量
  for (let index = 0; index < commotidyInfo.length; index++) {
    const element = commotidyInfo[index];
    const res = await db.collection('commotidy').where({
      shopFlag: shopFlag
    }).update({
      data:{
        [`commotidy.${element.class.toString()}.commotidy.${element.index.toString()}.sum`]: _.inc(- parseInt(element.sum))
      }
    })
    if (res.stats.updated === 1) {//更新成功
      
    }else{
      return {
        state:'error',
        element
      }
    }
  }
  return 'ok'
}