// pages/oder/oder.js
const app = getApp();
const appData = getApp().globalData;
const utils = require('../../utils/light');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    position: '',
    time: '',
    shopFlag: '',
    shopName: '',
    name: '',
    telephone: '',
    timeOut: false
  },
  input(event) {
    console.log(event)
    if (event.detail.value != '') {
      this.data.name = event.detail.value
    }
  },
  async getPhoneNumber(e) {
    console.log(e.detail.code) // 动态令牌
    console.log(e.detail.errMsg) // 回调信息（成功失败都会返回）
    console.log(e.detail.errno) // 错误码（失败时返回）
    if (e.detail.code === undefined) {
      console.log('没有获取到CODE!');
      return;
    }
    const res = await app.callFunction({
      name: 'getPhoneNum',
      data: {
        code: e.detail.code
      }
    })
    console.log(res)
    //获得到 电话号码 
    var phoneNum = '';

    if ("phoneInfo" in res) {
      phoneNum = res.phoneInfo.phoneNumber
      console.log({
        '手机号码:': phoneNum
      })
      this.setData({
        telephone: phoneNum
      })
    } else {
      console.log('没有获取到手机号码!')
    }
  },
  examine(merchantInfo, shopFlag) { //此函数  用于检查 本用户的 shopInfo 里面是否已经有 要添加的店铺  有返回true 没有返回false
    console.log(merchantInfo)
    console.log(shopFlag)
    for (let index = 0; index < merchantInfo.shopFlag.length; index++) {
      const element = merchantInfo.shopFlag[index];
      if (element.shopFlag === shopFlag) {
        return true
      }
    }
    return false
  },
  async confirm() {
    if (this.data.name === '') {
      app.showToast('请输入姓名', 'error');
      return;
    } else if (this.data.telephone === '') {
      app.showToast('请输入电话', 'error');
      return;
    }
    if (this.data.timeOut === true) {
      app.showToast('二维码过期!', 'error');
    } else {
      app.cloudInit()
      //获取店铺信息 以便以下面使用店铺 _openid
      await app.getShopInfo(this.data.shopFlag);
      if ('_openid' in appData.shopInfo) {
       
      } else {
        app.showToast('获取店铺信息失败!!', 'error')
        return;
      }
      //修改merchantInfo  数据
      const res = await this.getMerchantInfo() //获取 merchantInfo数据 如果用户第一次使用本程序  会自动创建一个空数据
      if ('shopFlag' in res) {
        appData.merchantInfo = res;

        if ( this.examine(appData.merchantInfo, this.data.shopFlag) === true) {//判断是否  已经添加过 防止重复添加
          app.showToast('此用户已存在!','error')
          wx.restartMiniProgram({
            path: "../login/login"
          })
          return;
        }
        const r = await utils.addArrayDatabase_op({
          collection: 'merchantInfo',
          openid: appData.merchantInfo._openid,
          objName: 'shopFlag',
          data: {
            shopFlag: this.data.shopFlag,
            shopName: this.data.shopName
          }
        });
        if (r === 'ok') {
          const e = await utils.addArrayDatabase_op({
            collection: 'shopAccount',
            openid: appData.shopInfo._openid,
            objName: 'shop.member',
            data: {
              name: this.data.name,
              telephone: this.data.telephone,
              memberOpenid: appData.merchantInfo._openid,
              position: this.data.position,
              attendanceState:false
            }
          });
          if (e === 'ok') {
            app.showToast('添加成功!', 'success')
            wx.restartMiniProgram({
              path: "../login/login"
            })
          } else {
            app.showToast('添加信息失败!', 'error')
          }
        } else {
          app.showToast('添加信息失败!', 'error')
        }
      } else {
        app.showToast('获取用户信息失败!请重新进入小程序!', 'error')
      }
      //this.addNewMember()
    }
  },
  async addNewMember() {
    const res = await utils.addArrayDatabase({
      collection: 'shopAccount',
      openid: appData.shopInfo._openid,
      objName: 'shop.member',
      data: {
        name: '未命名',
        position: this.data.position
      }
    });
    if (res === 'ok') {
      console.log('添加成功!')
    } else {
      console.log('添加失败!')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(query) {
    console.log(query)
    this.setData({
      position: query.position,
      time: query.time,
      shopFlag: query.shopFlag,
      shopName: query.shopName
    })
    const now = new Date().getTime();
    console.log(now)
    if ((now - this.data.time) / 1000 / 60 > 50) {
      app.showToast('二维码过期!', 'error');
      this.data.timeOut = true;
    }
  },
  async getMerchantInfo() {
    const res = await wx.cloud.callFunction({
      name: 'getShopFlag',
    })
    console.log(res.result[0])
    return res.result[0]
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