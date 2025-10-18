const app = getApp()
const appData = app.globalData
const zxUtils = require('../../utils/zx.js')

async function reSelectOrderGroupBuy(that, GPOdata) {
  const thisTable = that.data.shop_table[that.data.optNum - 1]
  const thisOrder = that.data.orderForm.find((item) => item.orderNum === thisTable.orderForm)
  if (!thisTable || !thisOrder) {
    app.showModal('提示','重选此桌台团购类型失败,请重进小程序后重试!')
    return
  }
  const res = await app.callFunction({
    name:'reselect_order_group_buying',
    data:{
      shop_table:thisTable,
      order:thisOrder,
      groupBuyData:GPOdata
    }
  })
  if (!res.success) {
    app.showModal('提示','操作失败!')
    return
  }
  that.data.orderForm.length = 0
  thisTable.groupBuyInspection = true
  that.setData({
    shop_table:that.data.shop_table
  })
  //刷新
  that.refreshTableState(that.data.shop_table)
}
/**
 * @description 获取所选桌台的团购券code
 * @returns {string} 团购券code
 */
function getTableGroupBuyInfo(that) {
  const thisTableorderForm = that.data.shop_table[that.data.optNum - 1].orderForm
  const allOrder = that.data.orderForm
  const thisOrder = allOrder.find(item => item.orderNum === thisTableorderForm)
  if (thisOrder) {
    return {
      groupBuyType: thisOrder?.groupBuyType || '',
      groupBuyInspection: thisOrder?.groupBuyInspection || false,
      groupBuyCode: thisOrder?.groupBuyCode ? zxUtils.formatByLoop(thisOrder.groupBuyCode) : ''
    }
  }
  return ""
}
/**
 * @description 获取所有桌台的全部 团购套餐
 * @returns {array} //所有桌台套餐 数组
 */
function getTableGroupBuying(that, gbInfo) {
  //所选桌台
  const table = that.data.shop_table[that.data.optNum - 1]
  console.log(table)
  //先获取所选桌台 绑定的套餐
  const tableCharging = that.data.shop_charging.find(item => item._id === table.chargingId)
  console.log(tableCharging)
  //获取所选桌台 绑定的所有团购信息
  const tableGroupBuying = that.data.shop_group_buying.reduce((acc, item) => {
    if (item.bindChargingId === tableCharging._id && item.groupBuyType === gbInfo.groupBuyType) {
      acc.push(item)
    }
    return acc
  }, [])
  console.log(tableGroupBuying)
  return tableGroupBuying
}
/**
 * @description 弹出选定桌台 套餐列表 供选择
 * @param {Object} that  上一个页面的 this
 */
function groupBuySelectShow(that) {
  //所选桌台
  const table = that.data.shop_table[that.data.optNum - 1]
  console.log(table)
  //先获取所选桌台 绑定的套餐
  const tableCharging = that.data.shop_charging.find(item => item._id === table.chargingId)
  console.log(tableCharging)
  //获取所选桌台 绑定的所有团购信息
  const tableGroupBuying = that.data.shop_group_buying.reduce((acc, item) => {
    if (item.bindChargingId === tableCharging._id) {
      acc.push(item)
    }
    return acc
  }, [])
  console.log(tableGroupBuying)
  if (tableGroupBuying.length === 0) {
    app.showModal('提示', '所选桌台没有绑定团购信息!')
    return
  }
  that.setData({
    GPOshow: true,
    longPressShow: false,
    GPOdata: tableGroupBuying
  })
}
//获取团购code 
async function getCode(item) {
  if (item === 'mtCoupon') {
    const res = await wx.scanCode({ scanType: ['qrCode'] })
    console.log(res)
    if (res.errMsg === 'scanCode:ok' && res.scanType === 'QR_CODE' && res.result) {
      return res.result
    }
    throw '扫描团购券失败!---ERROR'
  } else {//抖音快手 输入验券码
    const res = await wx.showModal({
      title: '请输入团购券',
      editable: true,
      placeholderText: '请输入团购券码',
    })
    console.log(res)
    if (!res.confirm) {
      throw '取消-输入团购券码---ERROR'
    }
    return res.content
  }

}
//团购券开台
async function groupBugOpenTable(that, shop_group_buying) {
  const now = new Date(); //下单时间种子
  //构造订单
  const order = {
    orderNum: app.createOrderNum(now, 'W'), //订单编号
    price: shop_group_buying.price, //套餐价格
    couponAmount: 0,
    cashPledge: shop_group_buying.price,
    pledgeMode: shop_group_buying.groupBuyType,
    setmealTimeLong: shop_group_buying.timeLong,
    endTime: '未结账',
    commotidyCost: 0,
    integral: 0,
    joinCost: 0,
    orderName: '自助套餐订单',
    payMode: '未结账',
    pledgeState: 1,//0未支付 1已支付
    shopId: appData.shop_account._id,
    tableNum: that.data.optNum,
    time: now.getTime(),
    userName: appData.status,
    userOpenid: appData.merchant_info._openid,
    log: [`${app.getNowTime(now)}---开台.押金${shop_group_buying.price}元`],
    groupBuyType: shop_group_buying.groupBuyType,
    groupBuyCode: await getCode(),
    tableCost: 0,
  }
  console.log(order)
  //下单
  const placeOrderRes = await that.placeOrder(order)
  console.log({ '下单结果': placeOrderRes })
  if (!placeOrderRes.success) {
    app.showToast('下单失败!', 'error')
  }
  that.setData({
    GPOshow: false,
    GPOdata: []
  })
  //开灯
  app.lightCtrl(order.tableNum, '1').then(res => {
    app.showToast('开台成功!')
  })
}

module.exports = {
  zxUtils,
  groupBuySelectShow,
  groupBugOpenTable,
  getTableGroupBuying,
  getTableGroupBuyInfo,
  reSelectOrderGroupBuy
}