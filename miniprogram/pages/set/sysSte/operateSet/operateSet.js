// pages/set/sysSte/operateSet/operateSet.js
const app = getApp();
const appData = app.globalData;
const db = wx.cloud.database();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    titel: '营业参数设置',
    operateSet: appData.shop_operate_set,
    sacnMode: ['客人扫收款码', '店员扫付款码'],
    paker: ['20.0元500条', '40.0元1000条', '120.0元3000条', '200.0元5000条', '400.0元10000条'],
    pakerIndex: 0
  },
  input(e) {
    console.log(e)
    if (parseInt(e.detail.value) > 0 && parseInt(e.detail.value) <= 15) {
      this.setData({
        [`operateSet.${e.mark.name}.${e.mark.name2}`]: parseInt(e.detail.value)
      })
    }
  },
  onchange(e) {
    console.log(e)
    this.setData({
      [`operateSet.${e.mark.name}.${e.mark.name2}`]: e.detail.value
    })
  },
  pickerChange(e) {
    console.log(e)
    this.setData({
      [`operateSet.${e.mark.name}.${e.mark.name2}`]: parseInt(e.detail.value)
    })
  },
  async save() {
    //删除 本地数据 的shopId 和 _id 键
    delete this.data.operateSet._id
    delete this.data.operateSet.shopId
    app.showLoading('保存中...', true);
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_operate_set',
        query:{
          shopId:appData.shop_account._id
        },
        upData:this.data.operateSet
      }
    })
    wx.hideLoading();
    if (res.success) {
      app.showToast('保存成功!', 'success');
      Object.assign(appData.shop_operate_set,this.data.operateSet)
    } else {
      app.showToast('保存失败!', 'error');
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {

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
      operateSet:appData.shop_operate_set
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

  }
})