// pages/set/noticeSet/noticeSet.js
const app = getApp()
const appData = getApp().globalData
const db = wx.cloud.database()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    active: 0,
    endNotice: [],
    showNotice: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取已发布或者已过期的 公告数据
    this.getNotice(appData.shopInfo._openid)

  },

gotoNewNotice() {
  wx.navigateTo({
    url: './newNotice/newNopice',
  })
},
async getNotice(openid) {
    const notice = await app.callFunction({
      name:'getDatabaseRecord_fg',
      data:{
        collection:'notice',
        shopFlag:appData.shopInfo.shopFlag,
        record:'notice'
      }
    });
    console.log(notice)
    //把全部数据按是否过期  分类 
    let now = new Date().getTime() //现在的时间截
    console.log(now)
    for (let index = 0; index < notice.length; index++) {
      const element = notice[index];
      const endDate = new Date(element.endTime).valueOf()
      if (endDate < now) {
        this.data.endNotice.push(element)
      } else {
        this.data.showNotice.push(element)
      }
      console.log(element) //根据数据日期  分别setdata 过期数据  和 生效数据
    }
    this.setData({
      endNotice: this.data.endNotice,
      showNotice: this.data.showNotice
    })

  },
  niticeSet(e) {
    var notice = {};
    if (e.mark.notice === 'endNotice') {
      notice = this.data.endNotice[e.mark.index]
    } else {
      notice = this.data.showNotice[e.mark.index]
    }
    wx.navigateTo({
      url: './newNotice/newNopice?data=1',
      events:{

      },
      success:function(res){
        res.eventChannel.emit('giveData',notice)
      }
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})