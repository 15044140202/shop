import { toUint8Array } from "js-base64"

// pages/tools/recruit/addNewRecuit/addNewRecuit.js
const app = getApp()
const appData = app.globalData
Page({
  /**
   * 页面的初始数据
   */
  data: {
    formData: {
      shopName: '',
      shopId: '',
      post: "",//岗位
      duty: "",//职责
      salary: "",//薪酬
      workTime: "",//工作时间
      publisher: '',//发布人
      publishDate: app.getNowTime(),
      wx: '',//联系方式  wx/电话号
      applicantList: [],//应聘者
      status: "生效",
      views: 0,
    }
  },
  girl(e) {
    console.log(e)
    if (e.detail.value) {
      this.setData({
        [`formData.isGril`]: e.detail.value,
        postInputDisabled: true,
        [`formData.post`]:'助教'
      })
    } else {
      this.setData({
        [`formData.isGril`]: e.detail.value,
        postInputDisabled: false,
        [`formData.post`]:''
      })
    }

  },
  // 处理输入 
  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 提交表单 
  async submitForm() {
    const formData = this.data.formData;
    if (!formData.shopName || !formData.post || !formData.duty || !formData.salary || !formData.workTime || !formData.publisher) {
      wx.showToast({
        title: "请填写完整信息",
        icon: "none"
      });
      return;
    }
    // 模拟提交到后端 
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_recruit',
        data: formData
      }
    })
    if (!res.success) {
      app.showModal('提示', '提交失败!')
      return
    }
    app.showToast('提交成功', 'success')
    // 清空表单 
    this.setData({
      formData: {
        shopName: "",
        post: "",
        duty: "",
        salary: "",
        workTime: "",
        publisher: ""
      }
    });
    wx.navigateBack()
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
      [`formData.shopName`]: appData.shop_account.shopInfo.shopName,
      [`formData.shopId`]: appData.shop_account._id,
      [`formData.publisher`]: appData.status//发布人
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