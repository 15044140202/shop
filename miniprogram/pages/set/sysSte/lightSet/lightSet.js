// pages/set/sysSte/lightSet/lightSet.js
import {Base64} from 'js-base64';
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据'未绑定灯控模块'
   */
  data: {
    initialData:appData.shopInfo.shop.lightId === '' ? '未绑定灯控模块' : appData.shopInfo.shop.lightId,
    inputLightId: ""
  },
  bindKeyInput(e) {
    this.setData({
      inputLightId: e.detail.value,
      initialData: e.detail.value
    })
  },
  scan() {
    console.log('扫描灯控器二维码!')
    var that = this;
    wx.scanCode({
      scanType: 'QR_CODE',
      success(res) {
        const Id = res.result.substr(8, 12)
        console.log(Id)
        that.setData({
          initialData: Id,
          inputLightId: Id
        })
      }
    })

  },
  async save() {
    //首先检测输入是否正确
    if (this.data.initialData == '未绑定灯控模块' || this.data.initialData == '') {
      wx.showToast({
        title: '请正确输号码',
        icon: 'error'
      })
      return
    }
    wx.showToast({
      title: '数据储存中',
      icon: 'none',
      mask: true,
      duration: 20000
    })
    //处理数据
    console.log("_id:" + appData.shopInfo._id)
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'shopAccount',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:`shop.lightId`,
        data:this.data.initialData
      }
    })
    if (res === 'ok') {
      wx.hideToast({})
      wx.showToast({
        title: '保存成功!',
        icon: 'success',
        mask: true,
        duration: 1000
      })
    } else {
      wx.hideToast({})
      wx.showToast({
        title: '保存失败!',
        icon: 'error',
        mask: true,
        duration: 1000
      })
    }
    //处理数据结束
  },

  lightTest() {
 
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