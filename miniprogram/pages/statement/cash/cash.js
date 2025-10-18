//import uCharts from '../../../components/ucharts/u-charts';
//var uChartsInstance = {};
const app = getApp();
const appData = app.globalData;
const zxUtils = require('../../../utils/zx')
Page({
  data: {
    name: '',
    disPlayOrderForm: '',
    chartData: []
  },
  disposeOrderInfo() {
    const totalOrder = this.data.disPlayOrderForm;
    if (totalOrder.length === 0) return
    const newOrder = [];
    for (let index = 0; index < totalOrder.length; index++) {
      const element = totalOrder[index];
      if (this.data.name === 'cash') { //现金
        if (element.payMode.includes('现金') || (element.payMode.includes('cash') && element.payMode !== 'card&cashCoupon' && element.payMode !== 'wx&cashCoupon')) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'wx') { //微信
        if (element.payMode.includes('微信') || element.payMode.includes('wx')) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'vip') { //会员卡
        if (element.payMode.includes('会员卡') || element.payMode.includes('card')) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'cashCoupon') { //代金券
        if (['cashCoupon', 'coupon', 'wx&cashCoupon', 'card&cashCoupon', 'wx&coupon', 'card&coupon', '微信&代金券', '会员卡&代金券', '代金券', '未知支付方式'].includes(element.payMode)) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'mtCoupon') { //美团券
        if (element.payMode.includes('美团券') || element.payMode.includes('mtCoupon')) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'dyCoupon') { //抖音券
        if (element.payMode.includes('抖音券') || element.payMode.includes('dyCoupon')) {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'tableCost') { //桌台费
        if ((element.orderName === '自助开台订单' || element.orderName === '店员开台订单' || element.orderName === '自助套餐订单') && element.endTime !== '未结账') {
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'commotidyCost') { //商品单
        if (element.orderName === '商品单') {
          element.time = app.getNowTime(new Date(element.time))
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'top_up') { //储值单
        if (element.orderName === '储值单' && element.payMode !== '未支付') {
          element.time = app.getNowTime(new Date(element.time))
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'sportShowCost') { //精彩秀单
        if (element.orderName === '精彩秀单') {
          element.time = app.getNowTime(new Date(element.time))
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      } else if (this.data.name === 'girlCost') { //助教单
        if (element.orderName === '助教订单') {
          element.time = app.getNowTime(new Date(element.time))
          newOrder.push({ ...element, disPlay: true })
        } else {
          newOrder.push({ ...element, disPlay: false })
        }
      }
    }
    this.setData({
      disPlayOrderForm: newOrder
    })
  },
  
  onLoad: function (options) {
    console.log(options)
    console.log(appData.disPlayOrderForm)
    if (options.item === 'wx' || options.item === 'cash') {
      this.setData({
        name: options.item,
        chartData:[
          {name:'微信',amount:parseInt(options.wx),color:zxUtils.PIE_COLOR_ARR[2]},
          {name:'会员卡',amount:parseInt(options.card),color:zxUtils.PIE_COLOR_ARR[0]},
          {name:'代金券',amount:parseInt(options.coupon),color:zxUtils.PIE_COLOR_ARR[1]},
          {name:'现金',amount:parseInt(options.cash),color:zxUtils.PIE_COLOR_ARR[3]}
        ],
        cardCost: parseInt(options.card),
        wxCost: parseInt(options.wx),
        couponCost: parseInt(options.coupon),
        cashCost: parseInt(options.cash),
        disPlayOrderForm: appData.disPlayOrderForm
      })
    } else if (['vip', 'cashCoupon', 'mtCoupon', 'dyCoupon', 'ksCoupon'].includes(options.item)) {
      this.setData({
        name: options.item,
        chartData:[
          {name:'会员卡',amount:parseInt(options.card),color:zxUtils.PIE_COLOR_ARR[0]},
          {name:'代金券',amount:parseInt(options.cashCouponCost),color:zxUtils.PIE_COLOR_ARR[1]},
          {name:'美团券',amount:parseInt(options.mtCouponCost),color:zxUtils.PIE_COLOR_ARR[2]},
          {name:'抖音券',amount:parseInt(options.dyCouponCost),color:zxUtils.PIE_COLOR_ARR[3]},
          {name:'快手券',amount:parseInt(options.ksCouponCost),color:zxUtils.PIE_COLOR_ARR[4]}
        ],
        disPlayOrderForm: appData.disPlayOrderForm
      })
    } else if (['tableCost', 'commotidyCost', 'top_up', 'couponCost', 'sportShowCost', 'girlCost'].includes(options.item)) {
      this.setData({
        name: options.item,
        chartData:[
          {name:'桌台费',amount:parseInt(options.tableCost),color:zxUtils.PIE_COLOR_ARR[0]},
          {name:'商品费',amount:parseInt(options.commotidyCost),color:zxUtils.PIE_COLOR_ARR[1]},
          {name:'储值',amount:parseInt(options.top_up),color:zxUtils.PIE_COLOR_ARR[2]},
          {name:'优惠券',amount:parseInt(options.couponCost),color:zxUtils.PIE_COLOR_ARR[3]},
          {name:'精彩秀',amount:parseInt(options.sportShowCost),color:zxUtils.PIE_COLOR_ARR[4]},
          {name:'助教费',amount:parseInt(options.sportShowCost),color:zxUtils.PIE_COLOR_ARR[5]}
        ],
        disPlayOrderForm: appData.disPlayOrderForm
      })
    }
    this.disposeOrderInfo()
    //console.log(app.globalData.TodayDataObj)
  },
  onReady() {

  },
  goto(e) {
    wx.navigateTo({
      url: `../../statement/orderForm/orderFormInfo/orderFormInfo?index=${e.mark.index}`,
    })
  },
  tap(e) {
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
  }
})