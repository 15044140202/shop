// pages/operate/inShopCustomer/inShopCustomer.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_table: appData.shop_table,
    vipList: [],
    res: []
  },
  call(e) {
    if (this.data.tableOrder[e.mark.index].userTelephone) {
      wx.makePhoneCall({
        phoneNumber: this.data.tableOrder[e.mark.index].userTelephone
      })
    }else{
      app.showModal('提示','未知电话号码!')
    }
  },
  goto(e) {
    console.log(e)
    const that = this;
    wx.navigateTo({
      url: `../../statement/orderForm/orderFormInfo/orderFormInfo?item="inShopCustomer"&index=${e.mark.index}`,
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('giveData', that.data.tableOrder)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
    this.setData({
      shopTableInfo: appData.shop_table,
      tableOrder:appData.orderForm
    })
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