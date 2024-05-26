// pages/set/shopSet/shopSet.js
const utils = require('../../../utils/light')
const appData = getApp().globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    shopLogo: '',
    shopInfo: {}
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
      cloudPath: `image/${appData.shopInfo._id}.img`, // 上传至云端的路径
      filePath: path, // 小程序临时文件路径
    })
    console.log(res)
    if (res.sizeOf != 'undefine') {
      console.log(res.fileID)
      //如果以前修改或头像  新旧头像的fileID  不会发生变化  所以判断 以前是否有上传过头像
      if (appData.shopInfo.logoId === '1') { //这种情况是以前没有上传过头像
        var s = await utils.amendDatabase({
          collectionName: 'shopAccount',
          _id: appData.shopInfo._id,
          objName: 'logoId',
          data: res.fileID
        })
        console.log(s)
        if (s == 'ok') {
          appData.shopLogo = path
          this.setData({
            shopLogo: path
          })
          wx.showToast({
            title: '保存成功!',
            icon: 'success'
          })
        } else {
          wx.showToast({
            title: '保存失败!',
            icon: 'error'
          })
        }
      }else{//以前上传过头像  直接提供  新文件路径
        appData.shopLogo = path
        this.setData({
          shopLogo: path
        })
      }
    } else {
      wx.showToast({
        title: '上传失败!',
        icon: 'error'
      })
    }
  },
  async nameSet(e) {
    //console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.shopName`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.shopName.info': e.detail.value
      })
      console.log(this.data.shopInfo)
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async openTimeSet(e) {
    console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.openTime`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.openTime.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async closeTimeSet(e) {
    //console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.closeTime`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.closeTime.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async telephoneSet(e) {
    //console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `telephone`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.telephoneNum.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async shopAddSet(e) {
    //console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.shopAdd`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.shopAdd.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async foundTimeSet(e) {
    //console.log(e.detail.value)
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.foundTime`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.foundTime.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  async introSet(e) {
    var res = await utils.amendDatabase({
      collectionName: 'shopAccount',
      _id: appData.shopInfo._id,
      objName: `shop.intro`,
      data: e.detail.value
    })
    console.log(res)
    if (res == 'ok') {
      this.setData({
        'shopInfo.intro.info': e.detail.value
      })
      wx.showToast({
        title: '保存成功!',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '保存失败!',
        icon: 'error'
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      shopLogo: appData.shopLogo,
      shopInfo: {
        shopName: {
          titel: '店铺名称',
          info: appData.shopInfo.shop.shopName
        },
        openTime: {
          titel: '上班时间',
          info: appData.shopInfo.shop.openTime
        },
        closeTime: {
          titel: '打烊时间',
          info: appData.shopInfo.shop.closeTime
        },
        telephoneNum: {
          titel: '电话号码',
          info: appData.shopInfo.telephone
        },
        shopAdd: {
          titel: '店铺地址',
          info: appData.shopInfo.shop.shopAdd
        },
        foundTime: {
          titel: '开业日期',
          info: appData.shopInfo.shop.foundTime
        },
        intro: {
          titel: '公司简介',
          info: appData.shopInfo.shop.intro
        }
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

  }
})