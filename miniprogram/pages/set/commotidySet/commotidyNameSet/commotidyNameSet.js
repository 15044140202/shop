// pages/set/commotidySet/commotidyNameSet/commotidyNameSet.js
const app = getApp();
const appData = app.globalData;
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    active: 0

  },
  async delete(e) {
    console.log(e)
    Dialog.confirm({
        title: '确认',
        message: `确定要删除${this.data.commotidy[e.mark.class].commotidy[e.mark.index].name}吗?删除后不可恢复!`,
      })
      .then(() => {
        const newCommotidy = [];
        const commotidy = this.data.commotidy[e.mark.class].commotidy;
        for (let index = 0; index < commotidy.length; index++) {
          const element = commotidy[index];
          if (index != e.mark.index) {
            newCommotidy.push(element)
          }
        }
        this.setData({
          [`commotidy[${e.mark.class}].commotidy`]: newCommotidy
        })
        console.log(this.data.commotidy)
        this.save(this.data.commotidy)
        return
      }).catch(() => {
        // on cancel
      });
  },
  async save(data) {
    const res = await app.callFunction({ //修改数据库数据
      name:'amendDatabase_fg',
      data: {
        collection: 'commotidy',
        flagName:'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: 'commotidy',
        data: data
      }

    })
    res === 'ok' ? wx.showToast({
      title: '删除成功!',
      icon: 'success'
    }) : wx.showToast({
      title: '删除失败!',
      icon: 'error'
    })
    return;
  },
  addCommotidy(e) {
    if (this.data.commotidy.length < 1) {
      Dialog.alert({
        title: '提示',
        message: '请先添加类别!',
      }).then(() => {
        // on close
        return;
      });
    } else {
      const that = this;
      wx.navigateTo({
        url: `./addNewCommotidy/addNewCommotidy?class=${e.mark.class}&index=${e.mark.index}`,
        events: {
          updata: function (params) {
            that.setData({
              commotidy: params
            })
            console.log(that.data.commotidy)
          }
        },
        success: function (params) {
          params.eventChannel.emit('giveData', {
            data: that.data.commotidy
          })
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('acceptDataFromOpenerPage', function (data) {
      that.setData({
        commotidy: data.data
      })
      console.log(that.data.commotidy)
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