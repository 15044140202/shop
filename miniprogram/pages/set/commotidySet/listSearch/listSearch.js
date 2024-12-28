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
    startSum: 1,
    endSum: 20,
    noData: false

  },
  async getdata() {
    const res = await wx.cloud.callFunction({
      name: 'getDatabaseArray_fg',
      data: {
        collection: 'commotidy',
        shopFlag: appData.shopInfo.shopFlag,
        ojbName: 'list',
        startSum: this.data.startSum,
        endSum: this.data.endSum
      }
    })
    if (res.errMsg === "cloud.callFunction:ok") { //调用函数成功!
      if(res.result == 'error'){//没有数据
        wx.showToast({
          title: '没有数据!',
          icon:'error'
        })
        return;
      }
      console.log(res.result)
      if (res.result.length > 0) {
        for (let index = 0; index < res.result.length; index++) {
          const element = res.result[index];
          this.data.list.push(element)
        }
        this.data.startSum += 20;
        this.data.endSum += 20;
        this.setData({
          list: this.data.list
        })
        return;
      } else { //没有数据了
        this.setData({
          noData:true
        })
        console.log('没有数据了!')
      }
    } else {
      wx.showToast({
        title: '获取数据失败!',
        icon: 'error'
      })
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
    if(this.data.noData === true){
      wx.showToast({
        title: '没有更多数据了!',
        icon:'error'
      })
    }else{
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