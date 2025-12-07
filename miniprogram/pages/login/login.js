// pages/login/login.js
const utils = require('../../utils/zx');
const dataMode = require('../../utils/dataMode')
const app = getApp();
const appData = getApp().globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    merchantInfo: [],
    shopName: "",
    shopAdd: "",
    telephoneNum: "",
    hidden: true,

    agree: false,
    addShop: false
  },
  goto() {
    wx.navigateTo({
      url: './agree/agree',
    })
  },
  tap(e) {
    console.log(e)
    if (e.mark.item === 'agree') {
      this.setData({
        agree: this.data.agree === false ? true : false
      })
    }
  },
  async getPhoneNumber(e) {
    console.log(e.detail.code)
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
        telephoneNum: phoneNum
      })
    } else {
      console.log('没有获取到手机号码!')
    }
  },
  shopNameFunction(e) {
    this.setData({
      shopName: e.detail.value
    })
  },
  shopAddFunction(e) {
    this.setData({
      shopAdd: e.detail.value
    })
  },
  confirmFunction() {
    if (this.data.agree === false) {
      app.showModal('提示', '请仔细阅读并勾选同意后方可使用本程序!')
    } else if (this.data.shopName === "") {
      app.showToast('请填写店铺名称!', 'error')
    } else if (this.data.shopAdd === "") {
      app.showToast('请填写店铺地址!', 'error')
    }/* else if (this.data.telephoneNum === "1" || this.data.telephoneNum === '') {//获取电话号码步骤滞后
      app.showToast('请填写手机号码!', 'error')
    } */else {
      //调用登录函数
      this.login(true)
    }
  },
  getLastShopIndex(merchant_info){
    const lastShopId = merchant_info?.lastShopId
    if (lastShopId) {
      const index = merchant_info.shopId.findIndex(item => item.shopId === lastShopId)
      if (index > -1) {
        return index
      }else{
        return 0
      }
    }else{
      return 0
    }
  },
  async login(register) {
    //注册店铺
    if (register) {
      const _id = utils.getRandomString(32)
      dataMode.shop_Account._id = _id
      dataMode.shop_Account._openid = appData.merchant_info._openid
      dataMode.shop_Account.shopInfo.shopName = this.data.shopName
      dataMode.shop_Account.shopInfo.shopAdd = this.data.shopAdd
      let transactions = [
        {
          collection: 'shop_account',//店铺账户信息
          data: dataMode.shop_Account
        }, {
          collection: 'shop_vip_set',//店铺Vip设置
          data: dataMode.shop_vip_set
        }, {
          collection: 'shop_setmeal',//店铺套餐设置
          data: dataMode.shop_setmeal
        }, {
          collection: 'shop_member_power',//店铺店员设置
          data: dataMode.shop_member_power
        }, {
          collection: 'shop_operate_set',//店铺营业参数设置
          data: dataMode.shop_operate_set
        }, {
          collection: 'shop_lucksudoku_set',//店铺幸运九宫格设置
          data: dataMode.shop_lucksudoku_set
        }, {
          collection: 'shop_integral_set',//店铺积分设置
          data: dataMode.shop_integral_set
        }, {
          collection: 'shop_device',//店铺设备设置
          data: dataMode.shop_device
        }, {
          collection: 'shop_charging',//店铺计费规则设置
          data: dataMode.shop_charging
        }
      ]
      for (let index = 0; index < transactions.length; index++) {
        if ('shopId' in transactions[index].data) {
          transactions[index].data.shopId = _id
        }
      }
      const res = await app.callFunction({
        name: 'login',
        data: {
          register: true,
          transactions: transactions
        }
      })
      console.log(res)
      if (!res.success) { //注册失败
        app.showToast('注册失败!', 'error')
      } else {
        app.showToast('注册成功!', 'success')
        //重新进入小程序
        console.log('重启小程序!')
        wx.restartMiniProgram({
          path: "login"
        })
      }
    }
    //获取店铺信息
    appData.shopSelect = this.getLastShopIndex(appData.merchant_info)
    const res = await app.getLoginShopData(appData.merchant_info.shopId[appData.shopSelect].shopId)
    console.log(res)
    return res
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    wx.login({})
    wx.showLoading({
      title: '加载中...'
    })
    if ('item' in options) {
      console.log('进入开设分店分支')
      if (options.item === 'addShop') {
        this.setData({
          addShop: true
        })
        wx.hideLoading()
        //进入注册流程
        this.setData({
          hidden: false
        })
      }
    } else {
      const res = await app.getMerchantInfo()
      console.log(res)
      const merchantInfo = res[0]
      if ('shopId' in merchantInfo) {
        appData.merchant_info = merchantInfo;
        if (appData.merchant_info.shopId.length > 0) { //判断 本账号下面是否绑定了店铺信息  如果有则获取第一个店铺信息  如果没有则进入 注册流程
          console.log('获取店铺信息!');
          //获取店铺信息
          let shopData = await this.login()
          if (!shopData.success) {
            app.showModal('错误!','获取店铺信息错误!')
            return
          }
          shopData = app.resultDispose(shopData.data)
          Object.assign(appData,shopData)
          console.log(appData)
          appData.status = app.getStatus(appData.merchant_info._openid)
          wx.hideLoading()
          wx.switchTab({
            url: '../operate/operate',
          })
        } else {
          wx.hideLoading()
          //进入注册流程
          this.setData({
            hidden: false
          })
        }
      } else {
        app.showModal('error', '取用户信息失败!请重新进入小程序!')
      }
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  }
})