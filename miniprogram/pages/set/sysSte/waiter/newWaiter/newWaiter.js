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

    //获取二维码
    const now = new Date().getTime();
    const res = await wx.cloud.callFunction({
      name: 'getQRCode',
      data: {
        pages: `pages/oder/oder?position=${options.position}&time=${now}&shopFlag=${appData.shopInfo.shopFlag}&shopName=${appData.shopInfo.shop.shopName}`
      }
    })
    console.log(res)
    if (res.result.errMsg === 'openapi.wxacode.get:ok') {
      app.showToast('获取小程序码成功!', 'success')
      let arrayBuffer = res.result.buffer; // 你的 ArrayBuffer 数据
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