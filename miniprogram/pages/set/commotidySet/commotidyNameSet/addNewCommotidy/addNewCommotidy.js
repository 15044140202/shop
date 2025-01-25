// pages/set/commotidySet/commotidyNameSet/addNewCommotidy/addNewCommotidy.js
const utils = require('../../../../../utils/light');
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_commotidy: [],
    newCommotidy: {
      picId: '',
      name: '',
      class: '',
      units: '',
      primeCost: 0,
      sellCost: 0,
      sum: 0,
      lowSum: 0
    },
    units: ['个', '只', '瓶','桶', '盒', '套', '包', '根'],
    unitsSelect: 0,
    class: ['饮品', '食品', '烟酒', '台球用品', '球杆', '其他'],
    classSelect: 0
  },
  async Image(e) {
    if (e.mark.name === '') {
      wx.showToast({
        title: '请先填写名称',
        icon: 'error'
      })
    } else {
      const res = await utils.updataImage(appData.shop_account._id, e.mark.name)
      this.setData({
        ['newCommotidy.picId']: res
      })
      console.log(this.data.newCommotidy.picId)
    }
  },
  async save() {
    switch ('') {//判断 是都有未填写信息
      case this.data.newCommotidy.name:
        wx.showToast({
          title: '请输入名称!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.units:
        wx.showToast({
          title: '请选择单位!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.class:
        wx.showToast({
          title: '请选择分类!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.primeCost:
        wx.showToast({
          title: '请输入进货价!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.sellCost:
        wx.showToast({
          title: '请输入售卖价!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.sum:
        wx.showToast({
          title: '请输入库存数量!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.lowSum:
        wx.showToast({
          title: '请输入最低数量!',
          icon: 'error'
        })
        return;
    }

    if (this.data.index === '-1') {//新增
      for (let index = 0; index < this.data.shop_commotidy.length; index++) {
        const element = this.data.shop_commotidy[index];
        if (element.name === this.data.newCommotidy.name) {//名称重复
          wx.showToast({
            title: '名称重复!',
            icon: 'error'
          })
          return;
        }
      }
      //向服务器  提交新增数据
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'shop_commotidy',
          data: {
            ...this.data.newCommotidy,
            shopId: appData.shop_account._id,
          }
        }
      })
      if (res.success) {
        app.showToast('修改成功!', 'success')
        this.data.shop_commotidy.push({
          ...this.data.newCommotidy,
          shopId: appData.shop_account._id,
          _id:res.data._id
        })
        appData.shop_commotidy = this.data.shop_commotidy
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('updata', this.data.shop_commotidy);
        wx.navigateBack();
      } else {
        app.showToast('数据提交失败!', 'error')
        return
      }
    } else {//修改
      //向服务器  提交修改数据
      delete this.data.newCommotidy._id
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'shop_commotidy',
          query: {
            _id: this.data.shop_commotidy[this.data.index]._id
          },
          upData: this.data.newCommotidy
        }
      })
      if (res.success) {
        app.showToast('修改成功!', 'success')
        Object.assign(this.data.shop_commotidy[this.data.index],this.data.newCommotidy)

        appData.shop_commotidy = this.data.shop_commotidy
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('updata', this.data.shop_commotidy);
        wx.navigateBack();
      } else {
        app.showToast('数据提交失败!', 'error')
        return
      }
    }
  },
  input(e) {
    if (!e.detail.value) {
      return
    }
    this.setData({
      [`newCommotidy.${e.mark.name}`]: e.mark.name === 'sum' || e.mark.name === 'lowSum' || e.mark.name === 'sellCost' || e.mark.name === 'primeCost' ? parseFloat(e.detail.value) : e.detail.value
    })
    console.log(this.data.newCommotidy[e.mark.name])
  },
  onchange(e) {
    console.log(e)
    if (e.mark.name === 'class') {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: this.data.class[e.detail.value]
      })
      console.log(this.data.newCommotidy[e.mark.name])
    } else {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: this.data.units[e.detail.value]
      })
      console.log(this.data.newCommotidy[e.mark.name])
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      index:options.index
    })
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveData', function (data) {
      that.setData({
        shop_commotidy: data.data
      })
      if (parseInt(options.index) !== -1) {
        const newCommotidy = JSON.parse(JSON.stringify(that.data.shop_commotidy[parseInt(options.index)]))
        that.setData({
          newCommotidy:newCommotidy
        })
      }
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