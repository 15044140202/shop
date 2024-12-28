  //根据订单号获取 订单日期
  function getOrderFormDate(orderFormNum) {
    const firstNum = orderFormNum.search(/\d/);
    const DateStr = orderFormNum.slice(firstNum, firstNum + 8);
    const date = DateStr.slice(0, 4) + '年' + DateStr.slice(4, 6) + '月' + DateStr.slice(6) + '日'
    console.log(date)
    return date;
  }
  //获取当前时间
  function getNowTime(p_time) {
    var now = p_time === undefined ? new Date() : p_time;
    // 格式化时间为 "YYYY/MM/DD-HH:mm:ss"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const nowTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    return nowTime;
  }
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
      originalTbaleIndex,
      toTableIndex,
      orderNum,
      orderEndTime,
      userOpenid,
      userName
    } = event;
    // 设置时区为亚洲/上海
    process.env.TZ = 'Asia/Shanghai';
    //修改商户桌台信息 原桌台置空 目标桌台添加数据
    const res = await db.collection('shopAccount').where({
      shopFlag: shopFlag,
    }).update({
      data: {
        [`shop.tableSum.${originalTbaleIndex}.orderForm`]: _.set(''),
        [`shop.tableSum.${originalTbaleIndex}.orderEndTime`]:  _.set(''),
        [`shop.tableSum.${toTableIndex}.orderForm`]: orderNum,
        [`shop.tableSum.${toTableIndex}.orderEndTime`]: orderEndTime,
      }
    })
    //修改店铺账单信息  并追加换台日志
    const date = getOrderFormDate(orderNum)
    const nowTime = getNowTime();
    const orderRes = await db.collection('orderForm').where({
      shopFlag: shopFlag,
      [date]: {
        orderNum: orderNum
      }
    }).update({
      data: {
        [`${date}.$.tableNum`]: toTableIndex + 1,
        [`${date}.$.log`]: _.push(`${nowTime}${userName}${originalTbaleIndex+1}号台>${toTableIndex}号台---换台`)
      }
    })
    //修改用户信息里面的 桌台号码
    const result = await db.collection('userInfo').where({
      _openid: userOpenid,
    }).update({
      data: {
        [`userInfo.orderForm.tableNum`]:toTableIndex + 1
      }
    })
    if (result.stats.updated === 1) {//成功
      return 'ok'
    }else{
      return 'error'
    }
  }