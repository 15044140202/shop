// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
const _ = db.command;
// 云函数入口函数
exports.main = async (event) => {
  const {shopFlag,tableDataArray,orderNum,amount,payTime} = event;
  //修改桌台剩余使用时间
  var tableData = {}
  var totalTableNum = ''
  for (let index = 0; index < tableDataArray.length; index++) {
    const element = tableDataArray[index];
    tableData = {
      ...tableData,
      [`shop.tableSum.${element.tableIndex}.useEndTime`]:element.useEndTime
    }
    if (index === tableDataArray.length - 1) {
      totalTableNum = totalTableNum +(element.tableIndex+1).toString() +"号台"
    }else{
      totalTableNum = totalTableNum +(element.tableIndex+1).toString() +"号台|"
    }
  }
  const res = await db.collection('shopAccount').where({
    shopFlag:shopFlag
  }).update({
    data:{
      ...tableData,
      order:_.push({orderNum:orderNum,date:payTime,amount:amount,tableNum:totalTableNum})
    }
  })
  if (res.stats.updated === 1) {
    return 'ok'
  }else{
    return 'error'
  }
}