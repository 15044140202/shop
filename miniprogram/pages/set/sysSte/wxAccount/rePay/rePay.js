// pages/set/sysSte/wxAccount/rePay/rePay.js
const app = getApp();
const appData = app.globalData;
import Dialog from '@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: '',
    orderAmount: '',
    amount: '',
    rePayMode: 'wx',
    tableCost : 9999,
    isFormValid: false,
    isAmountInvalid: false,
  },
  async pushLog() {
    const now = new Date();
    const order = this.data.order

    const log = `${app.getNowTime(now)}${appData.status}---退款${this.data.amount}元`;
    const res = await app.callFunction({ 
      name: 'upDate',
      data: {
        collection:'table_order',
        query: {
          orderNum:order
        },
        _push:{
          'log':log
        },
        upData:{
          tableCost:this.data.orderAmount - this.data.amount
        }
      }
    })
    if (res.success) {
      app.showToast('日志保存成!');
      return 'ok'
    } else {
      app.showToast('日志保存失败!');
      return 'error';
    }
  },
  // 实时校验逻辑 
  checkFormValidity() {
    const valid = this.data.order &&
      this.data.orderAmount > 0 &&
      this.data.amount > 0 &&
      this.data.amount <= this.data.orderAmount;

    this.setData({
      isFormValid: valid,
      isAmountInvalid: this.data.amount > this.data.orderAmount
    });
  },
  verifyRepayData(){
    const refundAmount = this.data.amount
    const orderNunm = this.data.order
    const totalAmount = this.data.orderAmount
    if (!refundAmount ||!orderNunm || !totalAmount ) {
      app.showModal('提示','数据不完整,所有选项必须都准确填写!')
      throw '退款数据错误! --- ERROR'
    }else if(refundAmount > totalAmount){
      app.showModal('提示','退款金额不能大于订单总金额!')
      throw '退款数据错误! --- ERROR'
    }else{
      return true
    }
  },
  async rePay() {
    if (! await app.power('systemSet','退款/部分退款')) {
      app.noPowerMessage()
      return
    }
    this.verifyRepayData()//验证数据
    if (this.data.rePayMode === 'wx' || this.data.rePayMode === '微信') {
      const now = new Date();
      const res = await app.callFunction({
        name:'order_refund',
        data:{
          orderNum:this.data.order, 
          refundOrderNum:app.createOrderNum(now, 'SDTK'), 
          orderAmount:this.data.orderAmount, 
          refundAmount:this.data.amount, 
          sub_mchid:appData.shop_account.proceedAccount,
          userName:`店员:${appData.status}`
        }
      })
      console.log(res)
      if (res.success) {
        app.showToast('退款成功', 'success')
      }else{
        if(res.data.result.data.err_code_des){
          app.showModal('退款错误!',res.data.result.data.err_code_des)
        }else{
          app.showModal('退款错误!',res.data.result.Error)
        }
      }
    } else if (this.data.rePayMode === 'cash' || this.data.rePayMode === '现金') {
      await this.pushLog();
      Dialog.alert({
        title: '提示',
        message: `请退现金${this.data.amount}元`,
      }).then(() => {
        // on close
      });
    } else {
      Dialog.alert({
        title: '提示',
        message: `不支持${this.data.rePayMode}模式退款!`,
      }).then(() => {
        // on close
      });
    }
    this.setData({
      order: '',
      orderAmount: '',
      amount: '',
      tableCost: ''
    })
    return;
  },
  async scan() {
    const cardId = await wx.scanCode({
      onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
    });
    console.log(cardId)
    if (cardId !== undefined) {
      this.setData({
        order: cardId.result,
      })
    }
  },
  // 输入处理 
  inputOrder(e) {
    const value = e.detail.value.replace(/[^a-zA-Z0-9]/g, '');
    this.setData({ order: value }, this.checkFormValidity);
  },

  inputOrderAmount(e) {
    const value = Number(e.detail.value);
    if (value === 0 & this.data.orderAmount === 0) {
      return
    }else if (value === this.data.orderAmount){
      return
    }
    this.setData({ orderAmount: value }, this.checkFormValidity);
  },

  inputAmount(e) {
    let value = Number(e.detail.value);
    if (value > this.data.tableCost) {
      value = this.data.tableCost
    }
    this.setData({ amount: value }, this.checkFormValidity);
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);
    if ('order' in options) { //有带账单 金额 进来
      this.setData({
        order: options.order,
        orderAmount: parseInt(options.amount) ,
        tableCost: parseInt(options.tableCost),
        rePayMode: options.rePayMode,
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

  }
})