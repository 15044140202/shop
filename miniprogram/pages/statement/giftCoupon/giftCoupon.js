// pages/statement/giftCoupon/giftCoupon.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    startTime: '',
    endTime: '',

    recordList: [],
    vipList: []
  },
  async gotoVipInfo(e) {
    console.log(e)
    //获取这个会员的会员信息
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'vip_list',
        query: {
          shopId: appData.shop_account._id,
          userOpenid: this.data.recordList[e.mark.index].vipInfo.userOpenid
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
      url: `../../set/vipManage/vipDetail/vipDetail?index=0&returnData=false`,
      events: {},
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('giveData', that.data.vipList)
      }
    })
  },
  async getRecordList(date) {
    const dayOrMonth = date.length > 10 ? '日' : '月'
    const dateObj = app.getDateObj(date);
    const { startTimeStamp, endTimeStamp } = app.getTimeLowOrHi(dateObj, dayOrMonth)
    const that = this
    //获取当日商品入库数据
    app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'server_logs',
        query: {
          shopId: appData.shop_account._id,
          source: '送券'
        },
        _gte: {
          record: 'timestamp',
          value: startTimeStamp
        },
        _lte: {
          record: 'timestamp',
          value: endTimeStamp
        }
      }
    }).then(res => {
      console.log(res)
      that.setData({
        recordList: res.data
      })
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (!options?.disPlayDate) {
      app.showModal('参数-时间错误!')
      wx.navigateBack()
    }
    const date = options.disPlayDate || app.getNowDate(new Date(), '年月日')
    this.getRecordList(date)
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