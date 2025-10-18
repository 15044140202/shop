// pages/set/sysSte/sysSte.js
const app = getApp();
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appGlobalData: appData,
    menuData: {
      operateSet: {
        name: "营业参数设置",
        to: './operateSet/operateSet'
      },
      waiter: {
        name: "员工及权限",
        to: './waiter/waiter'
      },
      wxAccount: {
        name: "微信收款账号",
        to: './wxAccount/wxAccount'
      },
      deviceManage: {
        name: '设备管理',
        to: './deviceManage/deviceManage'
      },
      integralSet: {
        name: '积分规则设置',
        to: './integralSet/integralSet'
      },
      suggest: {
        name: '建议/意见',
        to: './suggest/suggest'
      },
      shop_transfer: {
        name: '店铺转让',
        to: './shopTransfer/shopTransfer'
      }
    },
    iconMap: {
      '营业参数设置': 'setting',
      '员工及权限': 'friends',
      '微信收款账号': 'wechat-pay',
      '设备管理': 'cluster',
      '积分规则设置': 'gold-coin',
      '建议/意见': 'comment',
      '店铺转让': 'exchange'
    }
  },
  async goto(e) {
    console.log(e)
    var itemName = '';
    var itemType = "set";
    switch (e.mark.to) {
      case './operateSet/operateSet':
        itemType = 'systemSet';
        itemName = '营业参数设置';
        break;
      case './waiter/waiter':
        itemName = '员工及权限';
        break;
      case './wxAccount/wxAccount':
        itemType = 'systemSet';
        itemName = '微信收款账号设置';
        break;
      case './deviceManage/deviceManage':
        itemType = 'systemSet';
        itemName = '设备管理';
        break;
      case './integralSet/integralSet':
        itemName = '积分规则设置';
        break;
      case './shopTransfer/shopTransfer':
        itemName = '店铺转让';
        break;
      case './suggest/suggest':
        itemName = '建议/意见';
        break;
      default:
        app.showToast('权限获取错误!', 'error')
    }
    console.log({ [itemType]: itemName })
    if (!await app.power(itemType, itemName)) {
      app.showToast('没有权限', 'error');
      return;
    }
    wx.navigateTo({
      url: e.mark.to,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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