// pages/set/sysSte/deviceManage/camera/camera.js
const app = getApp();
const appData = app.globalData;
import Dialog from '@vant/weapp/dialog/dialog';
const imou = require('../../../../../utils/imou')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    sportShowCost:1,//此为调取一次收取商家的价格  修改请修改此处
    shop_table: [],
    shop_device: {},
    shop_account: {},

    cameraNum: '',
    cameraSecurityCode: '',
    channel:1,
    cameraName: '',
    deviceState: [],

    imouAppID: "lc4bfc16daf7d8499e",
    imouAppSecret: "45757fec5f584f60992b84489ecf54"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      shop_device: appData.shop_device,
      shop_table: appData.shop_table,
      shop_account: appData.shop_account
    })
    this.setData({
      deviceState: await this.refreshDeviceState(this.data.shop_device.camera)
    })
  },
  async tap(e) {
    console.log(e)
    if (e.mark.item === 'topup') { //充值
      const res = await wx.showModal({
        title: '充值',
        showCancel: false,
        editable: true,
        placeholderText: '请输入整数金额'
      })
      const amount = parseInt(res.content)
      if (amount > 0) {
        this.topup(amount)
      }else{
        return;
      }
      
    }

  },
  async topup(amount){
    const now = new Date();
    const orderNum = app.createOrderNum(now,'sportShow');
    const payRes = await app.pay(amount,'精彩秀充值',appData.my_sub_mchid,orderNum);
    if (payRes === 'error') {
      return;
    }
    //支付成功  修改用户余额
    const res = await app.callFunction({
      name:'record_inc',
      data:{
        collection:'shop_account',
        query:{
          _id:appData.shop_account._id
        },
        record:'sportShowAmount',
        amount:amount
      }
    })
    console.log(res)
    if (res.success) {
      app.showToast('提示','充值成功!')
      this.setData({
        ['shop_account.sportShowAmount']:this.data.shop_account.sportShowAmount + amount
      })
      appData.shop_account.sportShowPrice = this.data.shop_account.sportShowAmount + amount
      return;
    }else{
      app.showModal('提示','充值失败,稍后查看,如已成功扣费未到账请联系客服!')
      return;
    }
  },
  async chengeBindTable(e) {
    console.log(e)
    //处理数据
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_device',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          [`camera.${e.mark.index}.channel.${e.mark.channelIndex}.bindTable`]:parseInt(e.detail.value) + 1
        }
      }
    })
    if (res.success) { //保存成功
      this.setData({
        [`shop_device.camera[${e.mark.index}].channel[${e.mark.channelIndex}].bindTable`]: parseInt(e.detail.value) + 1
      })
      app.showToast('保存成功!', 'success')
    } else { //保存失败
      app.showToast('保存失败!', 'error')
    }
  },
  async refreshDeviceState(cameraArray) {
    const stateArray = [];
    for (let index = 0; index < cameraArray.length; index++) {
      const element = cameraArray[index];
      const res = await imou.getDeviceOnline(element.cameraNum, this.data.imouAppID, this.data.imouAppSecret)
      console.log(res)
      if (res.result.msg === "操作成功。") { //操作成功
        if (res.result.data.onLine === "1") { //在线
          stateArray.push('1');
        } else { //不在线
          stateArray.push('0');
        }
      } else { //操作失败
        stateArray.push('0');
      }
    }
    return stateArray;
  },
  async bindDevice(deviceId, code) {
    const res = await imou.bindDevice(deviceId, code, this.data.imouAppID, this.data.imouAppSecret)
    if (res === 'ok') {
      app.showToast('绑定成功!', 'success')
    } else {
      app.showToast('绑定失败!', 'error')
    }
  },
  async unBindDevice(deviceId) {
    const res = await imou.unBindDevice(deviceId, undefined, undefined, this.data.imouAppID, this.data.imouAppSecret)
    if (res === 'ok') {
      app.showToast('解绑成功!', 'success')
      return {
        success:true,
        message:'unBind success',
        data:res
      }
    } else {
      app.showToast('解绑失败!', 'error')
      return {
        success:false,
        message:'unBind failed',
        data:res
      }
    }
  },
  cameraInfoToObj(cameraInfoString){
    const cameraInfo = cameraInfoString.slice(1,-1);
    const cameraInfoArray = cameraInfo.split(",")
    var newObj = {}
    for (let index = 0; index < cameraInfoArray.length; index++) {
      const element = cameraInfoArray[index];
      newObj = {
        ...newObj,
        [element.split(":")[0]]:element.split(":")[1]
      }
    }
    return newObj;
  },
  scan() {
    console.log('扫描摄像机二维码!')
    var that = this;
    wx.scanCode({
      scanType: 'QR_CODE',
      success(res) {
        console.log(res.result)
        const cameraInfoObj = that.cameraInfoToObj(res.result)
        console.log(cameraInfoObj)
        if ('SC' in cameraInfoObj) {//有安全吗
          
        }
        that.setData({
          cameraNum: 'SN' in cameraInfoObj ? cameraInfoObj.SN : '',
          cameraSecurityCode: 'SC' in cameraInfoObj ? cameraInfoObj.SC : '',
          cameraName: 'DT' in cameraInfoObj ? cameraInfoObj.DT : ''
        })
      }
    })
  },
  async delete(e) {
    const i = parseInt(e.mark.index);
    const camera = this.data.shop_device.camera;
    const newCamera = [];
    const result = await Dialog.confirm({
      title: '确认',
      message: `确认删除${camera[i].cameraNum}吗?`,
    }).catch(error => {
      // 处理错误  
      return;
    });
    if (result) {
      // 用户点击了"确定"  
    } else {
      // 用户点击了"取消"  
      return;
    }
    const unbindRes = await this.unBindDevice(camera[i].cameraNum); //解绑设备
    if (!unbindRes.success) {
      app.showToast('解绑失败!','error')
      return
    }
    for (let index = 0; index < camera.length; index++) { //删除 被选中删除的设备
      const element = camera[index];
      if (i !== index) {
        newCamera.push(element)
      }
    }
    //更新服务器数据
    app.showLoading('保存中...', true)
    //处理数据
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_device',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          camera:newCamera
        }
      }
    })
    if (res.success) {
      appData.shop_device.camera =  newCamera
      this.setData({
        shop_device: appData.shop_device,
      })
      this.setData({
        deviceState: await this.refreshDeviceState(this.data.shop_device.camera)
      })
      wx.hideToast({})
      app.showToast('保存成功!', 'success', )
    } else {
      wx.hideToast({})
      wx.showToast('保存失败!', 'error', )
    }
  },
  async priceSave(){
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_device',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          sportShowPrice:this.data.sportShowPrice
        }
      }
    })
    if (res.success) {
      appData.shop_device.sportShowPrice = this.data.sportShowPrice
      this.setData({
        [`shop_device.sportShowPrice`]:this.data.sportShowPrice
      })
      app.showToast('保存成功!','success')
      return;
    }else{
      app.showToast('保存失败!','error')
      return;
    }
  },
  async save() {
    //首先检测输入是否正确
    if (this.data.cameraNum === '') { //不判断 安全码 因为部分枪机没有安全码
      app.showToast('请输入正确编号', 'error')
      return
    }
    app.showLoading('保存中...', true)
    //封装设备数据
    var deviceData = {
      cameraNum: this.data.cameraNum,
      cameraSecurityCode: this.data.cameraSecurityCode,
      cameraName: this.data.cameraName,
    }
    const channel = []
    for (let index = 0; index < this.data.channel; index++) {
      channel.push({
        bindTable:0
      })
    }
    deviceData = {
      ...deviceData,
      channel
    }
    //处理数据
    const res = await app.callFunction({
      name: 'record_push',
      data: {
        collection: 'shop_device',
        query:{
          shopId:appData.shop_account._id
        },
        record:'camera',
        data:deviceData
      }
    })
    if (res.success) {
      await this.bindDevice(this.data.cameraNum, this.data.cameraSecurityCode)
      appData.shop_device.camera.push(deviceData)
      this.setData({
        shop_device: appData.shop_device,
        cameraNum: '',
        cameraSecurityCode: '',
        cameraName: ''
      })
      this.setData({
        deviceState: await this.refreshDeviceState(this.data.shop_device.camera)
      })
      wx.hideToast({})
      app.showToast('保存成功!', 'success', )
    } else {
      wx.hideToast({})
      wx.showToast('保存失败!', 'error', )
    }
  },
  input(e) {
    console.log(e);
    if (e.mark.item === 'cameraNum') {
      this.setData({
        cameraNum: e.detail.value
      })
    } else if (e.mark.item === 'cameraSecurityCode') {
      this.setData({
        cameraSecurityCode: e.detail.value
      })
    }else if (e.mark.item === 'sportShowPrice') {
      this.setData({
        sportShowPrice:parseInt(e.detail.value)
      })
    }else if (e.mark.item === 'channel'){
      this.setData({
        channel:parseInt(e.detail.value)
      })
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