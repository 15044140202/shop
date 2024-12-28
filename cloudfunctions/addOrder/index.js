// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}); // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag,
    date,
    data
  } = event;

  const result = await db.collection('orderForm').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      [date]: _.push(data)
    }
  })
  
  if (result.stats.updated === 1) {
    //修改 shopAccount 以便触发商家端消息提示
    await db.collection('shopAccount').where({
      shopFlag: shopFlag
    }).update({
      data: {
        changeRandomNum: Math.floor(Math.random() * 10000000000)
      }
    })
    //商品单  喇叭提示配送
    if (data.orderName === '商品单') {
      // console.log('播报信息:' + shopFlag + `--${7570 + newOrderForm.tableNum}--7595---randomNum:` + randomNum)
      await cloud.callFunction({
        name: 'announcerSendMessage',
        data: {
          shopFlag: shopFlag,
          announcerId: null,
          first: `7573`,
          tableNum: `${data.tableNum}`,
          last: `7584`,
          randomNum: (Math.floor(Math.random() * 10000)).toString() + new Date().getTime()
        }
      })
    }

    console.log('添加成功!')
    //添加成功!
    return 'ok'
  } else {
    console.log('添加失败!')
    return 'error'
  }
}