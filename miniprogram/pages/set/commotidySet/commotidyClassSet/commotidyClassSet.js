// pages/set/commotidySet/commotidyClassSet/commotidyClassSet.js
const utils = require('../../../../utils/light');
const app = getApp();
const appData = app.globalData;
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    show: false,
    newClass: {
      name: '',
      commotidy: []
    }
  },
  input(e) {
    this.setData({
      ['newClass.name']: e.detail.value
    })
  },
  delete(e) {
    Dialog.confirm({
        title: '确认',
        message: `确定要删除${this.data.commotidy[e.mark.index].name}? 删除后此类下商品将一并删除!`,
      })
      .then(() => {
        // on confirm
        var commotidy = this.data.commotidy
        var newcommotidy = []
        for (let index = 0; index < commotidy.length; index++) {
          if (index != e.mark.index) {
            newcommotidy.push(commotidy[index])
          }
        }
        this.setData({
          commotidy: newcommotidy
        })
        this.save(this.data.commotidy)
      })
      .catch(() => {
        // on cancel
      });

  },
  dialogtap() {
    console.log(this.data.newClass)
    if (this.data.newClass.name === '') {

    } else {
      const newData = JSON.parse(JSON.stringify(this.data.newClass))
      this.data.commotidy.push(newData)
      this.setData({
        commotidy: this.data.commotidy,
        ['newClass.name']: ''
      })
      this.save(this.data.commotidy)
    }
  },
  async save(data) {
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'commotidy',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'commotidy',
        data:data
      }
    })
    if (res === 'ok') {
      app.showToast('保存成功!','success')
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('updata',this.data.commotidy)
    } else {
      app.showToast('保存失败!','error')
    }
  },
  onClose() {
    this.setData({
      show: false
    })
  },
  tap() {
    this.setData({
      show: this.data.show === true ? false : true
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