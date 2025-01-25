// pages/set/set.js
const app = getApp()
const appData = app.globalData;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shop_account: appData.shop_account,
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
        name: "优惠券/团购券/营销管理",
        to: './marketing/marketing'
      },
      setmeal: {
        logo1: 'discount-o',
        name: "包时段/套餐管理",
        to: './setmeal/setmeal'
      },
      reserve: {
        logo1: 'todo-list-o',
        name: "预定管理"
      },
      handbook: {
        logo1: 'question-o',
        name: "系统使用指南"
      }
    }
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
    if (itemSum === -1) { //不鉴别权限的项目
    } else {
      if (await app.power(itemType, itemSum, itemName) === false) {
        app.showToast('没有权限', 'error');
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
    const that = this
    //获取店铺Logo
    app.getHeadImage(this.data.shop_account.shopInfo.logoId).then(res =>{
      that.setData({
        shopLogo:res
      })
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
  async onShow() {
    if (appData.shop_account.id === this.data.shop_account._id) { //判断有没有切换店铺
      return;
    }
    this.setData({
      shop_account: appData.shop_account
    })
    //获取店铺Logo
    const that = this
    app.getHeadImage(this.data.shop_account.shopInfo.logoId).then(res =>{
      that.setData({
        shopLogo:res
      })
    })

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