import uCharts from '../../../components/ucharts/u-charts';
var uChartsInstance = {};
var app = getApp() ;

Page({
  data: {
    cWidth: 750,
    cHeight: 500,
    TodayDataObj:app.globalData.TodayDataObj,
    sort:''
  },
  onLoad: function (options) {
    //页面初始化 options为页面跳转所带来的参数
    this.setData({
      sort:options.id
    })
  },
  onReady() {
    //这里的第一个 750 对应 css .charts 的 width
    const cWidth = 750 / 750 * wx.getSystemInfoSync().windowWidth;
    //这里的 500 对应 css .charts 的 height
    const cHeight = 500 / 750 * wx.getSystemInfoSync().windowWidth;
    this.setData({ cWidth, cHeight });
    this.getServerData()
    //console.log(app.globalData.TodayDataObj)
  },
  // 饼状图类别选择函数
  KindSelect(params) {
    console.log("page:cash统计种类选择:"+params)
    if (params=='wx'||params=='cash'){
      console.log("微信现金")
      return  [{"name":"会员卡","value":app.globalData.AccountsTotal.vip},{"name":"现金","value":app.globalData.AccountsTotal.cash},{"name":"微信","value":app.globalData.AccountsTotal.wx},{"name":"优惠券","value":app.globalData.AccountsTotal.cashCoupon}]
    }
    else if (params=='vip'||params=='vipOwe'||params=='cashCoupon'||params=='mtCoupon'||params=='dyCoupon'){
      console.log("卡券类")
      return  [{"name":"会员卡","value":app.globalData.AccountsTotal.vip},{"name":"会员欠款","value":app.globalData.AccountsTotal.vipOwe},{"name":"代金券","value":app.globalData.AccountsTotal.cashCoupon},{"name":"美团券","value":app.globalData.AccountsTotal.mtCoupon},{"name":"抖音券","value":app.globalData.AccountsTotal.dyCoupon}]
    }
  },
  getServerData() {
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
      //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
      let res ={
        series:[{
          data:this.KindSelect(this.data.sort)
        }]
      };
      this.drawCharts('NvEQKyCeVTorlEmrKznhGMuBrZPTQxwH', res);
    }, 500);
  },
  drawCharts(id,data){
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
        padding: [15,15,0,5],
        xAxis: {
          disableGrid: true
        },
        yAxis: {
          data: [{min: 0}]
        },
        extra: {
          column: {
            type: "group"
          }
        }
      });
  },
  tap(e){
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
  },
  
  //饼装图--------------------------------------
  drawCharts(id,data){
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
        color: ["#1890FF","#91CB74","#FAC858","#EE6666","#73C0DE","#3CA272","#FC8452","#9A60B4","#ea7ccc"],
        padding: [5,5,5,5],
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