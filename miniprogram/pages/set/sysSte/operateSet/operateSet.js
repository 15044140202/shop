// pages/set/sysSte/operateSet/operateSet.js
const app = getApp();
const appData = app.globalData;
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel: '营业参数设置',
    operateSet: {
      startSet: {
        detectDistance: true,
        phoneImpower: true,
        degree: 0
      },
      settleAmountsSet: {
        commotidyAtOncePay: true,
        payFor: true,
        scanQrPay: 0
      },
      commotidySet: {
        selfBuy: true
      },
      clientSet: {
        integralNoDispaly: false,
        amountSeparateDispaly: false,
        selfExchange: true,
        selfMerge: true,
        displayPrice: true
      },
      sweepSet: {
        sweep: true,
        sweepTime: 2
      }
    },
    sacnMode: ['客人扫收款码', '店员扫付款码'],
    paker: ['20.0元500条', '40.0元100条', '120.0元3000条', '200.0元5000条', '400.0元10000条'],
    pakerIndex: 0
  },
  pakerOnChange(e) {
    const amount = this.data.paker[e.detail.value].slice(0, e.detail.value > 1 ? 3 : 2)
    wx.showToast({
      title: `充值${amount}元`,
    })
  },
  change(e) {
    console.log(e)
    this.setData({
      ['operateSet.settleAmountsSet.scanQrPay']: e.detail.value
    })
  },
  set(e) {
    console.log(e)
    if (e.mark.name === 'sweepSet.sweepTime') { //打扫时间设置
      this.setData({
        ['operateSet.sweepSet.sweepTime']: e.detail.value
      })
    } else {
      this.setData({
        ['operateSet.' + e.mark.name + '.' + e.mark.name2]: this.data.operateSet[e.mark.name][e.mark.name2] === true ? false : true
      })
      console.log(this.data.operateSet[e.mark.name][e.mark.name2])
    }
  },
  async save() {
    app.showLoading('保存中...',true);
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'operateSet',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'operateSet',
        data:this.data.operateSet
      }
    })
    wx.hideLoading();
    if (res === 'ok') {
      app.showToast('保存成功!','success');
    }else{
      app.showToast('保存失败!','error');
    }
  },
  //获取 积分规则 函数
  async getOperateSet(shopFlag) {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'operateSet',
        record: 'operateSet',
        shopFlag: shopFlag
      }
    });
    console.log(res);
    return res;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading('加载中...', true);
    const res = await this.getOperateSet(appData.shopInfo.shopFlag);
    if ('startSet' in res) {
      console.log('保存服务器返回数据!');
      this.setData({ //设置获取的 服务器数据
        operateSet: res
      })
    } else {
      console.log('服务器无数据,执行保存默认配置!');
      await this.save()
    }
    wx.hideLoading();
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