// pages/operate/inShopCustomer/inShopCustomer.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderForm: [],
    shopTableInfo: appData.shopInfo.shop.tableSum,

    vipList: [],

    res: []
  },
  call(e) {
    wx.makePhoneCall({
      phoneNumber: this.data.orderForm[e.mark.index].openPerson.openPersonTelephone //仅为示例，并非真实的电话号码
    })
  },
  goto(e) {
    console.log(e)
    const  that = this;
    wx.navigateTo({
      url: `../../statement/orderForm/orderFormInfo/orderFormInfo?item="inShopCustomer"&index=${e.mark.index}`,
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('giveData', that.data.orderForm)
      }
    })
  },
  async loadData() {
    const shopTableInfo = this.data.shopTableInfo;
    const orderDateArray = [];
    //先统计桌台 账单 日期列表, 为了获取那个日期的账单
    for (let index = 0; index < shopTableInfo.length; index++) {
      const element = shopTableInfo[index];
      if (element.orderForm !== '') { //
        const orderDate = app.getOrderFormDate(element.orderForm)
        //订单日期数组 是否已有 此时日期
        if (orderDateArray.length > 0) {
          for (let i = 0; i < orderDateArray.length; i++) {
            const date = orderDateArray[i];
            if (orderDate === date) { //以获取的日期
              break;
            } else if (i === orderDateArray.length - 1) { //没有获取过这个日期
              orderDateArray.push(orderDate)
            }
          }
        } else {
          orderDateArray.push(orderDate)
        }
      }
    }
    console.log({
      '日期数组': orderDateArray
    })
    //循环获取 每个日期的订单
    for (let index = 0; index < orderDateArray.length; index++) {
      const element = orderDateArray[index];
      const res = await app.callFunction({
        name: 'getOrderForm',
        data: {
          collection: "orderForm",
          shopFlag: appData.shopInfo.shopFlag,
          date: element,
          propertyName: 'null',
          property: 'null'
        }
      })
      for (let i = 0; i < res[`${element}`].length; i++) {
        const order = res[`${element}`][i];
        this.data.orderForm.push(order)
      }
    }
    this.setData({
      orderForm: this.data.orderForm
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      shopTableInfo:appData.shopInfo.shop.tableSum,
    })
    this.loadData();

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
  }
})