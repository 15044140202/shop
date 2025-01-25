// pages/set/commotidySet/commotidyNameSet/commotidyNameSet.js
const app = getApp();
const appData = app.globalData;
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_commotidy: [],
    active: 0,

    totalClass:[]

  },
  async delete(e) {
    console.log(e)
    const that = this
    Dialog.confirm({
      title: '确认',
      message: `确定要删除${this.data.shop_commotidy[e.mark.index].name}吗?删除后不可恢复!`,
    })
      .then(() => {
        if (that.data.shop_commotidy[e.mark.index].sum !== 0) {
          app.showModal('提示','商品数量不为0不能删除,请先清空库存后再删除!')
          return
        }
        const deleteId = that.data.shop_commotidy[e.mark.index]._id
        that.data.shop_commotidy.splice(e.mark.index,1)
        that.setData({
          [`shop_commotidy`]: that.data.shop_commotidy
        })
        console.log(that.data.shop_commotidy)
        that.save(deleteId)
        return
      }).catch(() => {
        // on cancel
      });
  },
  async save(deletaId) {
    const res = await app.callFunction({ //修改数据库数据
      name: 'removeRecord',
      data: {
        collection: 'shop_commotidy',
        query:{
          _id:deletaId
        }
      }
    })
    res.success ? wx.showToast({
      title: '删除成功!',
      icon: 'success'
    }) : wx.showToast({
      title: '删除失败!',
      icon: 'error'
    })
    return;
  },
  addCommotidy(e) {
    const that = this;
    wx.navigateTo({
      url: `./addNewCommotidy/addNewCommotidy?index=${e.mark.index}`,
      events: {
        updata: function (params) {
          that.setData({
            shop_commotidy: params
          })
          console.log(that.data.shop_commotidy)
          that.computeClass(that.data.shop_commotidy)
        }
      },
      success: function (params) {
        params.eventChannel.emit('giveData', {
          data: that.data.shop_commotidy
        })
      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      that.setData({
        shop_commotidy: data.data
      })
      console.log(that.data.shop_commotidy)
      that.computeClass(that.data.shop_commotidy)
    })
  },
  computeClass(shop_commotidy){
    const newClass = []
    for (let index = 0; index < shop_commotidy.length; index++) {
      const element = shop_commotidy[index];
      if (!newClass.includes(element.class)) {
        newClass.push(element.class)
      }
    }
    this.setData({
      class:newClass
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
    return appData.globalShareInfo;
  }
})