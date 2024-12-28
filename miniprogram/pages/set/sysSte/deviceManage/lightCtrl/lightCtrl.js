// pages/set/sysSte/deviceManage/lightCtrl/lightCtrl.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    device: appData.device,
    lightStatus: undefined,
    switchStatus: [0, 0, 0, 0, 0]
  },
  bindKeyInput(e) {
    if (e.mark.item === 'lightCtrl') {
      this.setData({
        ['device.lightCtrl']: e.detail.value,
      })
      console.log(this.data.device.lightCtrl)
    } else if (e.mark.item === 'lightId') {
      //先判断 数据里面是否有 开关灯时间段数据
      if ('shopLightSet' in this.data.device) { //有数据

      } else { //无数据
        this.pushLightSet();
      }
      this.setData({
        [`device.shopLightSet[${e.mark.index}].lightId`]: e.detail.value,
      })
    }
  },
  async switchChange(e) {
    console.log(e)
    if (e.mark.item === 'lightChange') {
      const channel = this.data.device.shopLightSet[e.mark.index].lightId
      if (channel !== 0) {
        const onOff = e.detail.value
        app.showLoading('指令下发中!', true)
        const res = await app.call({
          method: 'POST',
          path: '/api/light',
          data: {
            lightName: this.data.device.lightCtrl,
            lightStatus:onOff === true ? '1' : '0',
            lightChannel:channel
          }
        })
        console.log(res)
        if (res.msg === '操作成功') {
          //刷新灯控器状态
          this.setData({
            [`lightStatus.data`]:res.lightStatus
          })
          this.refirshlightStatus(this.data.lightStatus)
        }
        wx.hideLoading()
        return
      } else {
        app.showModal('提示', '请先绑定灯控器通道!')
        return
      }
    }
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
          ['device.lightCtrl']: Id,
        })
      }
    })
  },
  async timeChange(e) {
    console.log(e)
    //先判断 数据里面是否有 开关灯时间段数据
    if ('shopLightSet' in this.data.device) { //有数据

    } else { //无数据
      this.pushLightSet();
    }
    //设置数据
    this.setData({
      [`device.shopLightSet[${e.mark.index}].${e.mark.item === 'open' ? 'openTime' : 'closeTime'}`]: e.detail.value
    })
  },
  pushLightSet() {
    this.setData({
      device: {
        ...this.data.device,
        shopLightSet: [{
            openTime: '00:00',
            closeTime: '00:00',
            lightId: ''
          },
          {
            openTime: '00:00',
            closeTime: '00:00',
            lightId: ''
          },
          {
            openTime: '00:00',
            closeTime: '00:00',
            lightId: ''
          },
          {
            openTime: '00:00',
            closeTime: '00:00',
            lightId: ''
          },
          {
            openTime: '00:00',
            closeTime: '00:00',
            lightId: ''
          },
        ]
      }
    })
  },
  async save() {
    //首先检测输入是否正确
    // if (this.data.device.lightCtrl === '') {
    //   app.showToast('请输入正确号码', 'error')
    //   return
    // }
    app.showLoading('保存中...', true)
    //处理数据
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: `shop.device`,
        data: this.data.device
      }
    })
    if (res === 'ok') {
      appData.device = await app.getDevice(appData.shopInfo.shopFlag)
      await app.getShopInfo(appData.shopInfo.shopFlag)
      wx.hideToast({})
      app.showToast('保存成功!', 'success', )
    } else {
      wx.hideToast({})
      wx.showToast('保存失败!', 'error')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      device: appData.shopInfo.shop.device
    })
    //获取灯控器状态
    this.setData({
      lightStatus: await app.call({
        method: 'GET',
        path: '/api/light',
        data: {
          lightName: this.data.device.lightCtrl
        }
      })
    })
    console.log(this.data.lightStatus)
    this.refirshlightStatus(this.data.lightStatus)
  },
  refirshlightStatus(lightStatus) {
    for (let index = 0; index < this.data.switchStatus.length; index++) {
      if (this.data.device.shopLightSet[index].lightId > 0) {
        this.setData({
          [`switchStatus[${index}]`]: lightStatus.data[`A${this.data.device.shopLightSet[index].lightId}`]
        })
      }
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})