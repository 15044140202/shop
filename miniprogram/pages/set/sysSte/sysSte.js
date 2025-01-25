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
      lightSet: {
        name: '灯控器设置',
        to: './lightSet/lightSet'
      },
      printerSet: {
        name: '打印机设置',
        to: './printerSet/printerSet'
      },
      doorSet: {
        name: '门禁设置',
        to: './doorSet/doorSet'
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
    }
  },
  async goto(e) {
    var itemName = '';
    var itemNum = 0;
    var itemType = "set";
    switch (e.mark.to) {
      case './operateSet/operateSet':
        itemType = 'systemSet';
        itemNum = 3;
        itemName = '营业参数设置';
        break;
      case './waiter/waiter':
        itemName = '员工及权限';
        itemNum = 1;
        break;
      case './wxAccount/wxAccount':
        itemType = 'systemSet';
        itemNum = 0;
        itemName = '微信收款账号设置';
        break;
      case './lightSet/lightSet':
        itemType = 'systemSet';
        itemNum = 1;
        itemName = '灯控器设置';
        break;
      case './printerSet/printerSet':
        itemType = 'systemSet';
        itemNum = 2;
        itemName = '打印机设置';
        break;
      case './doorSet/doorSet':
        itemType = 'systemSet';
        itemNum = 6;
        itemName = '门禁设置';
        break;
      case './deviceManage/deviceManage':
        itemType = 'systemSet';
        itemNum = 6;
        itemName = '门禁设置';
        break;
      case './integralSet/integralSet':
        itemNum = 5;
        itemName = '积分规则设置';
        break;
      case './shopTransfer/shopTransfer':
        itemNum = 999;
        itemName = '店铺转让';
        break;
      case './suggest/suggest':
        itemNum = 9;
        itemName = '建议和评价';
        break;
      default:
        app.showToast('权限获取错误!', 'error')
    }
    if (!appData.status === 'boss') {//老板不需要验证权限
      if (await app.power(itemType, itemNum, itemName) === false) {
        app.showToast('没有权限', 'error');
        return;
      }
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