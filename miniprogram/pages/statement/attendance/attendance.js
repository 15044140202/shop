// pages/statement/attendance/attendance.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    attendance:appData.memberAttendance,
    memberData:[]
  },
  settleData(data){
    for (let index = 0; index < this.data.attendance.length; index++) {
      const element = this.data.attendance[index];
      if (this.data.memberData.length === 0) {//添加第一个数据
        this.data.memberData.push({
          name:element.name,
          telephone:element.telephone,
          attendance:[{state:element.state,time:element.time}]
        })
      }else{//已经有数据 了  首先判断这个店员信息是否已经被收集了
        for (let i = 0; i < this.data.memberData.length; i++) {
          const e = this.data.memberData[i];
          if (element.telephone === e.telephone && element.name === e.name) {//这个店员信息被收集过  继续添加
            this.data.memberData[i].attendance.push({state:element.state,time:element.time})
          }else{
            if (this.data.memberData.length === i -1) {//这个店员的信息没有被收集过  添加
              this.data.memberData.push({
                name:element.name,
                telephone:element.telephone,
                attendance:[{state:element.state,time:element.time}]
              })
            }
          }
        }
      }
    }
    console.log(this.data.memberData)
    this.setData({
      memberData:this.data.memberData
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //整理员工数据
    this.settleData()
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