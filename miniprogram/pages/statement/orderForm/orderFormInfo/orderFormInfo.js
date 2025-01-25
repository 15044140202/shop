// pages/operate/inShopCustomer/orderFormInfo/orderFormInfo.js
const app = getApp();
const appData = getApp().globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderForm: [],
    index: 0,
    vipList: [],
    refundTotalAmount: 0,
  },
  async goto(e) {
    console.log(e)
    if (e.mark.item === "vipDetail") {
      //获取这个会员的会员信息
      const res = await app.callFunction({
        name: 'getData_where',
        data: {
          collection:'vip_list',
          query:{
            shopId:appData.shop_account._id,
            userOpenid:this.data.orderForm[this.data.index].userOpenid
          }
        }
      })
      if (!res.success || res.data.length === 0) {
        app.showModal('提示', '获取会员信息失败!')
        return;
      }
      this.data.vipList.push(res.data[0])
      const that = this;
      wx.navigateTo({
        url: `../../../set/vipManage/vipDetail/vipDetail?index=0&returnData=false`,
        events: {},
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('giveData', that.data.vipList)
        }
      })
    }
  },
  computeRefundTotalamount(log) {
    var amount = 0;
    for (let index = 0; index < log.length; index++) {
      const element = log[index];
      if (element.split("---")[1].substring(0, 2) === '退款') {
        amount += parseInt(element.split("---")[1].match(/\d+/))
      }
    }
    return amount;
  },
  async rePay(e) {
    //检测权限
    if (await app.power('systemSet', '7', '退款/部分退款')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }
    console.log(e)
    wx.navigateTo({
      url: `../../../set/sysSte/wxAccount/rePay/rePay?order=${this.data.orderForm[e.mark.index].orderNum}&amount=${this.data.orderForm[e.mark.index].cashPledge > 0 ? this.data.orderForm[e.mark.index].cashPledge : this.data.orderForm[e.mark.index].tableCost}&tableCost=${this.data.orderForm[e.mark.index].tableCost}&rePayMode=${this.data.orderForm[e.mark.index].payMode}`,
    })
  },
  call() {
    wx.makePhoneCall({
      phoneNumber: this.data.orderForm[this.data.index].openPerson.openPersonPhone,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    const that = this;
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('giveData', function (data) {
      console.log(data)
      that.setData({
        orderForm: data,
        index: options.index
      })
    })
    if (options.item) { //判断项目
      if (options.item === 'inShopCustomer') { //在店账单

      }
    } else {
      for (let index = 0; index < appData.disPlayOrderForm.length; index++) {
        const element =JSON.parse(appData.disPlayOrderForm[index]) ;
        element.time = app.getNowTime(new Date(element.time))
        this.data.orderForm.push(element)
      }
      this.setData({
        orderForm: this.data.orderForm,
        index: options.index,
      })
      //统计总退款金额
      if (appData.disPlayOrderForm[options.index].orderName === '店员开台订单' || appData.disPlayOrderForm[options.index].orderName === '自助开台订单' || appData.disPlayOrderForm[options.index].orderName === '自助套餐订单') {
        this.setData({
          refundTotalAmount: this.computeRefundTotalamount(appData.disPlayOrderForm[options.index].log)
        })
      }

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