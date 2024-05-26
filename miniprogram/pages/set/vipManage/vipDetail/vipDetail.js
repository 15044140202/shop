// pages/set/vipManage/vipDetaill/vipDetail.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipList: [],
    index: '',
    show: false,

    reason: '',
    amount: '',

    returnData:true,

    buttonText : '返回'
  },
  giveCoupon(){
    app.showToast('功能建设中...','error')
  },
  lookAmountChange(){
    const that = this ;
    wx.navigateTo({
      url: './amountChange/amountChange',
      events:{

      },
      success:function (res) {
        res.eventChannel.emit('giveData', that.data.vipList[that.data.index].amountChange)
      }
    })
  },
  call(e){
    wx.makePhoneCall({
      phoneNumber: this.data.vipList[e.mark.index].telephone ,
    })
  },
  async save(){
    if (this.data.buttonText === '返回') {
      wx.navigateBack();
    }else{
      app.showLoading('保存中...',true)
      const res = await wx.cloud.callFunction({
        name:'amendVipAmount',
        data:{
          userOpenid: this.data.vipList[this.data.index].userOpenid,
          shopFlag:appData.shopInfo.shopFlag,
          value:this.data.amount,
          reason:this.data.reason,
          status:appData.status
        }
     })
     console.log(res);
     wx.hideLoading();
     wx.navigateBack();
    }
   
  },
  amountChange() {
    this.setData({
      show: this.data.show === true ? false : true
    })
  },
  onConfirm() {
    if (isNaN(parseInt(this.data.amount))) {
      app.showToast('金额只能数字','error');
      return;
    }
    if (this.data.amount === '') {
      wx.showToast({
        title: '金额不能为空!',
        icon: 'error'
      })
    } else if (this.data.reason === '') {
      wx.showToast({
        title: '理由不能为空!',
        icon: 'error'
      })
    } else {
      this.data.vipList[this.data.index].amount = parseInt(this.data.vipList[this.data.index].amount) + parseInt(this.data.amount)
      this.setData({
        [`vipList[${this.data.index}].amount`]: this.data.vipList[this.data.index].amount,
        buttonText:'保存'
      })
    }
    this.setData({
      show: false
    })

    if (this.data.returnData === true) {//会员管理界面 需要返回会员数据   其他页面调用的  则不需要返回数据
        const eventChannel = this.getOpenerEventChannel();
    const that = this ;
    eventChannel.emit('upData',that.data.vipList)
    }
  },
  onClose() {

  },
  input(e) {
    console.log(e)
    this.data[e.mark.name] = e.detail.value
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);
    this.setData({
      index: options.index,
      returnData:options.returnData === "false" ? false : true
    });
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('giveData', function (data) {
      that.setData({
        vipList: data
      })
    });

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