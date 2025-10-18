// pages/set/shortMassageSend/shortMassageSend.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel1: '短信/微信消息群发',
    titel: '',
    content: '',
    vipArray: [],

    shop_account: appData.shop_account,
    pikeSelect: 0,

    telephoneArr: []
  },
  input(e) {
    console.log(e)
    if (e.mark.item === 'titel') {
      if (e.detail.value.length > 10) {
        app.showModal('提示', '标题最多10字')
        this.setData({
          titel: this.data.titel
        })
        return
      }
      this.setData({
        titel: e.detail.value
      })
    } else if (e.mark.item === 'content') {
      if (e.detail.value.length > 30) {
        app.showModal('提示', '内容最多30字')
        this.setData({
          content: this.data.content
        })
        return
      }
      this.setData({
        content: e.detail.value
      })
    }
  },
  async tap(e) {
    console.log(e)
    if (e.mark.item === 'send') {
      //判断当前时间是否允许发送短信
      if (!this.timeJudge()) {
        app.showModal('提示', '当前时间段不允许发送营销短信,请在每日的上午8点--下午10点间进行发送.')
        return
      }
      await this.getAppUrl()
      await this.sendMessage()
    }
  },
  //判断当前时间发送短信是否合法 短信发送时间：8:00 - 22:00。
  timeJudge() {
    const nowTime = new Date()
    const nowHour = nowTime.getHours()
    if (nowHour < 8 || nowHour > 22) {
      return false
    }
    return true
  },
  async sendMessage() {
    const res = await app.callFunction({
      name: 'send_tel_message',
      data: {
        url_link: this.data.url_link,
        template_param_list: [this.data.titel+','+this.data.content],
        phone_number_list: this.data.telephoneArr,
      }
    })
    console.log(res)
  },
  async getAppUrl() {
    const res = await app.callFunction({
      name: 'get_url_link',
      data: {
        path: '/pages/login/login',
        appId:'wxb7d587d7faabe931'
      }
    })
    console.log(res)
    this.data.url_link = res.data.urlLink
  },
  goto(e) {
    const that = this
    if (e.mark.item === 'vipSelect') {
      wx.navigateTo({
        url: './vipSelect/vipSelect',
        events: {
          // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
          someEvent: function (data) {
            console.log(data)
            that.setData({
              telephoneArr: data
            })
          }
        }
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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