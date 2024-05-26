// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  let {
    register,
    shopInfo,
    shopFlag
  } = event
  const wxContext = cloud.getWXContext()
  //初始化集合
  const db = cloud.database()
  if (register === true) {
    console.log("进入到注册环节!")
    //没有注册过  像数据库里面添加用户数据
    const res = await db.collection("shopAccount").add({
      data: {
        _openid: wxContext.OPENID,
        shopFlag: shopFlag,
        appid: wxContext.APPID,
        telephone: shopInfo.telephone,
        logoId: '1',
        proceedsAccount: '',
        massageSum: '',
        shop: {
          shopName: shopInfo.shopName,
          shopAdd: shopInfo.shopAdd,
          openTime: '',
          closeTime: '',
          foundTime: '',
          intro: '',
          lightId: '',
          member: [], //店员 后续添加   根据{openid:'',position:''} 进行鉴权
          tableSum: [{
            tableNum: '1',
            tableName: '预览桌台',
            chargingFlag: '',
            orderForm:'',
            useEndTime: new Date().toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai'
            })
          }]
        }
      }
    })
    if(res.errMsg === "collection.add:ok"){
      return shopFlag
    }else{
      return 'error'
    }
  } else {
    //获取店铺资料

  }
}