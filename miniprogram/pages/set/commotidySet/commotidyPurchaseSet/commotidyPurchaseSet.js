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
    shop_commotidy: [],
    class: [],
    active: 0,
    addCommotidy: [],
    inventoryHidden: false,
    sum: 0
  },
  async save() {
    var payMode = '微信';
    this.deletZero();


    console.log(this.data.addCommotidy)
    //生成入库记录
    var commotidyList = []
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      commotidyList.push({
        name: this.data.shop_commotidy[element.index].name,
        sum: element.sum,
        price: this.data.shop_commotidy[element.index].primeCost,
        _id: this.data.shop_commotidy[element.index]._id
      })
    }
    const order = {//进货单
      shopId: appData.shop_account._id,
      orderName: '进货单',
      status: appData.status,
      time: new Date().getTime(),
      commotidyList: commotidyList,
      amount: this.data.sum,
      payMode: payMode,
    }
    //云函数进货流程
    const res = await app.callFunction({
      name: 'commotidyPurchase',
      data: {
        order: order,
      }
    })
    if (!res.success) {
      app.showToast('入库失败!', 'error')
    }

    //修改库存数量 //先处理本地商品数据
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      this.data.shop_commotidy[element.index].sum = parseInt(this.data.shop_commotidy[element.index].sum) + parseInt(element.sum)
    }

    this.setData({
      shop_commotidy: this.data.shop_commotidy,
      addCommotidy: [],
      sum: 0
    })
    app.showToast('入库成功!', 'success')
    return;
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
      sum = sum + parseFloat(this.data.shop_commotidy[element.index].primeCost) * parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum: sum
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
        shop_commotidy: data.data
      })
      console.log(that.data.shop_commotidy)
      that.computeClass(that.data.shop_commotidy)
    })
  },
  computeClass(shop_commotidy) {
    const newClass = []
    for (let index = 0; index < shop_commotidy.length; index++) {
      const element = shop_commotidy[index];
      if (!newClass.includes(element.class)) {
        newClass.push(element.class)
      }
    }
    this.setData({
      class: newClass
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