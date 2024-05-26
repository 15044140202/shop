// pages/login/login.js
const utils = require('../../utils/light');
const app = getApp();
const appData = getApp().globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    merchantInfo:[],
    shopName: "",
    shopAdd: "",
    telephoneNum: "",
    hidden:true
  },
  async getPhoneNumber(e) {
    console.log(e.detail.code) 
    if(e.detail.code === undefined){
      console.log('没有获取到CODE!');
      return ;
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
        console.log({'手机号码:':phoneNum})
        this.setData({
          telephoneNum:phoneNum
        })
    }else{
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
    if (this.data.shopName === "") {
      app.showToast('请填写店铺名称!','error')
    } else if(this.data.shopAdd === "") {
      app.showToast('请填写店铺地址!','error')
    }else if(this.data.telephoneNum === "1"){
      app.showToast('请填写手机号码!','error')
    }else{
      //调用登录函数
      this.login()
    }
  },
  async login() {
   const res = await wx.cloud.callFunction({
      name: 'login',
      data: {
        register:true,
        shopInfo: {
          telephone: this.data.telephoneNum,
          shopName: this.data.shopName,
          shopAdd: this.data.shopAdd
        },
        shopFlag:utils.getRandomString(20)
      }
    })
    console.log(res)
    if(res.result === 'error'){//注册失败
      app.showToast('注册失败!','error')

    }else{//注册成功!  把新注册的shopFlag  写到用户信息里面

      const r = await utils.addArrayDatabase_op({
        collection:'merchantInfo',
        openid:appData.merchantInfo._openid,
        objName:'shopFlag',
        data:{shopFlag:res.result,shopName:this.data.shopName}
      });
      console.log(r)
      if(r === 'ok'){
        app.showToast('注册成功!','success')
        //重新进入小程序
        console.log('重启小程序!')
        wx.restartMiniProgram({
          path:"login"
        })
      }else{
        app.showToast('注册失败!','errpr')
      }
    }
  },
  async getMerchantInfo(){
    const res = await wx.cloud.callFunction({
      name:'getShopFlag',
    })
    console.log(res.result[0])
    return res.result[0]
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    wx.login({
    })
    wx.showLoading({
      title:'加载中...'
    })
    const res = await this.getMerchantInfo()
    if('shopFlag' in res){
      appData.merchantInfo = res;
      if(appData.merchantInfo.shopFlag.length > 0){//判断 本账号下面是否绑定了店铺信息  如果有则获取第一个店铺信息  如果没有则进入 注册流程
        console.log('获取店铺信息!');
        //获取店铺信息
        await app.getShopInfo(appData.merchantInfo.shopFlag[0].shopFlag);
        //获取职位信息
        appData.status = utils.getStatus(appData.merchantInfo._openid);
        console.log('职位:' + appData.status)
        //获取今日账单数据
        appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag,app.getNowDate());
        //获取员工 打卡记录
        await app.getMemberAttendance()
        wx.hideLoading()
        wx.switchTab({
          url: '../operate/operate',
        })
      }else{
        wx.hideLoading()
        //进入注册流程
        this.setData({
          hidden:false
        })
      }
    }else{
      app.showToast('获取用户信息失败!请重新进入小程序!','error')
    }
    
  }
})