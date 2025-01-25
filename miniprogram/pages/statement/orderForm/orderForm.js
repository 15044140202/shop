// pages/statement/orderForm/orderForm.js
const app = getApp()
const appData = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    newVipData: [],
    newVipDataHeadImage:[],
    orderForm: [],
    get_item: ''
  },
  goto(e) {
    if (e.mark.item === '新增会员') {
      const that = this;
      wx.navigateTo({
        url: `../../set/vipManage/vipDetail/vipDetail?index=${e.mark.index}&returnData=false`,
        events: {},
        success: function (res) {
          // 通过eventChannel向被打开页面传送数据
          res.eventChannel.emit('giveData', that.data.newVipData)
        }
      })
    } else {
      wx.navigateTo({
        url: `./orderFormInfo/orderFormInfo?index=${e.mark.index}`,
      })
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    if (options.item === '新增会员') {
      this.setData({
        get_item: options.item
      })
      this.getNewVipData()
    } else {
      for (let index = 0; index < appData.disPlayOrderForm.length; index++) {
        const element = JSON.parse(appData.disPlayOrderForm[index]);
        element.time = app.getNowTime(new Date(element.time))
        this.data.orderForm.push(element)
      }
      this.setData({
        orderForm: this.data.orderForm,
        get_item: options.item
      })
      console.log({ "账单信息:": this.data.orderForm })
      console.log(this.data.get_item)
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  async getNewVipData() {
    //获取新增vipData
    const newVipData = appData.newVipData
    this.data.newVipData.length = 0
    for (let index = 0; index < newVipData.length; index++) {
      let element = JSON.parse(newVipData[index]);
      element.startTime = app.getNowTime(new Date(element.startTime))
      this.data.newVipData.push(element)
    }
    this.setData({
      newVipData: this.data.newVipData
    })
    //下载会员图像
    const task = []
    if (this.data.get_item === '新增会员') {
      const newVipData = this.data.newVipData
      this.data.newVipDataHeadImage.length = 0
      for (let index = 0; index < newVipData.length; index++) {
        const element = newVipData[index];
        task.push(
          app.getHeadImage(element.headImage === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : element.headImage)
        ) 
        if (index !== 0 && index % 100 === 0) {
          const res = await Promise.all(task)
          console.log(res)
          Object.assign(this.data.newVipDataHeadImage,res)
          task.length = 0
        }
      }
      if (task.length > 0) {
        const res = await Promise.all(task)
        console.log(res)
        Object.assign(this.data.newVipDataHeadImage,res)
      }
      this.setData({
        newVipDataHeadImage:this.data.newVipDataHeadImage
      })
    }
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