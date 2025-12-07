// pages/tools/shop_camera/shop_camera.js
const app = getApp()
const appData = app.globalData
const ys7 = require('../../../utils/ys7')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    ezplayer: {
      token: '',
      url: '',
      recPlayTime: '',
    },
    shop_device: {}
  },
  async getLiveUrl() {
    //获取token
    const token = await ys7.getToken(app)
    const cameraInfo = this.data.shop_device.camera[0]
    
    console.log(token)
    this.setData({
      [`ezplayer.token`]: token,
      [`ezplayer.url`]: `rtmp://open.ys7.com/${cameraInfo.cameraNum}/${1}/${'live'}/${app.getNowTime(new Date()).replace(/\//g, '-')}/${app.getNowTime(new Date()).replace(/\//g, '-')}`,
      [`ezplayer.recPlayTime`]: app.getNowTime(new Date(), 'hms'),
      cameraInfo: cameraInfo,
    })
  },
  handleError(e) {
    console.log(e)
  },
  onControlEvent(e) {
    console.log(e)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      shop_device: appData.shop_device
    })
    this.getLiveUrl()
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