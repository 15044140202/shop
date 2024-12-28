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
    rePayMode: 'wx'
  },
  async pushLog() {
    const now = new Date();
    const orderDate = app.getOrderFormDate(this.data.order);
    const log = `${app.getNowTime(now)}${appData.status}---退款${this.data.amount}元`;
    const res = await app.callFunction({
      name: 'pushOrderLog',
      data: {
        shopFlag: appData.shopInfo.shopFlag,
        orderNum: this.data.order,
        orderFormDate: orderDate,
        log: log
      }
    })
    if (res === 'ok') {
      app.showToast('日志保存成!');
      return 'ok'
    } else {
      app.showToast('日志保存失败!');
      return 'error';
    }
  },
  async rePay() {
    if (this.data.rePayMode === 'wx' || this.data.rePayMode === '微信') {
      const now = new Date();
      const res = await app.refund((this.data.orderAmount * 100).toString(), (this.data.amount * 100).toString(), this.data.order, app.createOrderNum(now, 'SDTK'), appData.shopInfo.proceedsAccount)
      console.log(res)
      if (res === 'ok') {
        app.showToast('退款成功', 'success')
        await this.pushLog();
      }
    } else if (this.data.rePayMode === 'cash' || this.data.rePayMode === '现金') {
      await this.pushLog();
      Dialog.alert({
        title: '提示',
        message: `请退现金${this.data.amount}元`,
      }).then(() => {
        // on close
      });
    }else{
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
  input(e) {
    console.log(e)
    if (e.mark.item === 'amount') {
      if (parseInt(e.detail.value) > parseInt(this.data.tableCost)) { //退款金额大于订单结
        this.setData({
          amount: this.data.tableCost
        })
      } else {
        this.setData({
          amount: e.detail.value
        })
      }
    } else if (e.mark.item === 'order') {
      this.setData({
        order: e.detail.value
      })
    } else if (e.mark.item === 'orderAmount') {
      this.setData({
        orderAmount: e.detail.value
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);
    if ('order' in options) { //有带账单 金额 进来
      this.setData({
        order: options.order,
        orderAmount: options.amount,
        tableCost: options.tableCost,
        rePayMode: options.rePayMode
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