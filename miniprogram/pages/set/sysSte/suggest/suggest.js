// pages/set/sysSte/suggest/suggest.js
const app = getApp();
const appData = app.globalData;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    suggestText: ''

  },
  suggestText(e) {
    console.log(e.detail.value)
    this.setData({
      suggestText: e.detail.value
    })
  },
  async save() {
    if (this.data.suggestText === '') {
      app.showToast('请输入内容', 'error')
    } else {
      const res = await app.callFunction({
        name: 'addArrayDatabase_fg',
        data: {
          collection: 'suggest',
          shopFlag: appData.shopInfo.shopFlag,
          objName: 'suggest',
          data: this.data.suggestText + '*电话:' + appData.shopInfo.telephone
        }
      })
      if (res === 'ok') {
        app.showToast('提交成功!', 'success');
        wx.navigateBack();
      } else {
        app.showToast('提交失败!', 'error');
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //检测数据库是否有 此用户留言模版如果没有则创建一个
    app.showLoading('加载中...', true);
    await app.callFunction({
      name: 'getDatabaseArray_fg',
      data: {
        collection: 'suggest',
        shopFlag: appData.shopInfo.shopFlag,
        ojbName: 'suggest',
        startSum: 1,
        endSum: 2
      }
    })
    wx.hideLoading();

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