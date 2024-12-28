// pages/set/shopSet/shopSet.js
const utils = require('../../../utils/light')
const app = getApp();
const appData = app.globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    shopLogo: '',
    shopInfo: appData.shopInfo,
    amendData: {
      shopName: '',
      openTime: '',
      closeTime: '',
      telephone: '',
      shopAdd: '',
      foundTime: '',
      intro: '',
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
      cloudPath: `image/${appData.shopInfo._id}.img`, // 上传至云端的路径
      filePath: path, // 小程序临时文件路径
    })
    console.log(res)
    if (res !== 'undefine') {
      console.log(res.fileID)
      //如果以前修改或头像  新旧头像的fileID  不会发生变化  所以判断 以前是否有上传过头像
      if (appData.shopInfo.logoId === '1') { //这种情况是以前没有上传过头像
        var s = await app.amendDatabase_fg({
          collection: 'shopAccount',
          flagName: 'shopFlag',
          flag: this.data.shopInfo.shopFlag,
          objName: 'logoId',
          data: res.fileID
        })
        console.log(s)
        if (s == 'ok') {
          appData.shopLogo = path
          this.setData({
            shopLogo: path
          })
          app.showModal('提示', '保存成功,头像设置不会立即生效,请稍后查看效果!')
        } else {
          app.showToast('保存失败!', 'error')
        }
      } else { //以前上传过头像  直接提供  新文件路径
        appData.shopLogo = path
        this.setData({
          shopLogo: path
        })
      }
    } else {
      app.showToast('上传失败!', 'error')
    }
  },
  async save() {
    var result = 'ok';
    const amendDataArray = Object.keys(this.data.amendData)
    console.log(amendDataArray)
    for (let index = 0; index < amendDataArray.length; index++) {
      const element = amendDataArray[index];
      if (element === 'telephone') {
        if (this.data.amendData[element] !== '' && this.data.amendData[element] !== this.data.shopInfo[element]) {
          const res = await app.callFunction({
            name: 'amendDatabase_fg',
            data: {
              collection: 'shopAccount',
              flagName: 'shopFlag',
              flag: this.data.shopInfo.shopFlag,
              objName: 'telephone',
              data: this.data.amendData[element]
            }
          })
          appData.shopInfo.telephone = this.data.amendData[element];
          if (res !== 'ok') {
            result = 'error'
          }
        }
      } else {
        if (this.data.amendData[element] !== '' && this.data.amendData[element] !== this.data.shopInfo.shop[element]) {
          const res = await app.callFunction({
            name: 'amendDatabase_fg',
            data: {
              collection: 'shopAccount',
              flagName: 'shopFlag',
              flag: this.data.shopInfo.shopFlag,
              objName: `shop.${element}`,
              data: this.data.amendData[element]
            }
          })
          appData.shopInfo.shop[element] = this.data.amendData[element];
          if (res !== 'ok') {
            result = 'error'
          }
        }
      }
    }
    //清空需要保存的临时数据
    for (let index = 0; index < amendDataArray.length; index++) {
      const element = amendDataArray[index];
      this.data.amendData[element] = ''
    }
    if (result === 'ok') {
      app.showModal('提示','修改成功!请重新进入小程序以刷新数据')
      return;
    }else{
      app.showModal('提示','修改失败!请重新进入小程序以刷新数据后重试!')
      return;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //获取店铺Logo
    this.setData({
      shopLogo: await app.getHeadImage(this.data.shopInfo.logoId)
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