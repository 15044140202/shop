// pages/set/sysSte/deviceManage/deviceManage.js
const imou = require('../../../../utils/imou');
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device:appData.shop_device
  },
  goto(e) {
    console.log(e)
    wx.navigateTo({
      url: `./${e.mark.item}/${e.mark.item}`
    })

  },
  /**
   * @description //新加设备种类时 用这个函数检测 数据库中是否有 新加的这个设备种类  没有会自动添加并刷新本地数据
   * @param {Object} nowDevice 
   * @returns {object} 返回添加后的新 设备数据
   */
  async testDeviceKind(nowDevice) {
    const newKind = [
      {
        name:'printer',
        data:''
      }
    ]//新设备应以obj格式出现在数组中
    for (let index = 0; index < newKind.length; index++) {
      const element = newKind[index];
      if (!(element.name in nowDevice)) {//数据库中没有这个设备种类
        //刷新数据库数据
        await app.callFunction({
          name:'upDate',
          data:{
            collection:'shop_device',
            query:{
              shopId:appData.shop_account._id
            },
            upData:{
              [`${element.name}`]:element.data
            }
          }
        })
        const newData = {
          ...nowDevice,
          [element.name]:element.data
        }
        appData.device = newData;
        this.setData({
          device:newData
        })
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.testDeviceKind(this.data.device)
    
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