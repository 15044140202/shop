// pages/set/vipManage/vipDetaill/vipDetail.js
const appData = getApp().globalData;
const app = getApp();
const utils = require('../../../../utils/utils')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipList: [],
    index: '',
    show: false,
    vipHeadImage:'',

    reason: '',
    amount: '',

    returnData: true,

    buttonText: '返回'
  },
  async giveCoupon() {
    var amount = 0;
    const res = await wx.showModal({
      title: '输入金额',
      content: '',
      editable:true,
      placeholderText:'请输入整数金额'
    })
    if (res.cancel) {
      return
    }
    amount = parseInt(res.content) ;
    if (amount <= 0  || amount >= 200) {
      await wx.showModal({
        title: '提示',
        content: '输入不合法! 请输入 1 ~ 200 的整数!',
      })
      return;
    }
    const cancellation = new Date().getTime() + 30 * 24 * 60 * 60 * 1000
    const addRes = await app.callFunction({
      name:'databaseRecordArray_push',
      data:{
        collection:'vipList',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        record:'vipList',
        arrayFlagName:'userOpenid',
        arrayFlagValue:this.data.vipList[this.data.index].userOpenid,
        arrayRecord:'coupon',
        value:{
          amount:amount,
          cancellation:app.getNowTime(new Date(cancellation))
        }
      }
    })
    if (addRes === 'ok') {
      await wx.showModal({
        title: '提示',
        content: '送券成功!有限期30天.',
      })
      return true;
    }else{
      await wx.showModal({
        title: '提示',
        content: '送券失败!',
      })
      return false;
    }
  },
  lookAmountChange() {
    const that = this;
    wx.navigateTo({
      url: './amountChange/amountChange',
      events: {

      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.vipList[that.data.index].amountChange)
      }
    })
  },
  call(e) {
    wx.makePhoneCall({
      phoneNumber: this.data.vipList[e.mark.index].telephone,
    })
  },
  async save() {
    if (this.data.buttonText === '返回') {
      wx.navigateBack();
    } else {
      app.showLoading('保存中...', true)
      const res = await app.callFunction({
        name: 'amendVipAmount',
        data: {
          userOpenid: this.data.vipList[this.data.index].userOpenid,
          shopFlag: appData.shopInfo.shopFlag,
          value: this.data.amount,
          reason: this.data.reason,
          status: appData.status
        }
      })
      console.log(res);
      if (res.masage === 'ok') {
        app.showModal('提示','修改成功!')
      }else{
        app.showModal('提示','修改失败! 请重新进入小程序重试!')
      }
      wx.hideLoading();
      wx.navigateBack();
    }

  },
  amountChange() {
    this.setData({
      show: this.data.show === true ? false : true
    })
  },
  onConfirm() {
    if (isNaN(parseInt(this.data.amount))) {
      app.showToast('金额只能数字', 'error');
      return;
    }
    if (this.data.amount === '') {
      wx.showToast({
        title: '金额不能为空!',
        icon: 'error'
      })
    } else if (this.data.reason === '') {
      wx.showToast({
        title: '理由不能为空!',
        icon: 'error'
      })
    } else {
      this.data.vipList[this.data.index].amount = parseInt(this.data.vipList[this.data.index].amount) + parseInt(this.data.amount)
      this.setData({
        [`vipList[${this.data.index}].amount`]: this.data.vipList[this.data.index].amount,
        buttonText: '保存'
      })
    }
    this.setData({
      show: false
    })

    if (this.data.returnData === true) { //会员管理界面 需要返回会员数据   其他页面调用的  则不需要返回数据
      const eventChannel = this.getOpenerEventChannel();
      const that = this;
      eventChannel.emit('upData', that.data.vipList)
    }
  },
  onClose() {

  },
  input(e) {
    console.log(e)
    this.data[e.mark.name] = e.detail.value
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options);
    this.setData({
      index: options.index,
      returnData: options.returnData === "false" ? false : true
    });
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('giveData', async function (data) {
      that.setData({
        vipList: data
      })
      //更新所选会员的会员信息  , 电话号  姓名  头像
      await that.updateVipInfo(that.data.vipList[that.data.index]);
      //下载头像临时文件
      that.setData({
        vipHeadImage: await utils.downTempFile(wx.cloud,that.data.vipList[that.data.index].image === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : that.data.vipList[that.data.index].image)
      })
    });


  },
  async updateVipInfo(vipInfo) {
    const newInfo = await app.callFunction({
      name: 'getDatabaseRecord_op',
      data: {
        collection: 'userInfo',
        record: 'userInfo',
        openid: vipInfo.userOpenid
      }
    })
    console.log(newInfo)
    //判断数据是否一致  只有数据不一致时触发更新
    var update = false;
    const index = this.data.index;
    const vipList = this.data.vipList;
    if (vipList[index].gender !== newInfo.gender) {
      update = true;
    }else if(vipList[index].name !== newInfo.name){
      update = true;
    }else if (vipList[index].headImage !== newInfo.image){
      update = true;
    }else if (vipList[index].telephone !== newInfo.telephone){
      update = true;
    }else if('birthday' in vipList[index]){
      if(vipList[index].birthday !== newInfo.birthday){
        update = true;
      }
    }else {
      if ('birthday' in newInfo) {
        update = true;
      }
    }

    if (update === true) {//需要更新
      //将最新数据赋值给本地数据
      this.setData({
        [`vipList[${this.data.index}].birthday`]: newInfo.birthday,
        [`vipList[${this.data.index}].gender`]: newInfo.gender,
        [`vipList[${this.data.index}].image`]: newInfo.headImage,
        [`vipList[${this.data.index}].name`]: newInfo.name,
        [`vipList[${this.data.index}].telephone`]: newInfo.telephone,
      })
      //将最新数据更细到服务器中店铺会员列表
      const res = await app.callFunction({
        name:'amendArrayDatabase_fg',
        data:{
          collection:'vipList',
          flag:'shopFlag',
          flagInfo:appData.shopInfo.shopFlag,
          record:'vipList',
          arrayFlag:'userOpenid',
          data:vipList[index]
        }
      })
      console.log(res)
      
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