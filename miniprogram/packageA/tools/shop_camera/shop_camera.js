// pages/tools/shop_camera/shop_camera.js
const app = getApp()
const appData = app.globalData
const ys7 = require('../../../utils/ys7')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nowIndex:0,
    isLive:true,
    ezplayer: {
      token: '',
      url: '',
      recPlayTime: '',
    },
    shop_device: {}
  },
  // 录像回放
  playBack(e){
    console.log(e)
    const isLive = !this.data.isLive
    this.setData({
      isLive:isLive
    })
    const cameraInfo = this.data.shop_device.camera[0]
    //实时监控画面
    if(isLive){
      this.setData({
        [`ezplayer.url`]: `rtmp://open.ys7.com/${cameraInfo.cameraNum}/${this.data.nowIndex + 1}/${'live'}/${app.getNowTime(new Date()).replace(/\//g, '-')}/${app.getNowTime(new Date()).replace(/\//g, '-')}`
      })
    }else{
      //录像回放画面
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayZeroTimeStamp = today.getTime();
      this.setData({
        [`ezplayer.url`]: `rtmp://open.ys7.com/${cameraInfo.cameraNum}/${this.data.nowIndex + 1}/${'local'}/${app.getNowTime(new Date(todayZeroTimeStamp)).replace(/\//g, '-')}/${app.getNowTime(new Date()).replace(/\//g, '-')}`
      })
    }
  },
  getChannelIndex(tableNum){
    const shopCamera = this.data.shop_device.camera
    for (let i = 0 ; i < shopCamera.length ; i ++) {
      const item = shopCamera[i];
      const index = item.channel.findIndex(e => e.bindTable == tableNum)
      if(index > -1){
        return {
          cameraIndex : i,
          channelIndex : index + 1
        }
      }
    }
  },
  async getLiveUrl(tableNum,isLive,startTime,endTime) {
    //获取token
    const token = await ys7.getToken(app)
    const shopCamera = this.data.shop_device.camera
    const tableBindIndex = tableNum === undefined ? {cameraIndex : 0 , channelIndex:0} : this.getChannelIndex(tableNum)
    console.log(tableBindIndex)
    const ISLIVE = isLive ? 'live' : 'local'
    const startT = app.getNowTime(new Date(parseInt(startTime))).replace(/\//g, '-')
    const endT = app.getNowTime(new Date(parseInt(endTime))).replace(/\//g, '-')
    const recPlayTime = startTime ? app.getNowTime(new Date(parseInt(startTime)), 'hms') : new Date()
    console.log(token)
    this.setData({
      [`ezplayer.token`]: token,
      [`ezplayer.url`]: `rtmp://open.ys7.com/${shopCamera[tableBindIndex.cameraIndex].cameraNum}/${tableBindIndex.channelIndex}/${ISLIVE}/${startT}/${endT}`,
      [`ezplayer.recPlayTime`]: recPlayTime,
      cameraInfo: shopCamera[tableBindIndex.cameraIndex],
    })
  },
  handleChannelTap(e) {
    console.log(e)
    const cameraInfo = this.data.cameraInfo
    this.setData({
      [`ezplayer.url`]: `rtmp://open.ys7.com/${cameraInfo.cameraNum}/${e.mark.index + 1}/${'live'}/${app.getNowTime(new Date()).replace(/\//g, '-')}/${app.getNowTime(new Date()).replace(/\//g, '-')}`,
      nowIndex:e.mark.index,
      isLive:true
    })
  },
  async changeName(e) {
    console.log(e)
    const con = await wx.showModal({
      title: '修改通道名称',
      editable: true
    })
    console.log(con)
    //上传数据
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_device',
        query: {
          _id: this.data.shop_device._id
        },
        upData: {
          [`camera.0.channel.${e.mark.index}.channelName`]: con.content
        }
      }
    })
    if (!res.success) {
      app.showModal('修改失败!')
      throw 'error  --- 修改失败!'
    }
    this.data.shop_device.camera[0].channel[e.mark.index].channelName = con.content
    this.setData({
      cameraInfo: this.data.cameraInfo
    })
  },
  handleError(e) {
    console.log(e)
  },
  onControlEvent(e) {
    console.log(e)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.setData({
      shop_device: appData.shop_device
    })

    if(options.tableNum){
      this.getLiveUrl(options.tableNum,false,options.startTime,options.endTime) 
      this.setData({
        isLive:false,
        orderNum:options.orderNum,
        orderStartTime:options.startTime,
        orderEndTime:options.endTime
      })
    }else{
      this.getLiveUrl() 
    }              
    
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