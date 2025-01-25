// pages/set/sysSte/suggest/suggest.js
const app = getApp();
const appData = app.globalData;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    suggestText: '',
    newSuggest: true,
    unlook: 0,
  },
  tap(e) {
    if (e.mark.item === 'history') {//历史留言
      this.setData({
        newSuggest: this.data.newSuggest ? false : true
      })
    } else if (e.mark.item === 'looked') {
      const that = this
      this.saveLookEd(e.mark.index).then(res => {
        if (res) {
          that.setData({
            [`shop_suggest[${e.mark.index}].unLook`]: false
          })
          //统计未读数量
          that.setData({
            unlook: that.computeUnRead(that.data.shop_suggest)
          })
        }

      })
    }
  },
  async saveLookEd(suggestIndex) {
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_suggest',
        query: {
          _id: this.data.shop_suggest[suggestIndex]._id
        },
        upData: {
          unLook: false
        }
      },
      showLoading:false
    })
    if (res.success) {
      return res.success
    } else {
      app.showToast('错误', '已读失败')
      return res.success
    }
  },
  suggestText(e) {
    console.log(e.detail.value)
    this.setData({
      suggestText: e.detail.value
    })
  },
  async save() {
    if (this.data.suggestText === '') {
      app.showToast('请输入内容', 'error')
    } else {
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'shop_suggest',
          data: {
            shopId: appData.shop_account._id,
            shopName: appData.shop_account.shopInfo.shopName,
            telephone: appData.shop_account.shopInfo.telephone,
            time: app.getNowTime(),
            text: this.data.suggestText,
            replyText: ''
          }
        }
      })
      if (res.success) {
        app.showToast('提交成功!', 'success');
        wx.navigateBack();
      } else {
        app.showToast('提交失败!', 'error');
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //检测数据库是否有 此用户留言模版如果没有则创建一个
    app.showLoading('加载中...', true);
    this.setData({
      shop_suggest: await this.getSuggest()
    })
    wx.hideLoading();
    //统计未读数量
    this.setData({
      unlook: this.computeUnRead(this.data.shop_suggest)
    })
  },
  /**
   * @description //统计未读数量
   * @param {*} shop_suggest 
   */
  computeUnRead(shop_suggest) {
    let sum = null
    for (let index = 0; index < shop_suggest.length; index++) {
      const element = shop_suggest[index];
      if (element.replyText && element.unLook) {
        sum += 1
      }
    }
    return sum
  },
  async getSuggest() {
    const res = await await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_suggest',
        query: {
          shopId: appData.shop_account._id
        }
      }
    })
    if (res.success) {
      return res.data
    } else {
      console.log('获取留言失败!')
      return []
    }
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