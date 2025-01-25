// pages/set/sysSte/shopTransfer/shopTransfer.js
const app = getApp()
const appData = app.globalData
import {
  Base64
} from 'js-base64';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_account:appData.shop_account,
    tel:'',
    qrHidden:false,
    imgBuff:undefined
  },
  tap(e){
    console.log(e)
    if (e.mark.item === "confirm") {
      console.log('con')
      if (!this.data.tel || this.data.tel.length !== 11) {
        app.showModal('提示','请输入正确的电话号码!')
        return
      }
      wx.showModal({
        title: '确认',
        content: `确认要将店铺转让给${this.data.tel}吗?`,
        complete: (res) => {
          if (res.cancel) {
            return
          }
          if (res.confirm) {
            this.transfer()
          }
        }
      })
    }
  },
  input(e){
    console.log(e)
    if (e.mark.item === 'tel') {
      this.data.tel = e.detail.value
    }
  },
  async transfer(){
    const qrData = {
      itemName:'shopTransfer',
      shopId:appData.shop_account._id,
      shopName:appData.shop_account.shopInfo.shopName,
      old_openid:appData.merchant_info._openid,
      tel:this.data.tel,
      time:new Date().getTime()
    }
    const res = await app.getUnlimitedQr(qrData,'pages/oder/oder')
    console.log(res)
    if (res.errMsg === 'openapi.wxacode.getUnlimited:ok') {
      app.showToast('获取小程序码成功!', 'success')
      let arrayBuffer = res.buffer; // 你的 ArrayBuffer 数据
      let byteArray = new Uint8Array(arrayBuffer);
      let base64String = Base64.fromUint8Array(byteArray);
      this.setData({
        imgBuff: 'data:image/jpeg;base64,' + base64String,
        qrHidden:true
      })
    } else {
      app.showToast('获取小程序码失败!', 'error')
    }

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
    this.setData({
      shop_account:appData.shop_account
    })

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