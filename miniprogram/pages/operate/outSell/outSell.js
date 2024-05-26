// pages/set/commotidySet/commotidyPurchaseSet/commotidyPurchaseSet.js
const utils = require('../../../utils/light')
const appData = getApp().globalData;
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    active: 0,
    addCommotidy: [],
    inventoryHidden: false,
    sum: 0,

    hidden: true

  },
  async pay() {
    //此处加入支付 代码  支付成功  修改库存 与出库记录   否则 返回

    //***************支付 代码  待补充 */

    this.deletZero();
    if (this.data.addCommotidy.length != 0) {
      for (let index = 0; index < this.data.addCommotidy.length; index++) {
        const element = this.data.addCommotidy[index];
        //先处理本地商品数据
        this.data.commotidy[element.class].commotidy[element.index].sum = parseInt(this.data.commotidy[element.class].commotidy[element.index].sum) - parseInt(element.sum)
      }
      console.log(this.data.commotidy)
      //修改商品库存数量
      const res = await app.callFunction({
        name:'subtractCommotidySum',
        data:{
          shopFlag:appData.shopInfo.shopFlag,
          commotidyInfo:this.data.addCommotidy
        }
      })
      if (res === 'ok') {
        wx.showToast({
          title: '提交成功!',
          icon: 'success'
        })
        //生成售卖商品清单
        var commotidyList = []
        for (let index = 0; index < this.data.addCommotidy.length; index++) {
          const element = this.data.addCommotidy[index];
          commotidyList.push({
            name: this.data.commotidy[element.class].commotidy[element.index].name,
            sum: element.sum,
            price: this.data.commotidy[element.class].commotidy[element.index].sellCost
          })
        }
        //发送商品单
        const now = new Date();
        const date = app.getNowDate(now);
        const data = {
          sellPerson: appData.status,
          orderName: '商品单',
          time: app.getNowTime(now),
          payMode: '现金/微信',
          orderNum: app.createOrderNum(now,'S'),
          integral: "0",
          commotidyList: commotidyList,
          commotidyCost: this.data.sum / 100
        }
        console.log(data)
        const r = await app.callFunction({
          name: 'addOrder',
          data: {
            shopFlag: appData.shopInfo.shopFlag,
            date: date,
            data: data
          }
        })
        if (r === 'ok') {
          console.log('修改记录保存成功!');
          app.showToast('提交成功!','success');
        } else {
          app.showToast('提交失败!','error');
        }
        this.setData({
          commotidy: this.data.commotidy,
          addCommotidy: [],
          sum: 0
        })
        return;
      } else {
        app.showToast('提交失败!','error')
      }

    } else {
      app.showToast('没有商品!','error')
      return;
    }
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
    //首先检测这个商品是否已添加到添加列表了
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (e.mark.class === element.class && e.mark.index === element.index) {//已被添加的商品
        this.setData({
          [`addCommotidy[${index}].sum`]:this.data.addCommotidy[index].sum + 1
        })
        return;
      }
    }
    //添加新商品
    this.data.addCommotidy.push({
      class: e.mark.class,
      index: e.mark.index,
      sum: 1
    })
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    console.log(this.data.addCommotidy)
  },
  input(e) {
    if (e.detail.value === '') {
      this.data.addCommotidy[e.mark.index].sum = '0'
    } else {
      this.setData({
        [`addCommotidy[${e.mark.index}].sum`]: e.detail.value
      })
    }
    this.getSum()
    console.log(this.data.addCommotidy[e.mark.index].sum)
  },
  getSum() {
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum + parseFloat(this.data.commotidy[element.class].commotidy[element.index].sellCost) * parseInt(element.sum)
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
  async getCommotidy() {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'commotidy',
        record: 'commotidy',
        shopFlag: appData.shopInfo.shopFlag
      }
    })
    console.log(res)
    if (Array.isArray(res)) {
      return res;
    } else {
      return [];
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading("数据加载中...", true)
    const res = await this.getCommotidy();
    if (res.length > 0) {
      this.setData({
        commotidy: res,
        hidden: false
      })
    } else {
      app.showToast('无商品数据!', 'error')
    }
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
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})