// pages/operate/message/message.js
const app = getApp();
const appData = getApp().globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    status:appData.status,
    order:[],

    showSelect:0
  },
  async tap(e){
    console.log(e)
    if (e.mark.item === 'sweep') {//打扫
      await this.sweep(e.mark.index,appData.status)
    }else if (e.mark.item === 'showSelect'){
      this.setData({
        showSelect:parseInt(e.mark.index)
      })
    }
  },
  async sweep(orderIndex,status){
    const orderNum = this.data.order[orderIndex].orderNum;
    const waiterName = this.getWaiterName(status);
    const objName =  this.data.order[orderIndex].orderName === '商品单' ? 'delivery' : 'sweep'
    const res = await app.callFunction({
      name:'waiterSweep_fg',
      data:{
        shopFlag:appData.shopInfo.shopFlag,
        orderNum:orderNum,
        date:app.getOrderFormDate(orderNum),
        waiterName:waiterName
      }
    })
    console.log(res)
    if (res === 'ok') {//上传成功!
      this.setData({
        [`order[${orderIndex}]`]:{
          ...this.data.order[orderIndex],
          sweep:waiterName,
          sweepTime:app.getNowTime()
        }
      })
      app.showToast('保存成功!','success')
    }else{//上传失败
      app.showModal('提示','数据保存失败,请稍后再试!')
      return;
    }

  },
  getWaiterName(status){
    if (status === 'boss') {
      return 'boss'
    }else{
      const memberArray = appData.shopInfo.shop.member;
      const openid = appData.merchantInfo._openid;
      for (let index = 0; index < memberArray.length; index++) {
        const element = memberArray[index];
        if (element.memberOpenid === openid) {
          return element.name
        }
      }
    }
    return 'error'
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
      order:appData.orderForm
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
    return appData.globalShareInfo;
  }
})