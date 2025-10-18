// pages/firendCircle/firendCircle.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
    user_info:appData.merchant_info,
    firend_user_info: {},
    
    moments: [],
    currentMomentId: null,

    skip: 0,
    limit: 50,
    total: 99999,


    hidden:true,//隐藏页面
  },
  message(){
    app.showModal('提示','商家端仅支持查看招聘人员信息,不支持更多操作!')
    return
  },
  //获取该用户信息
  async getFirendUserInfo(openid){
    const res = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'user_info',
        query:{
          _openid:openid
        }
      }
    })
    if (!res.success) {
      app.showModal('提示','获取用户信息错误')
      return
    }
    this.setData({
      firend_user_info:res?.data?.[0] || {}
    })
  },
  //预览照片
  previewImage(e){
    console.log(e)
    const picPathArr = this.data.moments[e.mark.index].images
    const url = picPathArr.reduce((acc,item)=>{
      let url_1 = item
      var res = url_1
      if (url_1.indexOf('cloud://') === 0) {
        var first = url_1.indexOf('.')
        var end = url_1.indexOf('/', first)
        res = 'https://' + url_1.slice(first + 1, end) + '.tcb.qcloud.la/' + url_1.slice(end + 1, url_1.length)
      }
      acc.push({url:res})
      return acc
    },[])
    wx.previewMedia({
      sources:url,
      current:0,
      showmenu:true
    })
  },
  //显示更多回复
  showMoreComments(e){
    console.log(e)
    this.setData({
      [`moments[${e.mark.index}].showAllComments`]:true
    })
  },
  //隐藏更多回复栏
  concealComments(e){
    console.log(e)
    this.setData({
      [`moments[${e.mark.index}].showAllComments`]:false
    })
  },
  

  //获取朋友圈数据
  async getFirendCircle(skip, limit) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: skip,
        limit: limit,
        collection: 'user_moment',
        query: {
          userOpenid: this.data.userOpenid,
        },
        orderBy: "time|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取数据错误!')
      throw 'ERROR --- 获取数据错误!'
    }
    const moments = res.data.data
    const nowTimeStamp = new Date().getTime()
    const that = this
    //处理  自己是否已点赞, 或者还有时间
    moments.forEach(item => {
      //点赞
      item.isLike = item.likes.some(item => item.userOpenid === this.data.user_info._openid)
      item.timeStr = that.getTimeStr(nowTimeStamp,item.time)
    })

    //刷新本地数据
    this.data.moments.push(...moments)
    this.setData({
      total: res.count.total,
      moments: this.data.moments,
      hidden:false
    })

  },
  //获取文字表达的时间节点
  getTimeStr(nowTimeStamp,momentTimeStamp){
    if (nowTimeStamp - momentTimeStamp > 30 * 24 *60 *60 *1000) {//大于一个月 返回实际时间
      return app.getNowTime(new Date(momentTimeStamp))
    }else if(nowTimeStamp - momentTimeStamp > 14 * 24 *60 *60 *1000){//大于14天
      return '2周以前'
    }else if(nowTimeStamp - momentTimeStamp > 7 * 24 *60 *60 *1000){//大于7天
      return '1周以前'
    }else if(nowTimeStamp - momentTimeStamp > 6 * 24 *60 *60 *1000){
      return '6天以前'
    }else if(nowTimeStamp - momentTimeStamp > 5 * 24 *60 *60 *1000){
      return '5天以前'
    }else if(nowTimeStamp - momentTimeStamp > 4 * 24 *60 *60 *1000){
      return '4天以前'
    }else if(nowTimeStamp - momentTimeStamp > 3 * 24 *60 *60 *1000){
      return '3天以前'
    }else if(nowTimeStamp - momentTimeStamp > 2 * 24 *60 *60 *1000){
      return '2天以前'
    }else if(nowTimeStamp - momentTimeStamp > 1 * 24 *60 *60 *1000){
      return '1天以前'
    }else if(nowTimeStamp - momentTimeStamp > 60 *60 *1000){//1小时以上 1天一下
      const H = Math.floor((nowTimeStamp - momentTimeStamp) / (60*60*1000))
      return `${H}小时以前`
    }else if(nowTimeStamp - momentTimeStamp > 5 *60 *1000){//五分钟以上 1小时以下
      const M = Math.floor((nowTimeStamp - momentTimeStamp) / (60*1000))
      return `${M}分钟以前`
    }else{
      return '刚刚'
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    this.data.userOpenid = options.userOpenid
    //获取朋友圈主人的用户信息
    this.getFirendUserInfo(options.userOpenid)
    //获取这个人的 朋友圈内容
    this.getFirendCircle(this.data.skip, this.data.limit)

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
    console.log('页面上拉触底事件的处理函数')
    //分析剩余数量是否够一次加载的
    if (this.data.total <= this.data.moments.length) return

    let limit = this.data.total - this.data.moments.length >= this.data.limit ? this.data.limit : this.data.total - this.data.moments.length
    this.data.skip = this.data.moments.length

    this.getFirendCircle(this.data.skip, limit)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})