// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;

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
async function getDatabaseRecord_fg(event) {
  const {
    collection,
    record,
    shopFlag
  } = event;
  var data = [];
  while (data.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection(collection).where({
      shopFlag: shopFlag
    }).get()
    if (res.data.length === 0 && record != 'all') { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection(collection).add({
        data: {
          shopFlag: shopFlag,
          [record]: record === 'integral' || record === 'operateSet' || record === 'luckSudoku' ? {} : []
        }
      })
    } else {
      if (record === 'all') { //如果获取全部数据  则直接返回全部数据
        return res.data[0]
      } else {
        if (record in res.data[0]) {
          return res.data[0][record];
        } else { //没有此 字段自动添加
          await db.collection(collection).where({
            shopFlag: shopFlag
          }).update({
            data: {
              [record]: record === 'integral' || record === 'operateSet' || record === 'luckSudoku' ? {} : []
            }
          })
        }
      }
    }
  }
}
async function getUserVipInfo(userOpenid, telephone, name, image, shopFlag) {
  //首先获取这个店的 会员列表
  var vipList = await getDatabaseRecord_fg({
    collection: 'vipList',
    record: 'vipList',
    shopFlag: shopFlag
  })
  var now = getNowTime();
  const newVipInfo = {
    telephone: telephone,
    userOpenid: userOpenid,
    amount: 0,
    integral: 0,
    coupon: [],
    amountChange: [],
    lastTime: now,
    startTime: now,
    name: name,
    image: image,
    vipLevel: 0,
    totalTableCost: 0,
    totalCommotidyCost: 0,
    totalTime: 0,
  }

  if (vipList.length > 0) {
    for (let index = 0; index < vipList.length; index++) {
      const element = vipList[index];
      if (element.userOpenid === userOpenid) {
        return element;
      } else if (index === vipList.length - 1) { //列表中没有此会员信息  添加会员信息
        await db.collection('vipList').where({
          shopFlag: shopFlag
        }).update({
          data: {
            ['vipList']: _.push(newVipInfo)
          }
        })
        return newVipInfo;
      }
    }
  } else { //此店铺一个会员信息都没有 添加一个
    await db.collection('vipList').where({
      shopFlag: shopFlag
    }).update({
      data: {
        ['vipList']: _.push(newVipInfo)
      }
    })
    return newVipInfo;
  }
}
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlagArray,
    userOpenid,
    userHeadImage,
    userTelephone,
    userName,
    selectShopFlag,
  } = event;
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  var returnData = {};
  //获取多个shopInfo
  const shopInfoArray = [];
  for (let index = 0; index < shopFlagArray.length; index++) {
    const element = shopFlagArray[index];
    const shopInfo = await getDatabaseRecord_fg({
      collection: 'shopAccount',
      record: 'all',
      shopFlag: element
    })
    shopInfoArray.push(shopInfo)
  }
  returnData = {
    ...returnData,
    shopInfo:shopInfoArray
  }
  //获取本人 在所有店铺的 vip数据
  const userVipInfoArray = [];
  for (let index = 0; index < shopFlagArray.length; index++) {
    const element = shopFlagArray[index];
    const vipInfo = await getUserVipInfo(userOpenid, userTelephone, userName, userHeadImage, element)
    userVipInfoArray.push(vipInfo)
  }
  returnData = {
    ...returnData,
    vipInfoOfShop:userVipInfoArray
  }
  //获取店铺的幸运九宫格数据
  const luckSudoku = await getDatabaseRecord_fg({
    collection: 'luckSudoku',
    record: 'luckSudoku',
    shopFlag: selectShopFlag
  })
  returnData = {
    ...returnData,
    luckSudoku:luckSudoku
  }
  return returnData;


}