// pages/tools/mallManage/mallSet/admin/admin.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    memberType:'',//员工类型
    adminList: [],
  },

  navigateToAddAdmin() {
    wx.navigateTo({
      url: '/pages/settings/addAdmin/addAdmin'
    })
  },

  async showDeleteConfirm(e) {
    console.log(e)
    const confirmRes = await wx.showModal({
      title: '确认删除',
      content: `确定要删除管理员${e.mark.name}吗`,
    })
    if (confirmRes.cancel) {//用户取消操作
      app.showModal('提示','用户取消操作')
      return
    }
    const upDataRes = await app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_mall_manager',
        query:{
          shopId:this.data.adminList.shopId
        },
        _pull:{
          [this.data.memberType]:{
            name:e.mark.name
          }
        }
      }
    })
    console.log(upDataRes)
    if (!upDataRes.success) {
      app.showModal('提示','上传数据失败!请稍后再试!')
      return
    }
    app.showModal('提示','保存成功!')
    const newArr =   this.data.adminList[this.data.memberType].filter(item => item.name !== e.mark.name)
    console.log(newArr)
    this.setData({
     [ `adminList.${this.data.memberType}`]:newArr
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.setData({
      memberType:options.item,
      adminList: appData.malltype === 'shop' ?appData.shopMallManager : appData.officialMallManager
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
    console.log('监听页面卸载')
    const managerArr = appData.malltype === 'shop' ?appData.shopMallManager : appData.officialMallManager
    if (this.data.adminList !== managerArr) {
      if (appData.malltype === 'shop') {
        appData.shopMallManager = this.data.adminList
      }else{
        appData.officialMallManager = this.data.adminList
      }
    }
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