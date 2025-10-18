// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
/**
 * @param {string} p_date 
 * @param {string} item  获取时间的格式 hms  为hh:mm:ss  年月日为2024年05月05日格式  其他参数为yy/mm/dd hh:mm:ss
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
  //console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
  if (item === 'hms') {
    return `${hours}:${minutes}:${seconds}`;
  } else if (item === '年月日') {
    return `${year}年${month}月${date}日`
  } else {
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  }
}
async function announcerSendMessage(shopId, toTableNum, oldTableNum) {
  //关台
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: shopId, //此参数可以为  null   announcerId 和 shopFlag  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopFlag  需有一个为非null
      first: '7572',
      tableNum: oldTableNum,
      last: '7580',
      randomNum: new Date().getTime() + shopId.toString() + oldTableNum.toString()
    }
  })
  //开台
  await cloud.callFunction({
    name: 'announcerSendMessage',
    data: {
      shopId: shopId, //此参数可以为  null   announcerId 和 shopFlag  需有一个为非null
      announcerId: undefined, //此参数可以为 null  announcerId 和 shopFlag  需有一个为非null
      first: '7571',
      tableNum: toTableNum,
      last: '7581',
      randomNum: new Date().getTime() + shopId.toString() + toTableNum.toString()
    }
  })
  return
}
// 云函数入口函数
exports.main = async (event, context) => {
  // 设置时区为亚洲/上海 
  process.env.TZ = 'Asia/Shanghai';
  const { toTableVersion, orderInfo, orderEndTime, toTableNum } = event
  const transaction = await db.startTransaction()
  //判断 如果新桌台核老桌台 桌台号一样 则不执行换台
  if (orderInfo.tableNum === toTableNum) {
    return {
      success: false,
      message: `新桌台与旧桌台一致,不能换台`,
      data:'',
    }
  } 
  try {
    //更改新新桌台信息
    const newTRes = await transaction.collection('shop_table').where({
      shopId: orderInfo.shopId,
      tableNum: toTableNum
    }).update({
      data: {
        orderForm: orderInfo.orderNum,
        closeTableTime: orderEndTime,
        ONOFF: 1,
        version: _.inc(1)
      },
      condition: _.eq('version', toTableVersion)
    })
    if (newTRes.stats.updated === 1) {
      //设置老桌台信息
      await transaction.collection('shop_table').where({
        shopId: orderInfo.shopId,
        tableNum: orderInfo.tableNum
      }).update({
        data: {
          orderForm:_.set(""),
          closeTableTime: _.set(0),
          ONOFF:_.set(0),
        }
      })
      //修改账单信息
      await transaction.collection('table_order').where({
        orderNum: orderInfo.orderNum
      }).update({
        data: {
          tableNum: toTableNum,
          log: _.push(`${getNowTime()}---${orderInfo.tableNum}号台换${toTableNum}号台.${orderInfo.userName}`),
        }
      })
      //提交事务
      await transaction.commit()
      //换台播报器
      console.log('播报')
      await announcerSendMessage(orderInfo.shopId, toTableNum, orderInfo.tableNum)
      console.log('完成!')
      return {
        success: true,
        message: `change table_order success`
      }
    } else {
      await transaction.rollback()
      return {
        success: false,
        message: `rollback,桌台被占用`,
        data: { errorCode: -100, message: '桌台被占用或版本号不匹配' },
      }
    }
  } catch (e) {
    // 回滚事务并返回错误信息
    await transaction.rollback();
    console.error('change table error:', e); // 记录错误日志
    return {
      success: false,
      message: `change table error`,
      data: e,
    }
  }
}