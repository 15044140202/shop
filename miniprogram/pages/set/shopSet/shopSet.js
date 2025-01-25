// pages/set/shopSet/shopSet.js
const app = getApp();
const appData = app.globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    shopLogo: '',
    shop_account: appData.shop_account,
    amendData: {
      shopName: appData.shop_account.shopInfo.shopName,
      openTime: appData.shop_account.shopInfo.openTime,
      closeTime: appData.shop_account.shopInfo.closeTime,
      telephone: appData.shop_account.shopInfo.telephone,
      shopAdd: appData.shop_account.shopInfo.shopAdd,
      foundTime: appData.shop_account.shopInfo.foundTime,
      intro: appData.shop_account.shopInfo.intro,
    },
  },
  tap(e) {
    console.log(e)
    if (e.mark.item === 'save') { //保存
      this.save();
    } else if (e.mark.item === 'shopName') {
      this.setData({
        ['amendData.shopName']: e.detail.value
      })
    } else if (e.mark.item === 'openTime') {
      this.setData({
        ['amendData.openTime']: e.detail.value
      })
    } else if (e.mark.item === 'closeTime') {
      this.setData({
        ['amendData.closeTime']: e.detail.value
      })
    } else if (e.mark.item === 'phone') {
      this.setData({
        ['amendData.telephone']: e.detail.value
      })
    } else if (e.mark.item === 'shopAdd') {
      this.setData({
        ['amendData.shopAdd']: e.detail.value
      })
    } else if (e.mark.item === 'foundTime') {
      this.setData({
        ['amendData.foundTime']: e.detail.value
      })
    } else if (e.mark.item === 'intro') {
      this.setData({
        ['amendData.intro']: e.detail.value
      })
    }

  },

  async logoSet() {
    const r = await wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
    })
    console.log(r)
    const path = r.tempFiles[0].tempFilePath
    const res = await wx.cloud.uploadFile({
      cloudPath: `image/${appData.shop_account._id}.img`, // 上传至云端的路径
      filePath: path, // 小程序临时文件路径
    })
    console.log(res)
    if (res.errMsg === 'cloud.uploadFile:ok') {
      console.log(res.fileID)
      //如果以前修改或头像  新旧头像的fileID  不会发生变化  所以判断 以前是否有上传过头像
      if (appData.shop_account.shopInfo.logoId === '1' || appData.shop_account.shopInfo.logoId === '') { //这种情况是以前没有上传过头像
        const s = await app.callFunction({
          name: 'upDate',
          data: {
            collection: 'shop_account',
            query: {
              _id: appData.shop_account._id
            },
            upData: {
              [`shopInfo.logoId`]: res.fileID
            }
          }
        })
        console.log(s)
        if (s.success) {
          appData.shop_account.shopInfo.logoId = res.fileID
          this.data.shop_account.shopInfo.logoId = res.fileID
          this.getHeadImage()
          app.showModal('提示', '保存成功,头像设置不会立即生效,请稍后查看效果!')
        } else {
          app.showToast('保存失败!', 'error')
        }
      } else { //以前上传过头像  直接提供  新文件路径
        this.getHeadImage()
      }
    } else {
      app.showToast('上传失败!', 'error')
    }
  },
  async save() {
    var result = 'ok';
    const amendDataArray = Object.keys(this.data.amendData)
    console.log(amendDataArray)
    const changeData = {}
    for (let index = 0; index < amendDataArray.length; index++) {
      const element = amendDataArray[index];
      if (this.data.amendData[element] !== '' && this.data.amendData[element] !== this.data.shop_account.shopInfo[element]) {
        changeData[element] = this.data.amendData[element]
      }
    }
    //把所有改变了的数据 放到shop_account里面
    Object.assign(this.data.shop_account.shopInfo, changeData)
    console.log({ '改变后的数据:': this.data.shop_account.shopInfo })
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_account',
        query: {
          _id: appData.shop_account._id
        },
        upData: {
          shopInfo: this.data.shop_account.shopInfo
        }
      }
    })

    if (res.success) {
      //清空需要保存的临时数据
      for (let index = 0; index < amendDataArray.length; index++) {
        const element = amendDataArray[index];
        this.data.amendData[element] = ''
      }
      app.showModal('提示', '修改成功!请重新进入小程序以刷新数据')
      return;
    } else {
      app.showModal('错误', '保存失败!')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //获取店铺Logo
    this.getHeadImage()

  },
  getHeadImage() {
    const that = this
    //获取店铺Logo
    app.getHeadImage(this.data.shop_account.shopInfo.logoId).then(res => {
      that.setData({
        shopLogo: res
      })
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