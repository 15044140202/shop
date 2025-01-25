// pages/set/sysSte/deviceManage/lightCtrl/lightCtrl.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_device: appData.shop_device,
    lightStatus: undefined,
    switchStatus: [0, 0, 0, 0, 0]
  },
  bindKeyInput(e) {
    if (e.mark.item === 'lightCtrl') {
      this.setData({
        ['shop_device.lightCtrl']: e.detail.value,
      })
      console.log(this.data.shop_device.lightCtrl)
    } else if (e.mark.item === 'lightId') {
      //先判断 数据里面是否有 开关灯时间段数据
      if ('shopLightSet' in this.data.shop_device && this.data.shop_device.shopLightSet.length === 5) { //有数据

      } else { //无数据
        this.pushLightSet();
      }
      this.setData({
        [`shop_device.shopLightSet[${e.mark.index}].lightId`]: e.detail.value,
      })
    }
  },
  async switchChange(e) {
    if (this.data.shop_device.shopLightSet.length === 0 || this.data.shop_device.shopLightSet[e.mark.index].lightId === 0) {
      app.showModal('错误', '请先设置通道!')
      return
    }
    console.log(e)
    if (e.mark.item === 'lightChange') {
      const channel = this.data.shop_device.shopLightSet[e.mark.index].lightId
      if (channel !== 0) {
        const onOff = e.detail.value
        app.showLoading('指令下发中!', true)
        const res = await app.call({
          method: 'POST',
          path: '/api/light',
          data: {
            lightName: this.data.shop_device.lightCtrl,
            lightStatus: onOff === true ? '1' : '0',
            lightChannel: channel
          }
        })
        console.log(res)
        if (res.msg === '操作成功') {
          //刷新灯控器状态
          this.setData({
            [`lightStatus.data`]: res.lightStatus
          })
          this.refirshlightStatus(this.data.lightStatus)
        }else if(res.msg === '设备不在线'){
          app.showModal('提示', '设备不在线!')
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
          ['shop_device.lightCtrl']: Id,
        })
      }
    })
  },
  async timeChange(e) {
    console.log(e)
    //先判断 数据里面是否有 开关灯时间段数据
    if ('shopLightSet' in this.data.shop_device) { //有数据

    } else { //无数据
      this.pushLightSet();
    }
    //设置数据
    this.setData({
      [`shop_device.shopLightSet[${e.mark.index}].${e.mark.item === 'open' ? 'openTime' : 'closeTime'}`]: e.detail.value
    })
  },
  pushLightSet() {
    this.setData({
      shop_device: {
        ...this.data.shop_device,
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
    app.showLoading('保存中...', true)
    const shopdevice = this.data.shop_device
    delete shopdevice._id
    //处理数据
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_device',
        query: {
          shopId: appData.shop_account._id
        },
        upData: shopdevice
      }
    })
    if (res.success) {
      appData.shop_device = this.data.shop_device
      app.showToast('保存成功!', 'success',)
    } else {
      app.showToast('保存失败!', 'error')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      shop_device: appData.shop_device
    })
    //获取灯控器状态
    if (this.data.shop_device.lightCtrl) {
      this.setData({
        lightStatus: await app.getLightStatus(this.data.shop_device.lightCtrl)
      })
      if (this.data.lightStatus.code === 404) {
        app.showModal('提示', '设备不在线!')
        return
      }
      console.log(this.data.lightStatus)
      this.refirshlightStatus(this.data.lightStatus)
    }

  },
  refirshlightStatus(lightStatus) {
    if (this.data.shop_device.shopLightSet.length === 0 || !lightStatus.data) {//无店铺设备控制数据
      return
    }
    for (let index = 0; index < this.data.switchStatus.length; index++) {
      if (this.data.shop_device.shopLightSet[index].lightId > 0) {
        this.setData({
          [`switchStatus[${index}]`]: lightStatus.data[`A${this.data.shop_device.shopLightSet[index].lightId}`]
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