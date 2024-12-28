  /**
   * 
   * @param {string} p_date 
   * @param {string} item  获取时间的格式 hms  为hh:mm:ss  其他参数为yy/mm/dd hh:mm:ss
   */
  function getNowTime(p_date, item) {
    // 获取当前时间
    var now = new Date();
    if (p_date !== undefined) {
      now = p_date;
    }
    // 分别获取年、月、日、时、分、秒，并转换为数字
    const year = now.getFullYear();
    var month = now.getMonth() + 1; // 月份从0开始，需要加1
    var date = now.getDate();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    // 如果需要，可以添加前导零以确保总是两位数
    month = month < 10 ? '0' + month : month;
    date = date < 10 ? '0' + date : date;
    hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    // 返回组合成只包含数字的字符串
    console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
    if (item === 'hms') {
      return `${hours}:${minutes}:${seconds}`;
    } else {
      return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
    }
  }
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
    // 设置时区为亚洲/上海
    process.env.TZ = 'Asia/Shanghai';
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
            member: [], //店员 后续添加   根据{openid:'',position:''} 进行鉴权
            tableSum: [{
              tableNum: '1',
              tableName: '预览桌台',
              chargingFlag: '',
              orderForm: '',
              useEndTime: getNowTime()
            }]
          }
        }
      })
      if (res.errMsg === "collection.add:ok") {
        return shopFlag
      } else {
        return 'error'
      }
    } else {
      //获取店铺资料

    }
  }