// pages/set/chargingSet/newCharging/timeSegment/timeSegment.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    startTime: '00:00',
    endTime: '00:00',
    price: 0,

    index: 0,
    timeSegment: [],
    startShow: true,
    endShow: true
  },
  onStartTime(event) {
    if (this.data.timeSegment.length === 1) { //只有一个时间段的情况
      wx.showToast({
        title: '请设置多个时段!',
        icon: 'error'
      })
    } else if (this.data.timeSegment.length - 1 === this.data.index) { //第二个时段的 开始  应与第一个时段的结束一致
      this.setData({
        startTime: this.data.timeSegment[this.data.index].startTime,
      });
    } else { //第一个时段  可以任意设置
      this.setData({
        startTime: event.detail.value,
      });
    }
  },
  onEndTime(event) {
    if (this.data.timeSegment.length === 1) { //只有一个时间段的情况
      wx.showToast({
        title: '请设置多个时段!',
        icon: 'error'
      })
    } else if (this.data.index === 0) {
      this.setData({
        endTime: event.detail.value,
      });
      this.data.timeSegment[this.data.index + 1].startTime = event.detail.value
      this.data.timeSegment[this.data.index + 1].endTime = this.data.startTime
    } else{ //最后一个时间段的结尾应与 第一个时间段的开始 一致
      this.setData({
        endTime: event.detail.value,
      });
      this.data.timeSegment[this.data.index - 1].startTime = event.detail.value
      this.data.timeSegment[this.data.index - 1].endTime = this.data.startTime
    }
  },
  priceSet(e) {
    this.setData({
      price: e.detail.value
    })
  },
  confirm() {
    console.log(this.data.price)
    if (this.data.price === 0 || this.data.price === '') {
      wx.showToast({
        title: '价格不能为 0!',
        icon: 'error'
      })
      return
    } else {
      this.data.timeSegment[this.data.index].startTime = this.data.startTime
      this.data.timeSegment[this.data.index].endTime = this.data.endTime
      this.data.timeSegment[this.data.index].price = this.data.price
      if (this.data.timeSegment.length > 1 ) {
        if (this.data.index === 0 && this.data.timeSegment[this.data.index + 1].price === 0) {
          this.data.timeSegment[this.data.index + 1].price = this.data.price
        }
      }
      this.getOpenerEventChannel().emit('updateInvoice', {
        timeSegment: this.data.timeSegment
      });
      wx.navigateBack();
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (option) {
    const index = parseInt(option.index, 10)
    this.setData({
      index: index
    })
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.once('sendQueryParams', (params) => {
      console.log('上一页面传来的数据', params);
      this.setData({
        timeSegment: params.timeSegment,
        startTime: params.timeSegment[index].startTime,
        endTime: params.timeSegment[index].endTime,
        price: params.timeSegment[index].price
      })
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

  }
})