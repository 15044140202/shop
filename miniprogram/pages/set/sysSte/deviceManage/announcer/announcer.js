// pages/set/sysSte/deviceManage/lightCtrl/lightCtrl.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device:appData.device,
  },
  async announcerTest(){
        //播报器 
    await app.callFunction({
      name:'announcerSendMessage',
      data:{
        announcerId:this.data.device.announcer,
        first:'7571',
        last:'7595',
        randomNum:app.getRandomString(5) + new Date().getTime()
      }
    })
  },
  bindKeyInput(e) {
    if (e.mark.item === 'announcer') {
      this.setData({
        ['device.announcer']: e.detail.value,
      })
    }
    console.log(this.data.device.announcer)
  },
  scan() {
    console.log('扫描播报器二维码!')
    var that = this;
    wx.scanCode({
      scanType: 'qrCode',
      success(res) {
        const Id = res.result.split("|")[0]
        console.log(Id)
        that.setData({
          ['device.announcer']: Id,
        })
      }
    })
  },
  async save() {
    //首先检测输入是否正确
    if (this.data.device.announcer === '') {
      app.showToast('请输入正确号码','error')
      return
    }
    app.showLoading('保存中...',true)
    //处理数据
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'shopAccount',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:`shop.device.announcer`,
        data:this.data.device.announcer
      }
    })
    if (res === 'ok') {
      appData.device = await app.getDevice(appData.shopInfo.shopFlag)
      await app.getShopInfo(appData.shopInfo.shopFlag)
      wx.hideToast({})
      app.showToast('保存成功!','success',)
    } else {
      wx.hideToast({})
      wx.showToast('保存失败!','error',)
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      device:appData.shopInfo.shop.device
    })
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