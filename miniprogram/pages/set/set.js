// pages/set/set.js
const utils = require('../../utils/light')
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shopLogo: '',
    MenuData: {
      set: {
        logo1: 'setting-o',
        name: "系统设置",
        to: './sysSte/sysSte'
      },
      notice: {
        logo1: 'volume-o',
        logo2: app.globalData.imgRight,
        name: "公告管理",
        to: './noticeSet/noticeSet'
      },
      charging: {
        logo1: 'cash-o',
        name: "计费规则设置",
        to: './chargingSet/chargingSet'
      },
      vipset: {
        logo1: 'gem-o',
        name: "会员级别设置",
        to: './vipSet/vipSet'
      },
      commodity: {
        logo1: 'shop-collect-o',
        name: "商品管理",
        to: './commotidySet/commotidySet'
      },
      vipmanagement: {
        logo1: 'vip-card-o',
        name: "会员管理",
        to: './vipManage/vipManage'
      },
      masstexting: {
        logo1: 'envelop-o',
        name: "短信群发",
        to: './shortMassageSend/shortMassageSend'
      },
      coupon: {
        logo1: 'coupon-o',
        name: "优惠券/团购券管理"
      },
      setmeal: {
        logo1: 'discount-o',
        name: "套餐/包场管理"
      },
      reserve: {
        logo1: 'todo-list-o',
        name: "预定管理"
      },
      handbook: {
        logo1: 'question-o',
        name: "系统使用指南"
      }
    },
    shopLogo: 'https://636c-cloud1-4ga7jm4aad5de5c5-1324387207.tcb.qcloud.la/image/logo.png?sign=c6e59dead3a4eb455fca0e138d50a990&t=1712451692'
  },
  async goto(e) {
    var itemType = 'set';
    var itemName = '';
    var itemSum = -1;
    switch (e.mark.to) {
      case './noticeSet/noticeSet':
        var itemName = '公告管理';
        var itemSum = 14;
        break;
      case './chargingSet/chargingSet':
        var itemName = '计费规则及桌台档案';
        var itemSum = 2;
        break;
      case './vipSet/vipSet':
        var itemName = '会员优惠设置';
        var itemSum = 3;
        break;
      case './vipManage/vipManage':
        var itemName = '会员档案设置';
        var itemSum = 4;
        break;
      case './shortMassageSend/shortMassageSend':
        var itemName = '短信设置及群发';
        var itemSum = 8;
        break;
    }
    if(itemSum === -1){//不鉴别权限的项目
    }else{
      if (await app.power(itemType,itemSum,itemName) === false) {
        app.showToast('没有权限','error');
        return;
      }
    }
    wx.navigateTo({
      url: e.mark.to,
    })
    return
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //判断shopInfo.logoId 是否为空   如果为空  使用默认LOGO 
    if (app.globalData.shopLogo === '') {
      const url = await utils.getLogo(app.globalData.shopInfo.logoId)
      app.globalData.shopLogo = url
    }
    this.setData({
      shopLogo: app.globalData.shopLogo
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})