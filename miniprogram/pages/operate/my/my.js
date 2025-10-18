// pages/operate/my/my.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    post: appData.status
  },
  async isInShop() {
    const latitude = appData.shop_account.shopInfo.latitude
    const longitude = appData.shop_account.shopInfo.longitude
    if (!latitude || !longitude) {
      app.showModal('提示', '店铺未定位,无法使用该功能,请前往店铺设置,点击店铺地址的地图定位按钮保存店铺位置信息.')
      return
    }
    const res = await app.getLocation(5000)
    const distance = app.getDistance(latitude, longitude, res.latitude, res.longitude)
    console.log('距离:' + distance)
    return distance < 600  //距离小于300米返回  true  否则返回 false
  },
  async attendance(status) {
    //此处要加上 判断本人当前  在岗状态
    const memberInfo = appData.shop_member.find(item => item.memberOpenid === appData.merchant_info._openid) || {
      memberOpenid: appData.merchant_info._openid,
      telephone: appData.shop_account.shopInfo.telephone,
      shopId: appData.shop_account._id,
      userName: '老板'
    }
    const attendanceData = {
      time: new Date().getTime(),
      openid: memberInfo.memberOpenid,
      status: status === '在岗' ? '离岗' : '上岗',
      name: memberInfo.userName,
      telephone: memberInfo.telephone,
      shopId: memberInfo.shopId
    }
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_member_attendance',
        data: attendanceData
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '打卡失败!')
      return
    }
    app.showModal('提示', '打卡成功')
    //添加 打卡信息
    this.data.todayAttendance.push(attendanceData)
    this.getAttendanceStats(this.data.todayAttendance)
  },
  async tap(e) {
    if (e.mark.item === 'onDuty') {//上班打卡
      if (! await this.isInShop()) {
        app.showModal('提示', '请于店内打卡!')
        return
      }
      //打卡
      if (this.data.status === '在岗') {
        app.showModal('提示', '当前在岗,无需上班打卡!')
        return
      }
      this.attendance(this.data.status)
    } else if (e.mark.item === 'outDuty') {//下班打卡
      if (! await this.isInShop()) {
        app.showModal('提示', '请于店内打卡!')
        return
      }
      //打卡
      if (this.data.status === '未在岗') {
        app.showModal('提示', '当前未在岗,无需下班打卡!')
        return
      }
      this.attendance(this.data.status)
    } else if (e.mark.item === 'attendance_record') {//查看打卡记录
      wx.navigateTo({
        url: './attendance_record/attendance_record'
      })
    }
  },
  //获取本人在岗状态
  getAttendanceStats(todayAttendance) {
    const myAttendanceArr = todayAttendance.reduce((acc, item) => {
      if (item.openid === appData.merchant_info._openid) {
        acc.push(item)
      }
      return acc
    }, [])
    console.log(myAttendanceArr)
    const status = myAttendanceArr.length % 2 === 0 ? '未在岗' : '在岗'
    this.setData({
      status: status
    })
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
  async onShow() {
    //设置 职位
    this.setData({
      post:appData.status
    })
    //获取当日考勤记录
    const now = new Date()
    this.data.todayAttendance = await app.getMemberAttendance(now.getFullYear(), now.getMonth(), now.getDate())
    //整理个人考勤记录
    console.log(this.data.todayAttendance)
    this.getAttendanceStats(this.data.todayAttendance)
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