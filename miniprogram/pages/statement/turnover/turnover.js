// pages/statement/turnover/turnover.js
import uCharts from '../../../components/ucharts/u-charts';
var uChartsInstance = {};
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    TodayDataObj: app.TodayDataObj,
    TodayTurnover: 0,
    cWidth: 750,
    cHeight: 500, 

    hidden: true,

    orderArray: [],
    everyDayAmount: []

  },
  async getOrder(date) {
    const now = new Date()
    //获取七日营业数据
    const task = []
    for (let index = 0; index < 7; index++) {
      let date = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      date -= index * 24*60*60*1000
      task.push(app.getOrderData(date, date + 24*60*60*1000))
    }
    const res = await Promise.all(task)
    for (let index = 0; index < res.length; index++) {
      const element = res[index];
      this.data.orderArray.push(element);
    }
  },
  computeEveryDayAmount() {
    const now = new Date().getTime();
    const orderListArray = this.data.orderArray;
    for (let index = 0; index < orderListArray.length; index++) {
      const element = orderListArray[index]; //每天的账单
      var dayAmount = 0;
      for (let i = 0; i < element.length; i++) {
        const e = element[i]; //每个账单
        if (e.orderName === '精彩秀单' && e.payMode!=='未支付') {
          dayAmount += parseInt(e.amount)
        } else if ((e.orderName === '自助开台订单' || e.orderName === '店员开台订单' || e.orderName === '自助套餐订单') && e.pledgeState === 1  ) {
          dayAmount += parseInt(e.tableCost)
        } else if (e.orderName === '储值单' && e.payMode!=='未支付') {
          dayAmount += parseInt(e.amount)
        } else if (e.orderName === '商品单'  && e.payMode!=='未支付') {
          dayAmount += parseInt(e.commotidyCost)
        }
      }
      this.data.everyDayAmount.unshift({
        date: (app.getNowTime(new Date(now - index * 24 * 60 * 60 * 1000))),
        amount: dayAmount === NaN ? 0 : dayAmount
      })
    }
    console.log(this.data.everyDayAmount);
    this.setData({
      everyDayAmount: this.data.everyDayAmount
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {


  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    //这里的第一个 750 对应 css .charts 的 width
    const cWidth = 750 / 750 * wx.getSystemInfoSync().windowWidth;
    //这里的 500 对应 css .charts 的 height
    const cHeight = 500 / 750 * wx.getSystemInfoSync().windowWidth;
    this.setData({
      cWidth,
      cHeight
    });
    this.getServerData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return appData.globalShareInfo;
  },
  //根据data:TurnoverList 数据解析 时间 营业额 现金额 数据
  getTuenoverData(kind) {
    var TurnoverList = this.data.everyDayAmount
    var rdata = []
    if (kind == 'date') {
      for (let index = 0; index < TurnoverList.length; index++) {
        rdata.push(TurnoverList[index].date.substring(5,10));
      }
      return rdata
    } else if (kind == 'turnover') {
      for (let index = 0; index < TurnoverList.length; index++) {
        rdata.push(TurnoverList[index].amount);
      }
      return rdata
    } else if (kind == 'cash') {
      for (let index = 0; index < TurnoverList.length; index++) {
        rdata.push(TurnoverList[index].cash);
      }
      return rdata
    } else return []
  },
  goto(e) {
    console.log(this.data.everyDayAmount[e.mark.index].date)
    appData.disPlayDate = this.data.everyDayAmount[e.mark.index].date
    wx.switchTab({
      url: '../../statement/statement',
    })
  },
  async getServerData() {
    app.showLoading('数据加载中...', true)
    //获取近七日账单列表
    await this.getOrder();
    console.log(this.data.orderArray)
    //统计每日金额
    this.computeEveryDayAmount();
    //加载成功!
    wx.hideLoading();
    this.setData({
      hidden: false
    })
    //模拟从服务器获取数据时的延时
    setTimeout(() => {
      //模拟服务器返回数据，如果数据格式和标准格式不同，需自行按下面的格式拼接
      let res = {
        categories: this.getTuenoverData('date'),
        series: [{
          name: "营业额",
          data: this.getTuenoverData('turnover')
        }
        ]
      };
      this.drawCharts('OkJFRGvSCMIemruYSgfuLQZuZqkFxSGB', res);
    }, 500);
  },
  drawCharts(id, data) {
    const ctx = wx.createCanvasContext(id, this);
    uChartsInstance[id] = new uCharts({
      type: "line",
      context: ctx,
      width: this.data.cWidth,
      height: this.data.cHeight,
      categories: data.categories,
      series: data.series,
      animation: true,
      timing: "easeOut",
      duration: 1000,
      rotate: false,
      rotateLock: false,
      background: "#FFFFFF",
      color: ["#1890FF", "#91CB74", "#FAC858", "#EE6666", "#73C0DE", "#3CA272", "#FC8452", "#9A60B4", "#ea7ccc"],
      padding: [15, 10, 0, 15],
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
      xAxis: {
        disableGrid: true,
        disabled: false,
        axisLine: true,
        axisLineColor: "#CCCCCC",
        calibration: false,
        fontColor: "#666666",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 0,
        rotateLabel: false,
        rotateAngle: 45,
        itemCount: 5,
        boundaryGap: "center",
        splitNumber: 5,
        gridColor: "#CCCCCC",
        gridType: "solid",
        dashLength: 4,
        gridEval: 1,
        scrollShow: false,
        scrollAlign: "left",
        scrollColor: "#A6A6A6",
        scrollBackgroundColor: "#EFEBEF",
        title: "",
        titleFontSize: 13,
        titleOffsetY: 0,
        titleOffsetX: 0,
        titleFontColor: "#666666",
        formatter: ""
      },
      yAxis: {
        gridType: "dash",
        dashLength: 2,
        disabled: false,
        disableGrid: false,
        splitNumber: 5,
        gridColor: "#CCCCCC",
        padding: 10,
        showTitle: false,
        data: []
      },
      extra: {
        line: {
          type: "straight",
          width: 2,
          activeType: "hollow",
          linearType: "none",
          onShadow: false,
          animation: "vertical"
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
        },
        markLine: {
          type: "solid",
          dashLength: 4,
          data: []
        }
      }
    });
  },
  tap(e) {
    uChartsInstance[e.target.id].touchLegend(e);
    uChartsInstance[e.target.id].showToolTip(e);
  }
})