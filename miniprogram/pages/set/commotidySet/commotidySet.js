// pages/set/commotidySet/commotidySet.js
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_commotidy: []

  },
  async goto(e) {
    var itemType = 'set';
    var itemSum = -1;
    var itemName = '';
    switch (e.mark.name) {
      case 'commotidyClassSet':
        itemSum = 6;
        itemName = '商品档案设置';
        break;
      case 'commotidyNameSet':
        itemSum = 6;
        itemName = '商品档案设置';
        break;
      case 'commotidyPurchaseSet':
        itemSum = 7;
        itemName = '商品采购入库';
        break;
      case 'commotidyPurchaseSet':
        itemType = 'statement';
        itemSum = 9;
        itemName = '补货记录';
        break;
    }
    if (itemSum === -1) {//不验证全向项
    } else {
      if (await app.power(itemType, itemSum, itemName) === false) {
        app.noPowerMessage();
        return;
      }
    }
    const that = this;
    wx.navigateTo({
      url: `./${e.mark.name}/${e.mark.name}`,
      events: {
        updata: function (data) {
          that.setData({
            shop_commotidy: data
          })
          console.log(that.data.shop_commotidy)
        }
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', {
          data: that.data.shop_commotidy
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.getCommotidy(appData.shop_account._id)
    console.log(this.data.shop_commotidy)
    
  },
  async getCommotidy(shopId) {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_commotidy',
        query: {
          shopId: shopId
        }
      }
    })
    console.log(res)
    if (res.success) {
      this.setData({
        shop_commotidy: res.data
      })
      appData.shop_commotidy = this.data.shop_commotidy
    } else {
      app.showModal('错误', '获取店铺商品信息错误!')
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return appData.globalShareInfo;
  }
})