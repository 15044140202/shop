// pages/statement/openLightRecord/openLightRecord.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    disPlayList: [],
    openLightList: []
  },
  filter(e) {
    console.log(e)
    const filer = e?.mark?.item || '全部'
    if (filer === '全部') {
      this.data.disPlayList = this.data.openLightList
    } else {
      this.data.disPlayList = this.data.openLightList.filter(item => item.source.includes(filer))
    }
    this.setData({
      disPlayList: this.data.disPlayList
    })
  },

  async getTodayOpenList(date) {
    const dayOrMonth = date.length > 10 ? '日' : '月'
    const dateObj = app.getDateObj(date);
    const shopId = appData.shop_account._id
    const { startTimeStamp, endTimeStamp } = app.getTimeLowOrHi(dateObj, dayOrMonth)
    const res = await app.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"server_logs\").where({
            shopId:\"${shopId}\",
            timestamp:_.gte(${startTimeStamp}).and(_.lte(${endTimeStamp}))
          }).orderBy(\"startTime\", \"desc\").limit(1000).skip(0).get()`
      }
    })
    console.log(res)
    if (res.errmsg !== 'ok') {
      app.showModal('提示', '获取数据错误!')
      throw 'error --- 获取数据错误'
    }                                                                                                                                    
    const data = res.data.reduce((acc, item) => {
      const data = JSON.parse(item)
      if (data.source.includes('后台操作') || data.source.includes('开台') || data.source.includes('打扫开灯')) {
        acc.push(JSON.parse(item))
      }
      return acc
    }, [])
    return data.reverse()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this
    const date = options.date || app.getNowDate(new Date(), '年月日')
    //获取今日开灯记录
    this.getTodayOpenList(date).then(res => {
      that.data.openLightList = res
      that.filter()
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