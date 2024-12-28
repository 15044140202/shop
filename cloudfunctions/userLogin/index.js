// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.FROM_OPENID
  const userInfo = ''
  while (userInfo === '') {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection('userInfo').where({
      _openid: openid
    }).get()
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
        await db.collection('userInfo').add({
        data: {
         _openid:openid,
         userInfo:{
            shopInfo:[],
            headImage:'',
            name:'未修改昵称',
            gender:'男',
            birthday:'',
            telephone:'',
            orderForm:{}
         }
        }
      })
    } else {
      return {
        openid:openid,
        userInfo:res.data[0].userInfo,
        orderList:res.data[0].orderList
      }
    }
  }
}