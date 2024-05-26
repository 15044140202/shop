// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async () => {
  let now = new Date();
  let yesterday = new Date(now.getTime() - 16 * 60 * 60 * 1000);
  let today = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  // 格式化日期为 YYYY-MM-DD
  let formatted_yesterday = `${yesterday.getFullYear()}年${String(yesterday.getMonth() + 1).padStart(2, '0')}月${String(yesterday.getDate()).padStart(2, '0')}日`;
  let formatted_today = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`;

  //处理昨天数据
  const yesterday_res = await db.collection('orderForm').where({
    date: formatted_yesterday
  }).get();
  if (yesterday_res.errMsg === "collection.get:ok") { //调用成功!
    const yesterday_data = yesterday_res.data
    for (let index = 0; index < yesterday_data.length; index++) { //每个店铺的昨日数据
      const element = yesterday_data[index];
      const orderForm = element.orderForm;
      const shopFlag = element.shopFlag;
      for (let i = 0; i < orderForm.length; i++) {
        const e = orderForm[i];
        if (e.orderName === "自助开台订单" || e.orderName === "店员开台订单") {
          if (e.endTime === "未结账") { //只处理未结账订单
            //判断是否到时间
            const nowTime = new Date().getTime() + 8 * 60 * 60 * 1000;
            const orderTime = new Date(e.startTime).getTime() + 1000 * 60 * 60 * (e.cashPledge / e.price)
            if (nowTime >= orderTime) { //到时间的单子
              var newOrderForm = e;
              newOrderForm.endTime = new Date(orderTime).toLocaleString("en", {
                hour12: false
              });
              newOrderForm.tableCost = newOrderForm.cashPledge;
              newOrderForm.payMode = '自动结算';
              newOrderForm.log.push(`${new Date(orderTime).toLocaleString("en",{hour12:false})}${newOrderForm.openPerson.openPersonName}---自动结算`)
              //修改订单数据
              await db.collection('orderForm').where({
                shopFlag: shopFlag,
                date: formatted_yesterday
              }).update({
                data: {
                  [`orderForm.${i}`]: newOrderForm
                }
              })
              //修改桌台数据
              await db.collection('shopAccount').where({
                shopFlag: shopFlag,
              }).update({
                data: {
                  [`shop.tableSum.${newOrderForm.tableNum - 1}.orderForm`]: ''
                }
              })
            } else { //没到时间的

            }
          }
        }
      }
    }
  }
  //处理今天数据
  const today_res = await db.collection('orderForm').where({
    date: formatted_today
  }).get();
  if (today_res.errMsg === "collection.get:ok") { //调用成功!
    const today_data = today_res.data
    for (let index = 0; index < today_data.length; index++) { //每个店铺的昨日数据
      const element = today_data[index];
      const orderForm = element.orderForm;
      const shopFlag = element.shopFlag;
      for (let i = 0; i < orderForm.length; i++) {
        const e = orderForm[i];
        if (e.orderName === "自助开台订单" || e.orderName === "店员开台订单") {
          if (e.endTime === "未结账") { //只处理未结账订单
            //判断是否到时间
            const nowTime = new Date().getTime() + 8 * 60 * 60 * 1000;
            const orderTime = new Date(e.startTime).getTime() + 1000 * 60 * 60 * (e.cashPledge / e.price)
            if (nowTime >= orderTime) { //到时间的单子
              var newOrderForm = e;
              newOrderForm.endTime = new Date(orderTime).toLocaleString("en", {
                hour12: false
              });
              newOrderForm.tableCost = parseInt(newOrderForm.cashPledge);
              newOrderForm.commotidyCost = parseInt(newOrderForm.commotidyCost)
              newOrderForm.log.push(`${new Date(orderTime).toLocaleString("en",{hour12:false})}${newOrderForm.openPerson.openPersonName}---自动结算`)
              newOrderForm.payMode = '自动结算';
              //修改订单数据
              await db.collection('orderForm').where({
                shopFlag: shopFlag,
                date: formatted_today
              }).update({
                data: {
                  [`orderForm.${i}`]: newOrderForm
                }
              })
              //修改桌台数据
              await db.collection('shopAccount').where({
                shopFlag: shopFlag,
              }).update({
                data: {
                  [`shop.tableSum.${newOrderForm.tableNum - 1}.orderForm`]: ''
                }
              })
            } else { //没到时间的

            }
          }
        }
      }
    }
  }

  return 'ok'
}