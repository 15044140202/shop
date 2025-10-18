// pages/tools/mall/myOrders/aftersales/aftersales.js
const app = getApp()
const appData = app.globalData
const zx = require('../../../../../utils/zx')
const mall_utils = require('../../mall_utils')
import Toast from '@vant/weapp/toast/toast';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderInfo: {}, // 订单信息
    afterSaleType: 1, // 售后类型 1:退货退款 2:换货
    afterSaleTypeText: '退货退款',
    afterSaleReason: '', // 售后原因
    afterSaleReasonText: '请选择售后原因',
    refundAmount: '', // 退款金额
    problemDescription: '', // 问题描述
    fileList: [], // 上传的图片列表
    showTypePicker: false, // 是否显示类型选择器
    showReasonPicker: false, // 是否显示原因选择器

    // 售后类型选项
    afterSaleTypes: [
      {
        text: '退货退款',
        value: 1
      },
      {
        text: '换货',
        value: 4
      }
    ],

    // 售后原因选项
    afterSaleReasons: [
      {
        text: '不喜欢/不想要了',
        value: 1
      },
      {
        text: '商品质量问题',
        value: 2
      },
      {
        text: '商品与描述不符',
        value: 3
      },
      {
        text: '收到商品破损',
        value: 4
      },
      {
        text: '商品少发/漏发',
        value: 5
      },
      {
        text: '其他',
        value: 6
      }
    ]
  },
  //输入退款金额
  inputRefundAmount(e) {
    console.log(e)
    if (!e.detail.value) {
      this.setData({
        refundAmount: ''
      })
      return
    }
    
    // 获取输入值并处理
    let inputValue = e.detail.value
    
    // 处理非法输入（非数字字符）
    inputValue = inputValue.replace(/[^\d.]/g, '') // 只保留数字和小数点
    
    // 处理多个小数点的情况
    if ((inputValue.match(/\./g) || []).length > 1) {
      inputValue = inputValue.substring(0, inputValue.lastIndexOf('.'))
    }
    
    // 处理以小数点开头的情况
    if (inputValue.indexOf('.') === 0) {
      inputValue = '0' + inputValue
    }
    
    // 转换为数字
    const numericValue = parseFloat(inputValue) || 0
    
    // 检查最大值
    const maxAmount = mall_utils.getOrderTotalFee(this.data.orderInfo) - (this.data.orderInfo?.expressFee || 0)
    if (numericValue * 100 > maxAmount) {
      app.showModal('提示', '退款金额不能大于商品总金额')
      // 保留之前的有效值
      this.setData({
        refundAmount: this.data.refundAmount // 转换为元显示
      })
      return
    }
    // 更新数据（存储为元）
    this.setData({
      refundAmount: inputValue // 直接存储字符串以保留小数点后的输入
    })
  },
  // 显示售后类型选择器
  showTypePicker() {
    this.setData({ showTypePicker: true })
  },

  // 隐藏售后类型选择器
  hideTypePicker() {
    this.setData({ showTypePicker: false })
  },

  // 确认售后类型
  onTypeConfirm(event) {
    const { value, index } = event.detail
    const selectedType = this.data.afterSaleTypes[index]
    this.setData({
      afterSaleType: selectedType.value,
      afterSaleTypeText: selectedType.text,
      showTypePicker: false,
      refundAmount: 0
    })
  },

  // 显示售后原因选择器
  showReasonPicker() {
    this.setData({ showReasonPicker: true })
  },

  // 隐藏售后原因选择器
  hideReasonPicker() {
    this.setData({ showReasonPicker: false })
  },

  // 确认售后原因
  onReasonConfirm(event) {
    const { value, index } = event.detail
    const selectedReason = this.data.afterSaleReasons[index]
    this.setData({
      afterSaleReason: selectedReason.value,
      afterSaleReasonText: selectedReason.text,
      showReasonPicker: false
    })
  },

  // 问题描述变化
  onProblemDescriptionChange(event) {
    this.setData({
      problemDescription: event.detail.value
    })
  },
  lookImage(e) {
    console.log(e)
    console.log(e)
    wx.previewImage({
      urls: this.data.fileList,
      current: e.mark.index
    })
  },
  async deleteImage(e) {
    console.log(e)
    const res = await wx.showModal({
      title: '确认',
      content: `确认要删除第${e.mark.index + 1}个图片吗?`,
    })
    if (res.cancel) return //取消操作
    const deleteRes = await zx.deleteFile([this.data.fileList[e.mark.index]])
    console.log(deleteRes)
    if (deleteRes?.errMsg !== 'cloud.deleteFile:ok') {
      app.showModal('提示', '删除失败!')
      return
    }
    this.data.fileList.splice(e.mark.index, 1)
    this.setData({
      fileList: this.data.fileList
    })
  },
  //添加图片
  async addImage(e) {
    if(this.data.fileList.length > 9){
      app.showModal('提示','最多只能上传9张图片')
      return
    }
    const res = await zx.updataImage(appData.shop_account._id,zx.getRandomString(10))
    console.log(res)
    if (Array.isArray(res)) {
      this.data.fileList.push(...res)
    } else {
      this.data.fileList.push(res)
    }
    this.setData({
      ['fileList']: this.data.fileList
    })
    console.log(this.data.fileList)
  },

  // 删除图片
  onDeleteImage(event) {
    const { index } = event.detail
    const { fileList } = this.data
    fileList.splice(index, 1)
    this.setData({ fileList })
  },

  // 提交售后申请
  async submitAfterSale() {
    const { afterSaleType, afterSaleReason, problemDescription, fileList, refundAmount } = this.data

    if (!afterSaleReason) {
      Toast.fail('请选择售后原因')
      return
    }

    if (afterSaleType === 1 && !refundAmount) {
      Toast.fail('请输入退款金额')
      return
    }

    // 构造提交数据
    const submitData = {
      time:app.getNowTime(new Date()),
      afterSaleType,
      afterSaleReason,
      problemDescription,
      images: fileList,
      refundAmount: afterSaleType === 1 ? parseFloat((parseFloat(refundAmount)).toFixed(2)) * 100 : 0 
    }

    // 这里应该调用API提交数据
    console.log('提交售后申请:', submitData)
    // 模拟提交
    const afterSaleReasonName = this.getAfterSaleReasonName(this.data.orderInfo)
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'user_mall_order',
        query:{
          orderNum:this.data.orderInfo.orderNum
        },
        upData:{
          applyReturnStatus:this.data.afterSaleType,
          [afterSaleReasonName]:submitData
        }
      }
    })
    if(! res.success){
      app.showModal('提示','申请失败,请稍后再试.')
      return
    }
    //提交成功
    this.data.orderInfo.applyReturnStatus = 1
    this.data.orderInfo[afterSaleReasonName]=submitData
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('upData',this.data.orderInfo)
    wx.navigateBack()
  },
  getAfterSaleReasonName(order){
    for (let index = 0; index < 50; index++) {
      if(! Object.keys(order).includes(`afterSaleReason${index}`)){
        return `afterSaleReason${index}`
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('giveData', data => {
      console.log(data)
      that.setData({
        orderInfo: data
      })
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