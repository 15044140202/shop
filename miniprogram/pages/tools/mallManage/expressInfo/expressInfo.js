// pages/tools/mallManage/expressInfo/expressInfo.js
const mall_utils = require('../../mall/mall_utils')
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    expressArr: []
  },
  queryExpressStatus(e) {
    console.log(e)
    mall_utils.queryExpress(this.data.expressArr[e.mark.index].expressNum)
  },
  async amendExpressNum(e) {
    const expressOrder = this.data.expressArr[e.mark.index]
    let newExpressNum = ''
    const res = await wx.showModal({
      title: '选择输入方式',
      editable: true,
      cancelText: '扫描',
      confirmText: '确定'
    })
    console.log(res)
    if (res.cancel) {//扫描
      const res = await wx.scanCode({
        scanType: ['barCode', 'pdf417', 'datamatrix']
      })
      console.log(res)
      newExpressNum = res?.result || ''
    } else (
      newExpressNum = res?.content || ''
    )
    if (!newExpressNum) {
      app.showModal('提示','单号错误!')
      return
    }
    //修改服务器数据
    const res1 = await app.callFunction({
      name:'upDate',
      data:{
        collection:'user_mall_order_express',
        query:{
          _id:expressOrder._id
        },
        upData:{
          expressNum:newExpressNum
        }
      }
    })
    if(!res1.success){
      app.showModal('提示','修改快递单号失败!')
      return
    }
    //修改本地数据
    expressOrder.expressNum = newExpressNum
    this.setData({
      expressArr:this.data.expressArr
    })
    app.showToast('修改成功','success')
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    if(options.client ){
      this.setData({
        client:options.client
      })
    }
    //获取订单全部快递
    const expressRes = await mall_utils.getOrderExpress({ _id: options.orderId })
    console.log(expressRes)
    this.setData({
      expressArr: expressRes
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