// pages/set/shopSet/shopSet.js
const app = getApp();
const appData = app.globalData;
const tx_map = require('../../../utils/TXmap/txMapApi')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shop_device: appData.shop_device,
    shopLogo: '',
    shop_account: appData.shop_account,
    amendData: {
    },
    shop_tag: ['赛级打感', '全屋智控', '运动精彩秀', '旗舰店', '自助杆柜', '联系店长进福利群', '24小时营业'],
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
    } else if (e.mark.item === 'shop_tag') {
      this.shop_tag_set(e.detail.value)
    }

  },
  async shop_tag_set(tag_index) {
    const tag = this.data.shop_tag[tag_index]
    if (tag === '自助杆柜') {//判断店铺是都设置自助杆柜
      //判断有无智能杆柜
      const cupboard = appData.shop_device.cupboard
      if (!cupboard.length) {
        app.showModal('提示', '店铺并未设置自主智能杆柜!')
        return
      }
    } else if (tag === '运动精彩秀') {//判断店铺是都绑定精彩秀录像机
      //判断有无  运动精彩秀摄像机
      const carame = appData.shop_device.camera
      if (!carame.length) {
        app.showModal('提示', '店铺并未设置精彩秀摄像机!')
        return
      }
    }
    //修改本地数据  向后tag 后添加新数据 
    if (!('tag' in this.data.shop_account)) {
      this.data.shop_account.tag = []
    }
    const shop_tag = this.data.shop_account.tag
    // 如果长度超过3，先删除第一个元素
    if (shop_tag.length >= 3) shop_tag.shift()
    // 然后添加新元素
    shop_tag.push(tag)

    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_account',
        query: {
          _id: this.data.shop_account._id
        },
        upData: { tag: shop_tag }
      }
    })
    if (!res.success) {
      app.showToast('保存失败!', 'error')
      return
    }
    app.showToast('保存成功!', 'success')
    this.setData({
      shop_account: this.data.shop_account
    })
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
      if (appData.shop_account.shopInfo.logoId !== `cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/${appData.shop_account._id}.img`) { //这种情况是以前没有上传过头像
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
    //获取店铺城市
    const shop_city_RES = await tx_map.geocoder(appData.MAPKEY, `${this.data.shop_account.shopInfo.latitude},${this.data.shop_account.shopInfo.longitude}`)
    const shop_city = shop_city_RES?.data?.result?.ad_info?.city
    console.log(shop_city)
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_account',
        query: {
          _id: appData.shop_account._id
        },
        upData: {
          shopInfo: this.data.shop_account.shopInfo,
          shop_city: shop_city
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
  async getLocaltion() {
    const res = await wx.chooseLocation({})
    console.log(res)
    this.setData({
      [`amendData.shopAdd`]: res.address,
      [`amendData.latitude`]: res.latitude,
      [`amendData.longitude`]: res.longitude
    })
    console.log(this.data.amendData)
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
    if (Object.keys(this.data.amendData).length === 0) {
      this.data.amendData = Object.assign(this.data.amendData, appData.shop_account.shopInfo)
      this.setData({
        amendData: this.data.amendData
      })
    }
    //刷新 shop_account
    if (appData.shop_account._id !== this.data.shop_account._id) {
      this.setData({
        shop_account: appData.shop_account
      })
    }

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