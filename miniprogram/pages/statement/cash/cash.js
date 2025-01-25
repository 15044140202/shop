import uCharts from '../../../components/ucharts/u-charts';
var uChartsInstance = {};
const app = getApp();
const appData = app.globalData;
Page({
  data: {
    cWidth: 750,
    cHeight: 500,

    name: '',

    disPlayOrderForm: '',

  },
  disposeOrderInfo() {
    const totalOrder = this.data.disPlayOrderForm;
    const newOrder = [];
    for (let index = 0; index < totalOrder.length; index++) {
      const element =JSON.parse(totalOrder[index]) ;
      if (this.data.name === 'cash') { //现金
        if (element.payMode.includes('现金') || element.payMode.includes('cash')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'wx') { //微信
        if (element.payMode.includes('微信') || element.payMode.includes('wx')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'vip') { //会员卡
        if (element.payMode.includes('会员卡') || element.payMode.includes('card')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'cashCoupon') { //代金券
        if (element.payMode.includes('代金券') || element.payMode.includes('coupon')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'mtCoupon') { //美团券
        if (element.payMode.includes('美团券') || element.payMode.includes('mtCoupon')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'dyCoupon') { //抖音券
        if (element.payMode.includes('抖音券') || element.payMode.includes('dyCoupon')) {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'tableCost') { //桌台费
        if ((element.orderName === '自助开台订单' || element.orderName === '店员开台订单' || element.orderName === '自助套餐订单') && element.endTime !== '未结账') {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      } else if (this.data.name === 'commotidyCost') { //商品单
        if (element.orderName === '商品单') {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      }else if (this.data.name === 'top_up') { //储值单
        if (element.orderName === '储值单') {
          element.time = app.getNowTime(new Date(element.time))
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      }else if (this.data.name === 'sportShowCost') { //精彩秀单
        if (element.orderName === '精彩秀单') {
          newOrder.push({...element,disPlay:true})
        }else{
          newOrder.push({...element,disPlay:false})
        }
      }
    }
    this.setData({
      disPlayOrderForm:newOrder
    })
  },
  onLoad: function (options) {
    console.log(appData.disPlayOrderForm)
    if (options.item === 'wx' || options.item === 'cash') {
      this.setData({
        name: options.item,
        cardCost: parseInt(options.card),
        wxCost: parseInt(options.wx),
        couponCost: parseInt(options.coupon),
        cashCost: parseInt(options.cash),
        disPlayOrderForm:appData.disPlayOrderForm
      })
    } else if (options.item === 'vip' || options.item === 'cashCoupon' || options.item === 'mtCoupon' || options.item === 'dyCoupon') {
      this.setData({
        name: options.item,
        cardCost: parseInt(options.card),
        cashCouponCost: parseInt(options.cashCouponCost),
        mtCouponCost: parseInt(options.mtCouponCost),
        dyCouponCost: parseInt(options.dyCouponCost),
        disPlayOrderForm: appData.disPlayOrderForm
      })
    } else if (options.item === 'tableCost' || options.item === 'commotidyCost' || options.item === 'top_up' || options.item === 'couponCost' || options.item === 'sportShowCost') {
      this.setData({
        name: options.item,
        tableCost: parseInt(options.tableCost),
        commotidyCost: parseInt(options.commotidyCost),
        top_up: parseInt(options.top_up),
        couponCost: parseInt(options.couponCost),
        sportShowCost: parseInt(options.sportShowCost),
        disPlayOrderForm: appData.disPlayOrderForm
      })
    }
    this.disposeOrderInfo()
    //这里的第一个 750 对应 css .charts 的 width
    const cWidth = 750 / 750 * wx.getSystemInfoSync().windowWidth;
    //这里的 500 对应 css .charts 的 height
    const cHeight = 500 / 750 * wx.getSystemInfoSync().windowWidth;
    this.setData({
      cWidth,
      cHeight
    });
    this.getServerData()
    //console.log(app.globalData.TodayDataObj)
  },
  onReady() {

  },
  // 饼状图类别选择函数
  KindSelect(params) {
    console.log("page:cash统计种类选择:" + params)
    if (params === 'wx' || params === 'cash') {
      console.log("微信现金")
      return [{
        "name": "会员卡",
        "value": this.data.cardCost
      }, {
        "name": "现金",
        "value": this.data.cashCost
      }, {
        "name": "微信",
        "value": this.data.wxCost
      }, {
        "name": "优惠券",
        "value": this.data.couponCost
      }]
    } else if (params === 'vip' || params === 'cashCoupon' || params === 'mtCoupon' || params === 'dyCoupon') {
      console.log("卡券类")
      return [{
        "name": "会员卡",
        "value": this.data.cardCost
      }, {
        "name": "代金券",
        "value": this.data.cashCouponCost
      }, {
        "name": "美团券",
        "value": this.data.mtCouponCost
      }, {
        "name": "抖音券",
        "value": this.data.dyCouponCost
      }]
    } else if (params === 'tableCost' || params === 'commotidyCost' || params === 'top_up' || params === 'couponCost' || params === 'sportShowCost') {
      console.log("按项目分类")
      return [{
        "name": "台费",
        "value": this.data.tableCost
      }, {
        "name": "商品",
        "value": this.data.commotidyCost
      }, {
        "name": "储值",
        "value": this.data.top_up
      }, {
        "name": "优惠券",
        "value": this.data.couponCost
      }, {
        "name": "精彩秀",
        "value": this.data.sportShowCost
      }]
    }
  },
  getServerData() {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
      //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
      let res = {
        series: [{
          data: this.KindSelect(this.data.name)
        }]
      };
      this.drawCharts('NvEQKyCeVTorlEmrKznhGMuBrZPTQxwH', res);
    }, 500);
  },
  drawCharts(id, data) {
    const ctx = wx.createCanvasContext(id, this);
    uChartsInstance[id] = new uCharts({
      type: "column",
      context: ctx,
      width: this.data.cWidth,
      height: this.data.cHeight,
      categories: data.categories,
      series: data.series,
      animation: true,
      background: "#FFFFFF",
      padding: [15, 15, 0, 5],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        data: [{
          min: 0
        }]
      },
      extra: {
        column: {
          type: "group"
        }
      }
    });
  },
  goto(e) {
    wx.navigateTo({
      url: `../../statement/orderForm/orderFormInfo/orderFormInfo?index=${e.mark.index}`,
    })
  },
  tap(e) {
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
  },

  //饼装图--------------------------------------
  drawCharts(id, data) {
    const ctx = wx.createCanvasContext(id, this);
    uChartsInstance[id] = new uCharts({
      type: "pie",
      context: ctx,
      width: this.data.cWidth,
      height: this.data.cHeight,
      series: data.series,
      animation: true,
      timing: "easeOut",
      duration: 1000,
      rotate: false,
      rotateLock: false,
      background: "#FFFFFF",
      color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
      padding: [5, 5, 5, 5],
      fontSize: 13,
      fontColor: "#666666",
      dataLabel: true,
      dataPointShape: true,
      dataPointShapeType: "solid",
      touchMoveLimit: 60,
      enableScroll: false,
      enableMarkLine: false,
      legend: {
        show: true,
        position: "bottom",
        float: "center",
        padding: 5,
        margin: 5,
        backgroundColor: "rgba(0,0,0,0)",
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 0,
        fontSize: 13,
        fontColor: "#666666",
        lineHeight: 11,
        hiddenColor: "#CECECE",
        itemGap: 10
      },
      extra: {
        pie: {
          activeOpacity: 0.5,
          activeRadius: 10,
          offsetAngle: 0,
          labelWidth: 15,
          border: true,
          borderWidth: 3,
          borderColor: "#FFFFFF",
          customRadius: 0,
          linearType: "none"
        },
        tooltip: {
          showBox: true,
          showArrow: true,
          showCategory: false,
          borderWidth: 0,
          borderRadius: 0,
          borderColor: "#000000",
          borderOpacity: 0.7,
          bgColor: "#000000",
          bgOpacity: 0.7,
          gridType: "solid",
          dashLength: 4,
          gridColor: "#CCCCCC",
          boxPadding: 3,
          fontSize: 13,
          lineHeight: 20,
          fontColor: "#FFFFFF",
          legendShow: true,
          legendShape: "auto",
          splitLine: true,
          horizentalLine: false,
          xAxisLabel: false,
          yAxisLabel: false,
          labelBgColor: "#FFFFFF",
          labelBgOpacity: 0.7,
          labelFontColor: "#666666"
        }
      }
    });
  }
})