// pages/set/commotidySet/commotidyPurchaseSet/commotidyPurchaseSet.js
const app = getApp();
const appData = app.globalData;
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
  async save(){
    this.deletZero();
    if(this.data.addCommotidy.length != 0){
      for (let index = 0; index < this.data.addCommotidy.length; index++) {
        const element = this.data.addCommotidy[index];
        this.data.commotidy[element.class].commotidy[element.index].sum = parseInt(this.data.commotidy[element.class].commotidy[element.index].sum) + parseInt(element.sum)
      }
      console.log(this.data.commotidy)
      const res = await app.callFunction({
        name:'amendDatabase_fg',
        data:{
          collection:'commotidy',
          flagName:'shopFlag',
          flag:appData.shopInfo.shopFlag,
          objName:'commotidy',
          data:this.data.commotidy
        }
      })
      if(res === 'ok'){
        wx.showToast({
          title: '提交成功!',
          icon:'success'
        })
        //提交入库记录
        var commotidyList = []
        for (let index = 0; index < this.data.addCommotidy.length; index++) {
          const element = this.data.addCommotidy[index];
          commotidyList.push({
            name:this.data.commotidy[element.class].commotidy[element.index].name,
            sum:element.sum,
            price:this.data.commotidy[element.class].commotidy[element.index].primeCost
          })
        }
        const list = {
          status:appData.status,
          time:utils.getNowTime(),
          commotidy:commotidyList,
          amount:this.data.sum/100
        }
        //先获取一下列表,以免空列表保存失败!
        console.log('获取列表:' + this.getList(appData.shopInfo.shopFlag))
        //向后追加 入库信息
        const r = await app.callFunction({
          name:'addArrayDatabase_fg',
          data:{
            collection:'commotidy',
            shopFlag:appData.shopInfo.shopFlag,
            objName:'list',
            data:list
          }
        })
        if(r === 'ok'){
          console.log('修改记录保存成功!')
        }else{
          wx.showToast({
            title: '提交记录保存失败!',
            icon:'error'
          })
        }
        this.setData({
          commotidy:this.data.commotidy,
          addCommotidy:[],
          sum:0
        })
        return;
      }else{
        wx.showToast({
          title: '提交失败!',
          icon:'error'
        })
      }

    }else{
      return;
    }

  },
  async getList(shopFlag){
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
    return res ;
  },
  deletZero(){
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
      if (element.class === e.mark.class && element.index === e.mark.index) {//已经添加过的商品
        this.setData({
          [`addCommotidy[${index}].sum`]:this.data.addCommotidy[index].sum + 1
        })
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
    console.log(this.data.addCommotidy)
  },
  input(e) {
    if(e.detail.value === '' ){
      this.data.addCommotidy[e.mark.index].sum = '0'
    }else{
      this.setData({
        [`addCommotidy[${e.mark.index}].sum`]: e.detail.value
      })
    }
    this.getSum()
    console.log(this.data.addCommotidy[e.mark.index].sum)
  },
  getSum(){
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum +parseFloat( this.data.commotidy[element.class].commotidy[element.index].primeCost)* parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum:sum * 100
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

  }
})