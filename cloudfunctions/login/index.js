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
// 输入验证函数
function validateInput(event) {
  if (!Array.isArray(event.transactions) || event.transactions.length === 0) {
    throw new Error('Invalid input: transactions array is required and must not be empty');
  }
  event.transactions.forEach(transaction => {
    if (!transaction.collection || !transaction.data) {
      throw new Error('Invalid transaction: collection and data are required');
    }
  });
}

// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database({
  // 该参数从 wx-server-sdk 1.7.0 开始支持，默认为 true，指定 false 后可使得 doc.get 在找不到记录时不抛出异常
  throwOnNotFound: false,
})
const _ = db.command

// 云函数入口函数
exports.main = async (event) => {
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  const wxContext = cloud.getWXContext();

  //初始化集合
  if (event.register === true) {
    console.log("进入到注册环节!")
    //没有注册过  像数据库里面添加用户数据
    // 获取事务对象
    const transaction = await db.startTransaction();
    try {
      // 验证输入
      validateInput(event);
      // 获取事务中的集合引用
      const { transactions } = event
      // 执行插入 店铺信息 操作
      for (let index = 0; index < transactions.length; index++) {
        const element = transactions[index];
        await transaction.collection(element.collection).add({
          data: element.data
        });
      }
      //上商家用户信息里面插入 店铺Id
      await transaction.collection('merchant_info').where({
        _openid: wxContext.OPENID
      }).update({
        data: {
          shopId: _.push({ shopName: transactions[0].data.shopInfo.shopName, shopId: transactions[0].data._id })
        }
      })
      // 提交事务
      await transaction.commit();
      return {
        success: true,
        message: 'Transactions committed successfully'
      };
    } catch (e) {
      console.error(`transaction error`, e)
      return {
        success: false,
        error: e
      }
    }
  } else {
    //获取店铺资料
    const task = []
    for (let index = 0; index < event.transactions.length; index++) {
      const element = event.transactions[index];
      task.push(
        db.collection(element.collection).where({
          [element.data.fieldName]:element.data.fieldData
        }).get()
      )
    }
    try{
      const res = await Promise.all(task)
      return {
        success:true,
        message:'Data found',
        data:res
      }
    }catch(e){
      return {
        success:false,
        message:'get data error',
        data:e
      }
    }
  }
}