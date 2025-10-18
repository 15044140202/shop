// pages/set/sysSte/wxAccount/wxAccount.js
const app = getApp();
const appData = app.globalData;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    proceedAccount: ''
  },
  apply(){
    app.showToast('请联系客服!','none')
  },
  async goto(e){
    console.log(e.mark)
    //检测权限
    if (e.mark.item === 'rePay') {
      if (await app.power('systemSet', '退款/部分退款')) {
        console.log('有权限');
      } else {
        app.showToast('没有权限', 'error');
        return;
      }
    }
    wx.navigateTo({
      url: `./${e.mark.item}/${e.mark.item}`,
    })
  },
  async payTest() {
    const res = await app.callFunction({
      name: 'unifiedOrder',
      data: {
        amount: '1',
        description: '账号测试',
        sub_mchid: this.data.proceedAccount,
        out_trade_no: new Date().getTime() + '2024n06y06r'
      }
    })
    console.log(res)
    if (res === undefined) { //错误
      app.showToast('支付数据错误!', 'error')
      return;
    }
    // 唤起微信支付组件，完成支付
    try {
      const payRes_ = await app.requestPayment(res)
      console.log(payRes_)
      if (payRes_.errMsg === "requestPayment:ok") {
        app.showToast('支付成功!', 'success')
      }
    } catch (error) {
      console.log(error)
      app.showToast('支付失败!', 'error')
    }
  },
  async save() {
    if (!await app.power('dd','dd')) {
      app.showModal('提示','只有老板可以设置收款账号!')
      return
    }
    if (!this.data.proceedsAccount) {
      wx.showToast({
        title: '请正确输入商户号',
        icon: 'error'
      })
    } else {
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'shop_account',
          query:{
            _id:appData.shop_account._id
          },
          upData:{
            proceedAccount:this.data.proceedsAccount
          }
        }
      })
      if (res.success) {
        appData.shop_account.proceedAccount = this.data.proceedAccount
        app.showToast('保存成功!', 'success')
      }else{
        app.showToast('保存失败!', 'error')
      }

    }
  },
  proceedsAccount(e) {
    console.log(e.detail.value)
    this.setData({
      proceedsAccount: e.detail.value
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      proceedAccount: appData.shop_account.proceedAccount
    })
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