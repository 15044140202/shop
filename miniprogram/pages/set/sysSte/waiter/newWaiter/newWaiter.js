// pages/set/sysSte/waiter/newWaiter/newWaiter.js
const app = getApp();
const appData = getApp().globalData;
import {
  Base64
} from 'js-base64';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    member: [],
    imgBuff: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options.position);
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveData', function (data) {
      console.log(data)
      that.setData({
        member: data
      })
    })
    const _id = app.getRandomString(28)
    const now = new Date().getTime();
    //上传QR信息
    const upQrDataRes = await app.updateQrData({
      _id:_id,
      itemName:'addWaiter',
      position:options.position,
      time:now,
      shopId:appData.shop_account._id,
      shopName:appData.shop_account.shopInfo.shopName
    })
    if (!upQrDataRes.success) {//
      console.log('上传QR信息失败!')
      return
    }
    //获取二维码
    const path = `pages/oder/oder`
    console.log(path)
    const res = await app.callFunction({
      name: 'getQRCode',
      data: {
        pages: path,
        scene:_id
      }
    })
    console.log(res)
    if (res.errMsg === 'openapi.wxacode.getUnlimited:ok') {
      app.showToast('获取小程序码成功!', 'success')
      let arrayBuffer = res.buffer; // 你的 ArrayBuffer 数据
      let byteArray = new Uint8Array(arrayBuffer);
      let base64String = Base64.fromUint8Array(byteArray);
      this.setData({
        imgBuff: 'data:image/jpeg;base64,' + base64String
      })
    } else {
      app.showToast('获取小程序码失败!', 'error')
    }
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

  }
})