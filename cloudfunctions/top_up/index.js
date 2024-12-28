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
    firstStorage,
    shopFlag,
    orderForm
  } = event;
  //获取现在 北京时间*******************
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  // 获取当前的北京时间
  const now = new Date();
  // 格式化时间为 "YYYY/MM/DD-HH:mm:ss"
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const nowTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  //增加订单
  const date = nowTime.split(' ')[0].split('/')[0] + '年' + nowTime.split(' ')[0].split('/')[1] + '月' + nowTime.split(' ')[0].split('/')[2] + '日';
  const result = await db.collection('orderForm').where({
    shopFlag: shopFlag,
  }).update({
    data: {
      [date]: _.push({
        ...orderForm,
        time: nowTime
      })
    }
  })
  if (result.stats.updated === 1) {
    const tasks =[];
    //修改支付检测订单  为payEnd
    const res_1 = db.collection('payOrderList').where({
      orderList: {
        payOrderNum: orderForm.orderNum,
      }
    }).update({
      data: {
        [`orderList.$.payState`]: 'payEnd'
      }
    })
    tasks.push(res_1);
    //修改会员余额  积分 余额变动记录
    const res_2 = db.collection('vipList').where({
      shopFlag: shopFlag,
      vipList: {
        userOpenid: orderForm.person.openid
      }
    }).update({
      data: {
        'vipList.$.integral': _.inc(orderForm.integral),
        'vipList.$.amountChange': _.push({
          'amount': orderForm.amount + orderForm.giveAmount,
          'reason': '储值',
          'status': '自助充值',
          'time': nowTime
        }),
        'vipList.$.amount': _.inc(orderForm.amount + orderForm.giveAmount),
        'vipList.$.firstStorage': _.set(firstStorage),
        'vipList.$.totalTableCost': _.inc(orderForm.amount)
      }
    })
    tasks.push(res_2)
    //向userInfo 添加账单信息
    const res_3 = db.collection('userInfo').where({
      _openid: orderForm.person.openid
    }).update({
      data: {
        ['orderList']: _.push({
          orderName: '储值单',
          orderNum: orderForm.orderNum,
          shopFlag: shopFlag,
          time: nowTime,
          pledgeMode: orderForm.payMode,
          cashPledge: orderForm.amount
        })
      }
    })
    tasks.push(res_3)
    const RES = await Promise.all(tasks)

    return 'ok';
  } else { //添加订单失败  
    return 'error';
  }
}