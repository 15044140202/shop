// pages/operate/my/attendance_record/attendance_record.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    attendance: {}
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
  async onShow() {
    const now = new Date()
    const attendance = await app.getMemberAttendance(now.getFullYear(), now.getMonth())
    console.log(this.data.attendance)
    const myOpenid = appData.merchant_info._openid
    const myAttendance = attendance.reduce((acc, item) => {
      if (item.openid === myOpenid) {
        const timeStamp = item.time
        item.time = app.getNowTime(new Date(timeStamp))
        const date = app.getNowTime(new Date(timeStamp), '年月日')
        if (acc[date]) {
          acc[date].unshift({
            ...item,
          })
        }else{
          acc[date]=([item])
        }
      }
      return acc
    }, {})
    
    this.setData({
      attendance: myAttendance
    })
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