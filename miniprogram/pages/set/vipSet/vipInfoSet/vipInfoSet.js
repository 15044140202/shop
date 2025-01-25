// pages/set/vipSet/vipInfoSet/vipInfoSet.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel: '设置会员的折扣、价格及存款',
    vipSet: [],
    getIndex: 0,
    tableDiscountIO: true

  },
  async longpress(e) {
    const that = this
    if (e.mark.item === 'deletaSaveMoney') {
      wx.showModal({
        title: '确认',
        content: '确认删除此充值规则?',
        complete: (res) => {
          if (res.cancel) {
            return
          }
          if (res.confirm) {
            that.data.vipSet[that.data.getIndex].saveMoney.splice(e.mark.index, 1)
            that.setData({
              vipSet: that.data.vipSet
            })
          }
        }
      })
    }

  },
  async save() {
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_vip_set',
        query: {
          shopId: appData.shop_account._id
        },
        upData: {
          vipSet: this.data.vipSet
        }
      }
    })
    if (res.success) {
      app.showToast('保存成功!', 'success');
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('returnData', this.data.vipSet);
      wx.navigateBack();
    } else {
      app.showToast('保存失败!', 'error');
    }
  },
  addNewSave() {
    const NewSave = { amount: 0, give: 0, name: '存款' };
    this.data.vipSet[this.data.getIndex].saveMoney.push(NewSave);
    this.setData({
      [`vipSet[${this.data.getIndex}].saveMoney`]: this.data.vipSet[this.data.getIndex].saveMoney
    })
  },
  change(e) {
    this.setData({
      [`vipSet[${this.data.getIndex}].${e.mark.name}`]: this.data.vipSet[this.data.getIndex][`${e.mark.name}`] === true ? false : true
    })
    console.log(this.data.vipSet[this.data.getIndex][`${e.mark.name}`])
  },
  hiddenTap(e) {
    this.setData({
      [e.mark.name]: this.data[e.mark.name] === true ? false : true
    })
  },
  input(e) {
    console.log(e.mark.name1 + e.mark.name2)
    console.log(e.detail.value)
    if (e.mark.name1 === 'name' && this.data.getIndex == 0) {
      wx.showToast({
        title: '非会员不可修改!',
        icon: 'error'
      })
      this.setData({
        [`vipSet[${this.data.getIndex}].${e.mark.name1}${e.mark.name2}`]: this.data.vipSet[this.data.getIndex].name
      })
    } else {
      const temp = e.mark.name1 === 'name' ? e.detail.value : parseFloat(e.detail.value)
      this.setData({
        [`vipSet[${this.data.getIndex}].${e.mark.name1}${e.mark.name2}`]: temp
      })
    }
    console.log(this.data.vipSet[this.data.getIndex][`${e.mark.name1}`])
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options.index);
    this.setData({
      getIndex: options.index
    })
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveData', function (data) {
      that.setData({
        vipSet: data.data
      })
      console.log(that.data.vipSet)
    });
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

  }
})