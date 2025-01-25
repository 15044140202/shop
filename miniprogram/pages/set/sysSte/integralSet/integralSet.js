// pages/set/sysSte/integralSet/integralSet.js
const app = getApp();
const appData = app.globalData;
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel: '积分规则设置',
    shop_integral_set: appData.shop_integral_set,
    changed:false,
    videoShow:false,
    videoUrl:'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/video/%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%A7%AF%E5%88%86.mp4?sign=93f97d93349efd18f9736c14352fd1c2&t=1721454885'
  },
  video(){
    this.setData({
      videoShow:true
    })
  },
  async save() {
    if (!this.data.changed) {
      return
    }
    let newData = this.data.shop_integral_set
    delete newData._id
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_integral_set',
        query:{
          shopId:appData.shop_account._id
        },
        upData:newData
      }
    })
    if (res.success) {
      Object.assign(appData.shop_integral_set,this.data.shop_integral_set)
      app.showToast('保存成功!', 'success');
    } else {
      app.showToast('保存失败!', 'error');
    }
  },
  every(e) {
    if (!e.detail.value) {
      return
    }
    this.setData({
      [`shop_integral_set.${e.mark.every}.everyCost`]: parseInt(e.detail.value)
    })
    this.data.changed = true
    console.log(this.data.shop_integral_set[e.mark.every].everyCost)
  },
  give(e) {
    console.log(e)
    if (!e.detail.value) {
      return
    }
    this.setData({
      [`shop_integral_set.${e.mark.give}.giveValues`]: parseInt(e.detail.value)
    })
    this.data.changed = true
  },
  change(e) {
    console.log(e.mark.select)
    this.data.shop_integral_set[e.mark.select].switch === true ? this.setData({
      [`shop_integral_set.${e.mark.select}.switch`]: false
    }) : this.setData({
      [`shop_integral_set.${e.mark.select}.switch`]: true
    })
    this.data.changed = true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
 
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
    if (appData.shop_integral_set !== this.data.shop_integral_set) {
     this.setData({
       shop_integral_set:appData.shop_integral_set
     }) 
    }
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

  }
})