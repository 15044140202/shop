// pages/set/setmeal/setmeal.js
const app = getApp();
const appData = app.globalData;
const dataMode = require('../../../utils/dataMode')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appData:appData,
    setmeal: [],
    charging: [],
    disabled:[]
  },
  tap(e) {
    console.log(e)
    if (e.mark.item === 'addNewSetmeal') { //添加新套餐
      this.addNewSetmeal(appData.shop_account._id)
    } else if (e.mark.item === 'bindChargingChange') { //修改套餐绑定的计费规则
      this.setData({
        [`setmeal.setmeal[${e.mark.index}].bindChargingId`]: {
          chargingId: this.data.charging[e.detail.value]._id,
          name: this.data.charging[e.detail.value].name,
        },
        [`disabled[${e.mark.index}]`]:false
      })
    } else if (e.mark.item === "bindStartTimeChange") {
      this.setData({
        [`setmeal.setmeal[${e.mark.index}].setmealStartTime`]: e.detail.value,
        [`disabled[${e.mark.index}]`]:false
      })
    } else if (e.mark.item === "bindEndTimeChange") {
      this.setData({
        [`setmeal.setmeal[${e.mark.index}].setmealEndTime`]: e.detail.value,
        [`disabled[${e.mark.index}]`]:false
      })
    }else if (e.mark.item === "cardDeduct"){
      this.setData({
        [`setmeal.setmeal[${e.mark.index}].cardDeduct`]: e.detail.value,
        [`disabled[${e.mark.index}]`]:false
      })
    }
    console.log(this.data.setmeal)
  },
  async save(e){
    console.log(e)
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_setmeal',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          [`setmeal.${e.mark.index}`]:this.data.setmeal.setmeal[e.mark.index]
        }
      }
    })
    if (res.success) {
      app.showToast('保存成功!','success');
      this.setData({
        [`disabled[${e.mark.index}]`]:true
      })
      return;
    }else{
      app.showToast('保存失败!','error');
      return;
    }
  },
  input(e) {
    console.log(e)
    if (e.mark.item === 'setmealPrice') {
      if (e.detail.value !== "") {
        this.setData({
          [`setmeal.setmeal[${e.mark.index}].setmealPrice`]: parseInt(e.detail.value),
          [`disabled[${e.mark.index}]`]:false
        })
      }
    } else if (e.mark.item === 'duration') {
      if (e.detail.value !== "") {
        this.setData({
          [`setmeal.setmeal[${e.mark.index}].duration`]: parseInt(e.detail.value),
          [`disabled[${e.mark.index}]`]:false
        })
      }
    } else if (e.mark.item === "setmealName"){
      if (e.detail.value !== "") {
        this.setData({
          [`setmeal.setmeal[${e.mark.index}].name`]: e.detail.value,
          [`disabled[${e.mark.index}]`]:false
        })
      }
    }
  },
  async delete(e){
    console.log(e);
    const newSetmeal = [];
    const setmeal = this.data.setmeal;
    for (let index = 0; index < setmeal.length; index++) {
      const element = setmeal[index];
      if (index !== e.mark.index) {
        newSetmeal.push(element)
      }
    }
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'setmeal',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'setmeal',
        data:newSetmeal
      }
    })
    if (res === 'ok') {
      this.setData({
        setmeal:newSetmeal
      })
      app.showToast('删除成功!','success');
      return;
    }else{
      app.showToast('删除失败!','error');
      return;
    }
  },
  async addNewSetmeal(shopFlag) {
    let defaultValue = dataMode.shop_setmeal.setmeal[0]
    const res = await app.callFunction({
      name: 'record_push',
      data: {
        collection: 'shop_setmeal',
        query:{
          shopId:appData.shop_account._id
        },
        record:'setmeal',
        data:defaultValue
      }
    })
    if (res.success) {
      this.data.setmeal.setmeal.push(defaultValue)
      this.data.disabled.push(true)
      this.setData({
        setmeal: this.data.setmeal,
        disabled:this.data.disabled
      })
      app.showToast('添加成功!', 'success')
      return;
    } else {
      app.showToast('添加失败!', 'error')
      return;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      setmeal: appData.shop_setmeal,
      charging: appData.shop_charging
    })
    //设置 按钮禁用
    for (let index = 0; index < this.data.setmeal.setmeal.length; index++) {
      this.data.disabled.push(true)
    }
    this.setData({
      disabled:this.data.disabled
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