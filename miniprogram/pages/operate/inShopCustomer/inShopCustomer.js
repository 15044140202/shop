// pages/operate/inShopCustomer/inShopCustomer.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderForm:appData.orderForm,
    vipList:[],

    res:[]
  },
 async gotoVipInfo(e){
    //先获取会员信息  传给下一界面
    app.showLoading("数据加载中...",true)
    const res = await app.callFunction({
      name:'getOneVipInfo',
      data:{
        shopOpenid:appData.shopInfo._openid,
        vipInfo:this.data.orderForm[e.mark.index].openPerson.openPersonOpenid
      }
    })
    console.log(res);
    wx.hideLoading();
    if (res === [] || res === 'error') {//没有查询到此用户的会员信息
      app.showToast('数据加载错误!','error')
      return;
    }
    this.data.res.push(res)
    const that = this;
    wx.navigateTo({
      url: `../../set/vipManage/vipDetail/vipDetail?index=0&returnData=${false}`,
      events:{

      },
      success:function(res){
        res.eventChannel.emit('giveData',that.data.res)
      }
    })
  },
  call(e){
    wx.makePhoneCall({
      phoneNumber: this.data.orderForm[e.mark.index].openPerson.openPersonTelephone//仅为示例，并非真实的电话号码
    })
  },
  goto(e){
    wx.navigateTo({
      url: `./orderFormInfo/orderFormInfo?index=${e.mark.index}`,
    })
  },
  async loadData(shopFlag,date){
   const res = await app.callFunction({
      name:'getOrderForm',
      data:{
        collection:"orderForm",
        record:"orderFrom",
        shopFlag:shopFlag,
        date:date,
      }
    })
    console.log(res)
    this.setData({
      orderForm:res.orderForm
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // const NowDate = app.getNowDate();
    // this.loadData(appData.shopInfo.shopFlag,NowDate);
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