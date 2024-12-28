// pages/set/commotidySet/commotidyPurchaseSet/commotidyPurchaseSet.js
const app = getApp();
const appData = app.globalData;
import Dialog from '@vant/weapp/dialog/dialog';
const utils = require('../../../../utils/light');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    active: 0,
    addCommotidy: [],
    inventoryHidden: false,
    sum: 0
  },
  async save() {
    var payMode = '微信';
    this.deletZero();
    //修改库存数量 //先处理本地商品数据
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      this.data.commotidy[element.class].commotidy[element.index].sum = parseInt(this.data.commotidy[element.class].commotidy[element.index].sum) + parseInt(element.sum)
    }

    console.log(this.data.commotidy)
    //生成入库记录
    var commotidyList = []
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      commotidyList.push({
        name: this.data.commotidy[element.class].commotidy[element.index].name,
        sum: -element.sum,
        price: this.data.commotidy[element.class].commotidy[element.index].primeCost
      })
    }
    const list = {//进货记录
      status: appData.status,
      time: app.getNowTime(),
      commotidy: commotidyList,
      amount: this.data.sum / 100
    }
    const order = {//进货单
      orderName: '进货单',
      status: appData.status,
      time: app.getNowTime(),
      commotidy: commotidyList,
      amount: this.data.sum / 100,
      payMode: payMode
    }
    //修改商品库存数量
    const res = await app.callFunction({
      name: 'commotidyPurchase',
      data: {
        shopFlag: appData.shopInfo.shopFlag,
        addCommotidy: this.data.addCommotidy,
        list: list,
        date: app.getNowDate(),
        orderData: order
      }
    })
    if (res !== 'ok') {
      app.showToast('入库失败!','error')
    }
    this.setData({
      commotidy: this.data.commotidy,
      addCommotidy: [],
      sum: 0
    })
    app.showToast('入库成功!','success')
    return;
  },
  async getList(shopFlag) {
    const res = await wx.cloud.callFunction({
      name: 'getDatabaseArray_fg',
      data: {
        collection: 'commotidy',
        shopFlag: shopFlag,
        ojbName: 'list',
        startSum: 1,
        endSum: 20
      }
    })
    return res;
  },
  deletZero() {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (element.sum == '0') { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
  },
  delete(e) {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (e.mark.index == index) { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
    this.getSum()
  },
  addCommotidy(e) {
    console.log(e)
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (element.class === e.mark.class && element.index === e.mark.index) { //已经添加过的商品
        this.setData({
          [`addCommotidy[${index}].sum`]: this.data.addCommotidy[index].sum + 1
        })
        this.getSum()
        return;
      }
    }

    this.data.addCommotidy.push({
      class: e.mark.class,
      index: e.mark.index,
      sum: 1
    })
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    this.getSum()
    console.log(this.data.addCommotidy)
  },
  input(e) {
    if (e.detail.value === '') {
      this.data.addCommotidy[e.mark.index].sum = 0;
    } else {
      this.setData({
        [`addCommotidy[${e.mark.index}].sum`]: parseInt(e.detail.value)
      })
    }
    this.getSum()
    console.log(this.data.addCommotidy[e.mark.index].sum)
  },
  getSum() {
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum + parseFloat(this.data.commotidy[element.class].commotidy[element.index].primeCost) * parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum: sum * 100
    })
  },

  hidden() {
    this.data.inventory === true ? this.setData({
      inventory: false
    }) : this.setData({
      inventory: true
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      that.setData({
        commotidy: data.data
      })
      console.log(that.data.commotidy)
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
    return appData.globalShareInfo;
  }
})