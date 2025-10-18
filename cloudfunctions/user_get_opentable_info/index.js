// 云函数入口文件
const now = new Date()
const newVipInfo = {
  amount: 0,
  coupon: [],
  firstStorage: true,
  gender: '男',
  headImage: '',
  integral: 0,
  lastTime: getNowTime(now),
  name: '未修改昵称',
  shopId: '',
  startTime: now.getTime(),
  telephone: '',
  totalCommotidyCost: 0,
  totalTableCost: 0,
  totalTime: 0,
  userOpenid: 0,
}
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
  if (p_date) {
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
// 云函数入口函数
exports.main = async (event, context) => {
  process.env.TZ = 'Asia/Shanghai';
  const wxContext = cloud.getWXContext()
  const user_openid = wxContext.FROM_OPENID
  const { shopId } = event
  const task = []
  newVipInfo.userOpenid = user_openid
  newVipInfo.shopId = shopId
  //0.获取shop_operate_Set
  task.push(db.collection('shop_operate_set').where({
    shopId: shopId
  }).get())
  //1.获取店铺会员级别设置信息
  task.push(db.collection('shop_vip_set').where({
    shopId: shopId
  }).get())
  //2.获取shopInfo
  task.push(db.collection('shop_account').where({
    _id: shopId
  }).get())
  //3.获取shop_charging
  task.push(db.collection('shop_charging').where({
    shopId: shopId
  }).get())
  //4.获取vipInfo
  task.push(
    cloud.callFunction({
      name: 'getOrInsertData',
      data: {
        collection: 'vip_list',
        query: {
          shopId: shopId,
          userOpenid: user_openid
        },
        dataToInsert: newVipInfo
      }
    })
  )
  //5.获取店铺setmeal_Set
  task.push(db.collection('shop_setmeal').where({
    shopId: shopId
  }).get())
  //6.获取店铺shop_integral_set
  task.push(db.collection('shop_integral_set').where({
    shopId: shopId
  }).get())
  //7.获取店铺shop_notice
  task.push(db.collection('shop_notice').where({
    shopId: shopId
  }).get())
  //8.获取店铺shop_table
  task.push(db.collection('shop_table').where({
    shopId: shopId
  }).get())
  //9.获取店铺设备  shop_device
  task.push(db.collection('shop_device').where({
    shopId: shopId
  }).get())
  //10.获取店团购信息
  task.push(db.collection('shop_group_buying').where({
    shopId: shopId
  }).get())
  //11.获取店铺助教信息
  task.push(db.collection('shop_member').where({
    shopId: shopId,
    position:'girl'
  }).get())
  const res = await Promise.all(task)
  return res
}