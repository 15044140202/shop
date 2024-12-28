// pages/set/vipManage/vipManage.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipList: [],
    vipHeadImage: [],

    startSum: 1,
    endSum: 40,
    noData: false
  },
  onCancel(e) {
    console.log(e)
  },
  async onSearch(e) {
    app.showLoading('加载中...', true)
    console.log(e.detail)
    const res = await this.getOneVipInfo(appData.shopInfo.shopFlag, /\D/.test(e.detail) === false ? e.detail : 'null', /\D/.test(e.detail) === false ? 'null' : e.detail)
    if (res === 'noVipInfo') { //没有此会员
      wx.hideLoading();
      app.showToast('无此会员', 'error');
      return;
    } else {
      var vipInfo = [res];
      wx.hideLoading();
      wx.navigateTo({
        url: `./vipDetail/vipDetail?index=0&returnData=${false}`,
        events: {

        },
        success: function (res) {
          res.eventChannel.emit('giveData', vipInfo)
        }
      })
    }

  },
  async getOneVipInfo(shopFlag, telephone, name) {
    const res = await app.callFunction({
      name: 'searchVip',
      data: {
        shopFlag: shopFlag,
        userTelephone: telephone,
        userName: name
      }
    })
    console.log(res);
    return res;
  },
  goto(e) {
    const that = this;
    wx.navigateTo({
      url: `./vipDetail/vipDetail?index=${e.mark.index}&returnData=${true}`,
      events: {
        upData: function (params) {
          console.log(params)
          that.setData({
            vipList: params
          })
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.vipList)
      }
    })
  },
  async getdata() {
    const res = await wx.cloud.callFunction({
      name: 'getDatabaseArray_fg',
      data: {
        collection: 'vipList',
        shopFlag: appData.shopInfo.shopFlag,
        ojbName: 'vipList',
        startSum: this.data.startSum,
        endSum: this.data.endSum
      }
    })
    if (res.errMsg === "cloud.callFunction:ok") { //调用函数成功!
      if (res.result == 'error') { //没有数据
        wx.showToast({
          title: '没有数据!',
          icon: 'error'
        })
        return;
      }
      console.log(res.result)
      if (res.result.length > 0) {
        for (let index = 0; index < res.result.length; index++) {
          const element = res.result[index];
          this.data.vipList.push(element)
        }
        this.data.startSum += 20;
        this.data.endSum += 20;
        this.setData({
          vipList: this.data.vipList
        })
        return;
      } else { //没有数据了
        this.setData({
          noData: true
        })
        console.log('没有数据了!')
      }
    } else {
      wx.showToast({
        title: '获取数据失败!',
        icon: 'error'
      })
      return;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    await this.getdata()
    //循环 下载会员头像
    for (let index = 0; index < this.data.vipList.length; index++) {
      const element = this.data.vipList[index];
      this.data.vipHeadImage.push(await app.getHeadImage(element.image === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : element.image))
    }
    this.setData({
      vipHeadImage: this.data.vipHeadImage
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
  async onReachBottom() {
    if (this.data.noData === true) {
      wx.showToast({
        title: '没有更多数据了!',
        icon: 'error'
      })
    } else {
      wx.showLoading({
        title: '数据加载中!'
      });
      await this.getdata();
      //下载没有下载的vip头像
      //循环 下载会员头像
      for (let index = this.data.vipHeadImage.length; index < this.data.vipList.length; index++) {
        const element = this.data.vipList[index];
        this.data.vipHeadImage.push(await app.getHeadImage(element.image === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : element.image))
      }
      this.setData({
        vipHeadImage: this.data.vipHeadImage
      })
      console.log(this.data.list);
      wx.hideLoading();
    }
  }
})