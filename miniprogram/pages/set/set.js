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
      operateSet: {
        logo1: 'setting-o',
        name: "营业参数设置",
        to: './sysSte/operateSet/operateSet'
      },
      deviceManage: {
        logo1: 'apps-o',
        name: "物联网设备管理",
        to: './sysSte/deviceManage/deviceManage'
      },
      waiter: {
        logo1: 'manager-o',
        name: "员工及权限设置",
        to: './sysSte/waiter/waiter'
      },
      wxAccount: {
        logo1: 'wechat-pay',
        name: "收款商户号设置",
        to: './sysSte/wxAccount/wxAccount'
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
        logo1: 'vip-card-o',
        name: "会员级别设置",
        to: './vipSet/vipSet'
      },
      integralSet: {
        logo1: 'gem-o',
        name: "积分规则设置",
        to: './sysSte/integralSet/integralSet'
      },
      commodity: {
        logo1: 'shop-collect-o',
        name: "商品管理",
        to: './commotidySet/commotidySet'
      },
      coupon: {
        logo1: 'coupon-o',
        name: "优惠券/团购券/营销活动管理",
        to: './marketing/marketing'
      },
      groupBuying: {
        logo1: 'flag-o',
        name: "团购管理",
        to: './groupBuying/groupBuying'
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
      shopTransfer: {
        logo1: 'exchange',
        name: "店铺转让",
        to: './sysSte/shopTransfer/shopTransfer'
      },
      suggest: {
        logo1: 'chat',
        name: "开发建议反馈",
        to: './sysSte/suggest/suggest'
      },
      handbook: {
        logo1: 'question-o',
        name: "系统使用指南"
      }
    }
  },
  async goto(e) {
    console.log(e)
    var itemType = 'set';
    var itemName = '';
    switch (e.mark.to) {//./sysSte/wxAccount/wxAccount
      case './sysSte/operateSet/operateSet':
        itemType = 'systemSet'
        itemName = '营业参数设置';
        break
      case './sysSte/wxAccount/wxAccount':
        itemType = 'systemSet'
        itemName = '微信收款账号设置';
        break
      case './sysSte/waiter/waiter':
        itemName = '员工及权限';
        break
      case './shopSet/shopSet':
        itemName = '店铺设置';
        break
      case './noticeSet/noticeSet':
        itemName = '公告管理';
        break;
      case './chargingSet/chargingSet':
        itemName = '计费规则及桌台档案';
        break;
      case './vipSet/vipSet':
        itemName = '会员优惠设置';
        break;
      case './sysSte/integralSet/integralSet':
        itemName = '积分规则设置';
        break;
      case './groupBuying/groupBuying':
        itemName = '团购接入管理';
        break;
      case './marketing/marketing':
        itemName = '营销活动管理';
        break;
      case './setmeal/setmeal':
        itemName = '套餐设置';
        break;
      case './sysSte/shopTransfer/shopTransfer':
        itemName = '店铺转让';
        break;
    }
    if (!itemName) { //不鉴别权限的项目

    } else {
      console.log({ [itemType]: itemName })
      if (!await app.power(itemType, itemName)) {
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
    app.getHeadImage(this.data.shop_account.shopInfo.logoId).then(res => {
      that.setData({
        shopLogo: res
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
    app.getHeadImage(this.data.shop_account.shopInfo.logoId).then(res => {
      that.setData({
        shopLogo: res
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