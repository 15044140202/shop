// pages/set/amountBook/editor/editor.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
    merchant_info: appData.merchant_info,
    status: appData.status,
    shop_member: appData.shop_member,

    orderType: 'expense',
    amount: 0,
    operater: '',
    date: '',
    receiptPath: '',
    category: ''
  },
  input(e) {
    console.log(e)
    if (e.mark.item === "category") {
      this.setData({
        category: e.detail.value
      })
    }
  },
  async chooseImage(e) {
    const res = await wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera']
    })
    if (res.tempFiles.length <= 0) {
      app.showModal('提示', '获取图片失败!')
    }
    const tempFilePath = res.tempFiles[0].tempFilePath
    this.setData({
      receiptPath: tempFilePath
    })
  },
  switchType(e) {
    console.log(e)
    if (e.target.dataset.type === 'expense') {//指出
      this.setData({
        orderType: 'expense'
      })
    } else if (e.target.dataset.type === 'income') {//收入
      this.setData({
        orderType: 'income'
      })
    }
    let amount = this.data.amount
    if (this.data.orderType === 'expense' && amount > 0) {
      amount = -amount
    }else if(this.data.orderType === 'income' && amount < 0){
      amount = -amount
    }
    this.setData({
      amount: amount
    })
  },
  bindAmount(e) {
    console.log(e)
    const value = e.detail.value
    if (value === "-") {
      app.showModal('提示','选择支出金额自动变成负数,不用输入负号')
      return
    }
    if (value.includes('.')) {
      if (value.split(".").length > 1 && value.split(".")[1] !== '' && value.split(".")[1] !== '0') {
        console.log(parseFloat(value))
        let amount = parseFloat(value)
        if (this.data.orderType === 'expense' && value > 0) {
          amount = -amount
        }else if(this.data.orderType === 'income' && value < 0){
          amount = -amount
        }
        this.setData({
          amount: amount
        })
      }
    } else {
      let amount = parseFloat(value)
      if (this.data.orderType === 'expense' && value > 0) {
        amount = -amount
      }else if(this.data.orderType === 'income' && value < 0){
        amount = -amount
      }
      this.setData({
        amount: amount
      })
    }

  },
  getOperater() {
    if (this.data.status === 'boss') {
      return 'boss'
    }
    const member = this.data.shop_member.filter(item => item.memberOpenid === this.data.merchant_info._openid)
    const userName = member[0]?.userName ?? ''
    console.log(userName)
    return userName
  },
  async save() {
    app.showLoading('保存中...',true)
    const order = {
      shopId: appData.shop_account._id,
      amount:Math.round(this.data.amount * 100) ,
      date: this.data.date,
      operater: this.data.operater,
      category: this.data.category,
      receip: '',
      orderType: this.data.orderType
    }
    const tempPath = this.data.receiptPath
    //保存图片
    if (tempPath) {
      const res = await wx.cloud.uploadFile({
        cloudPath: `amountBook/${appData.shop_account._id}/${this.data.category}${new Date().getTime()}.png`, // 上传至云端的路径
        filePath: tempPath, // 小程序临时文件路径
      })
      console.log(res)
      order.receip = res.fileID
    }
    console.log(order)
    //保存订单
    const orderRes = await app.callFunction({
      name:'addRecord',
      data:{
        collection:'shop_amount_book',
        data:order
      }
    })
    if (!orderRes.success) {
      app.showModal('提示','保存失败!')
    }
    app.showModal('提示','保存成功!')
    wx.hideLoading()
    const that = this
    const eventChannel = this.getOpenerEventChannel() 
    eventChannel.emit('acceptDataFromOpenedPage', order);
    wx.navigateBack()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //加载 经办人
    this.setData({
      operater: this.getOperater(),
      date: app.getNowTime()
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
    this.setData({
      status:appData.status
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