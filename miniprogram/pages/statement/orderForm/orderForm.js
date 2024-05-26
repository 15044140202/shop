// pages/statement/orderForm/orderForm.js
const appData = getApp().globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderForm: [],
    get_item:''

  },
  goto(e) {
    wx.navigateTo({
      url: `./orderFormInfo/orderFormInfo?index=${e.mark.index}`,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      orderForm: appData.orderForm,
      get_item:options.item
    })
    console.log(this.data.orderForm)
    console.log(this.data.get_item)

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

  }
})