// pages/set/commotidySet/listSearch/listSearch.js
const app = getApp();
const appData = app.globalData;
const utils = require('../../../../utils/light');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    count: 1,
    limit: 100,
    skit: 0
  },
  computeSkit(limit,list){
    return list / limit
  },
  async getdata() {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        query: {
          shopId: appData.shop_account._id
        },
        collection:'shop_commotidy_po',
        skip:this.computeSkit(this.data.limit,this.data.list),
        limit:this.data.limit,
        orderBy:('time|desc')
      }
    })
    if (res.success) { //调用函数成功!
      this.data.list.push.apply(this.data.list,res.data.data)
      this.setData({
        list:this.data.list,
        count:res.count.total
      })  
    } else {
      app.showToast('获取数据失败!','error')
      return;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    wx.showLoading({
      title: '数据加载中!'
    });
    await this.getdata();
    console.log(this.data.list);
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
  async onReachBottom() {
    if (this.data.count <= this.data.list.length) {
      app.showToast('没有更多数据了!','error')
    } else {
      wx.showLoading({
        title: '数据加载中!'
      });
      await this.getdata();
      console.log(this.data.list);
      wx.hideLoading();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return appData.globalShareInfo;
  }
})