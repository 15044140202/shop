const utils = require('../../../utils/light');
import Dialog from '../../../miniprogram_npm/@vant/weapp/dialog/dialog';
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
    checked: false,
    optNum: 0,

    tebleInfo: {},
    shopSelect: 0,
    inputValue: '',
    charging: [], //计费规则组
    chargingSelect: -1,
  },
  goto(e){
    wx.navigateTo({
      url:`./tableQr/tableQr?optNum=${this.data.optNum}`,
    })
  },
  removeTap() {
    Dialog.alert({
      title: '提示',
      message: '解除该桌台绑定的计费规则?',
      showCancelButton: true
    }).then(() => { //确定
      this.removeBind();
    }).catch(() => { //取消
      return;
    });
  },
  async removeBind() {
    console.log('开始解除绑定')
    const res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.tableSum.${this.data.optNum - 1}.chargingFlag`,
      data: ''
    })
    res === 'ok' ? this.setData({
      chargingSelect: -1
    }) : console.log('解除失败!')

  },
  async chargingSelect(e) {
    console.log(e.detail.value)
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: `shop.tableSum.${this.data.optNum -1 }.chargingFlag`,
        data: this.data.charging[e.detail.value].flag
      }
    })
    if (res === 'ok') {
      console.log('保存成功!')
      this.setData({
        chargingSelect: e.detail.value
      })
    } else {
      console.log('保存失败!')
    }

  },
  getChargingSelect(tableChargingFlag, chaging) {
    for (let index = 0; index < chaging.length; index++) {
      const element = chaging[index];
      if (element.flag === tableChargingFlag) {
        this.setData({
          chargingSelect: index
        })
        return
      } else if (index === chaging.length - 1) { //此桌台没有绑定任何计费规则
        this.setData({
          chargingSelect: -1
        })
        return
      }
    }
  },
  bindKeyInput: function (e) {
    console.log(e.detail.value)
    this.setData({
      inputValue: e.detail.value
    })
  },
  async _lightCtrl() {
    //首先应该判断 是否绑定了灯控器
    if (await app.haveLight() === false) { //没有绑定灯控器
      return;
    }

    if (this.data.checked === false) {
      this.setData({
        checked: true
      })
    } else {
      this.setData({
        checked: false
      })
    }
    await utils.lightCtrl({
      lightName: appData.shopInfo.shop.lightId,
      lightData: `{{"A${this.data.optNum.toString().padStart(2, '0') }":1${this.data.checked === true ? 1 : 0}0000,"res":"123"}}`
    })
  },
  async saveData() {
    wx.showToast({
      title: '数据储存中',
      icon: 'none',
      mask: true,
      duration: 20000
    })
    //处理数据
    console.log("_id:" + appData.shopInfo._id)
    const res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.tableSum.${this.data.optNum-1}.tableName`,
      data: this.data.inputValue
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

  //获取 计费规则 函数
  async getCharging(shopFlag) {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'charging',
        record: 'charging',
        shopFlag: shopFlag
      }
    })
    console.log(res)
    if (res.length > 0) {
      return res;
    } else {
      app.showToast('获取计费规则错误!', 'error')
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //此处获取到 桌台号 options.tableNum
    console.log(options);
    this.setData({
      optNum: options.tableNum,
      shopInfo: appData.shopInfo
    })
    console.log(this.data.shopInfo.shop.tableSum[this.data.optNum - 1].tableName)
    //获取 计费规则
    this.setData({
      charging: await this.getCharging(appData.shopInfo.shopFlag)
    })

    //获取此桌台选择的 计费规则
    this.getChargingSelect(this.data.shopInfo.shop.tableSum[this.data.optNum - 1].chargingFlag, this.data.charging)

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},
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