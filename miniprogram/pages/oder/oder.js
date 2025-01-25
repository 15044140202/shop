// pages/oder/oder.js
const app = getApp();
const appData = getApp().globalData;
const utils = require('../../utils/light');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    position: '',
    time: '',
    shopId: '',
    shopName: '',
    name: '',
    telephone: '',
    timeOut: false
  },
  input(event) {
    console.log(event)
    if (event.detail.value != '') {
      this.data.name = event.detail.value
    }
  },
  async getPhoneNumber(e) {
    console.log(e.detail.code) // 动态令牌
    console.log(e.detail.errMsg) // 回调信息（成功失败都会返回）
    console.log(e.detail.errno) // 错误码（失败时返回）
    if (e.detail.code === undefined) {
      console.log('没有获取到CODE!');
      return;
    }
    const res = await app.callFunction({
      name: 'getPhoneNum',
      data: {
        code: e.detail.code
      }
    })
    console.log(res)
    //获得到 电话号码 
    var phoneNum = '';

    if ("phoneInfo" in res) {
      phoneNum = res.phoneInfo.phoneNumber
      console.log({
        '手机号码:': phoneNum
      })
      this.setData({
        telephone: phoneNum
      })
    } else {
      console.log('没有获取到手机号码!')
    }
  },
  examine(merchantInfo, shopFlag) { //此函数  用于检查 本用户的 merchant_info 里面是否已经有 要添加的店铺  有返回true 没有返回false
    console.log(merchantInfo)
    console.log(shopFlag)
    for (let index = 0; index < merchantInfo.shopFlag.length; index++) {
      const element = merchantInfo.shopFlag[index];
      if (element.shopFlag === shopFlag) {
        return true
      }
    }
    return false
  },
  async confirm() {
    if (this.data.name === '') {
      app.showToast('请输入姓名', 'error');
      return;
    }else if (this.data.telephone === '') {
      app.showToast('请输入电话', 'error');
      return;
    }
    if (this.data.timeOut === true) {
      app.showToast('二维码过期!', 'error');
    } else {
      app.cloudInit()
      const res = await app.getMerchantInfo()
      console.log(res)
      const merchantInfo = res[0]
      console.log(merchantInfo)
      for (let index = 0; index < merchantInfo.shopId.length; index++) {
        const element = merchantInfo.shopId[index];
        if (element.shopId === this.data.shopId) {
          app.showModal('错误', '已经是店员,禁止重复添加.')
          return
        }
      }
      //向merchant_info 里面添加本店铺数据
      const merchantUpdataRes = await app.callFunction({
        name: 'addMember',
        data: {
          shopId: this.data.shopId,
          shopName: this.data.shopName,
          position: this.data.position,
          telephone: this.data.telephone
        }
      })
      if (merchantUpdataRes.success) {
        app.showToast('添加成功!', 'success')
        wx.restartMiniProgram({
          path: "../login/login"
        })
      } else {
        app.showToast('添加信息失败!', 'error')
      }
    }
  },
  async addNewMember() {
    const res = await utils.addArrayDatabase({
      collection: 'shopAccount',
      openid: appData.shopInfo._openid,
      objName: 'shop.member',
      data: {
        name: '未命名',
        position: this.data.position
      }
    });
    if (res === 'ok') {
      console.log('添加成功!')
    } else {
      console.log('添加失败!')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(query) {
    let _id = undefined
    console.log(query)
    if ('scene' in query) {
      _id = query.scene
    } else {//模拟测试
      _id = '27txO7hZxj0uSZZYrKz3aqvB7QkO'
    }
    console.log(_id)
    const qrData = await app.callFunction({
      name: 'getData_doc',
      data: {
        collection: 'shop_qr_data',
        _id: _id
      }
    })
    console.log(qrData)
    //此处分析分支  
    if (qrData.data.itemName === 'addWaiter') {//添加服务员
      this.setData({
        position: qrData.data.position,
        time: qrData.data.time,
        shopId: qrData.data.shopId,
        shopName: qrData.data.shopName
      })
      const now = new Date().getTime();
      console.log(now)
      if ((now - this.data.time) / 1000 / 60 > 50) {
        app.showToast('二维码过期!', 'error');
        this.data.timeOut = true;
      }
    }else if (qrData.data.itemName === 'shopTransfer'){//店铺转让
      await this.shopTransfer(qrData.data)
    }
  },
  async shopTransfer(old_shopInfo){
    //判断二维码是否失效
    if (new Date().getTime() - old_shopInfo.time > 10 * 60 *1000) {//大于十分钟 过期
      app.showModal('提示','二维码已过期!')
      return
    }
    //调用店铺转让云函数
    const res = await app.callFunction({
      name:'shop_transfer',
      data:{
        ...old_shopInfo
      }
    })
    if (res.success) {
      await app.showModal('提示','信息处理成功!')
      wx.navigateTo({
        url: '../login/login',
      })
    }else{
      await app.showModal('提示','更新转让信息错误!')
      return
    }
  },
  async getMerchantInfo() {
    const res = await wx.cloud.callFunction({
      name: 'getShopFlag',
    })
    console.log(res.result[0])
    return res.result[0]
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
    return appData.globalShareInfo;
  }
})