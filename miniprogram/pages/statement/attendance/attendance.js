// pages/statement/attendance/attendance.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    memberAttendance: [],
    memberData: [],
    memberSelect: 0,
    memberArray: []
  },
  memberSelect(e) {
    console.log(e)
    this.setData({
      memberSelect: e.detail.value
    })
  },
  settleData(data) {
    const memberData = this.data.memberAttendance.reduce((acc, item) => {
      const timeStamp = item.time;
      const name = item.name;
      // 创建一个新对象，避免修改原始数据
      const newItem = { ...item };
      try {
        // 获取格式化后的时间
        newItem.time = app.getNowTime(new Date(timeStamp));
        // 获取格式化后的日期
        const date = app.getNowTime(new Date(timeStamp), '年月日');

        // 确保 acc[name] 存在
        if (!acc[name]) {
          acc[name] = {};
        }

        if (acc[name][date]) {
          acc[name][date].unshift(newItem);
        } else {
          acc[name][date] = [newItem];
        }
      } catch (error) {
        console.error(`处理考勤记录时出错，姓名: ${name}，时间戳: ${timeStamp}`, error);
      }
      return acc;
    }, {});

    console.log(memberData);
    this.setData({
      memberData: memberData
    });
  },
  getMemberList() {
    //店铺员工
    const shopMember = appData.shop_member
    if (!shopMember.find(item => item.memberOpenid === appData.shop_account._openid)) {
      shopMember.push({
        memberOpenid: appData.shop_account._openid,
        position: '老板',
        userName: '老板',
        telephone: appData.shop_account.shopInfo.telephone
      })
    }
    this.setData({
      memberArray: shopMember
    })
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
    this.setData({
      memberAttendance: appData.memberAttendance
    })
    //整理员工数据
    this.settleData()
    this.getMemberList()
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