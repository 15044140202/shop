// pages/set/chargingSet/chargingSet.js
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
const utils = require('../../../utils/light');
import Dialog from '../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    charging: [],
    bindTableCount: [],
  },
  //长按某项 规则
  longPress(e){
    const i = e.mark.index
    Dialog.alert({
      title: '确认删除',
      message: this.data.charging[i].name,
      showCancelButton:true,
    }).then(() => {
      this.deleteCharging(i)
    }).catch(() => {

    });

  },
  //删除某计费规则
  async deleteCharging(e){
    const i = e
    const charing = this.data.charging;
    var newCharging = [];
    for (let index = 0; index < charing.length; index++) {
      const element = charing[index];
      index === i ? console.log('删除第' + index +'条规则') : newCharging.push(element)
    }
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'charging',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'charging',
        data:newCharging
      }
    })
    if (res === 'ok') {
      console.log('删除数据成功!')
      this.loadData()
    }else{
      console.log('删除数据失败!')
    }
  },
  //获取每个计费规则 绑定的球桌数量
  getBindTable(tableData) { //此处传过来桌台数据
    //先清空数据 否测会重复添加
    for (let i = 0; i < this.data.charging.length; i++) {
        this.data.charging[i].bindTable = [];
    }
    for (let index = 0; index < tableData.length; index++) {
      const element = tableData[index];
      for (let i = 0; i < this.data.charging.length; i++) {
        const e = this.data.charging[i];
        if (element.chargingFlag === e.flag) {
          this.data.charging[i].bindTable.push(element.tableNum)
        }
      }
    }
  },

  gotoNew() {
    wx.navigateTo({
      url: './newCharging/newCharging',
      //定义一个监听事件
      events:{
        upData:(result)=>{
          console.log(result)
          this.data.charging.push(result.charging)
          //用于刷新 计费规则 绑定的桌台数量 数据
          this.getBindTable(appData.shopInfo.shop.tableSum)
          this.data.bindTableCount = [] //初始化数据  防止二次加载时 数据异常
          for (let index = 0; index < this.data.charging.length; index++) {
            const element = this.data.charging[index];
            this.data.bindTableCount.push(element.bindTable.length)
          }
          this.setData({
            charging:this.data.charging,
            bindTableCount: this.data.bindTableCount
          })
        }
      },
      success:(res)=>{
        res.eventChannel.emit('upData',{
          charging: this.data.charging
        })
      }
    })
  },
  goto(e) {
    console.log(e.mark.mymark)
    wx.navigateTo({
      url: `./newCharging/newCharging?index=${e.mark.mymark}`,
      // events: 注册将在目标页面触发（派发）的同名事件的监听器
      events: {
        updateInvoice: (result) => {
          console.log('返回传输的数据', result);
          this.setData({
            charging:result.charging
          })
        }
      },
      // success：跳转后进行可通过res.eventChannel 触发自定义事件
      success: (res) => {
        res.eventChannel.emit('sendQueryParams', {
          charging: this.data.charging
        })
      }
    })
  },
  async loadData(){
    console.log('getDatabaseRecord_fg')
    const res = await app.callFunction({name:'getDatabaseRecord_fg',data:{collection:'charging',record:'charging',shopFlag:appData.shopInfo.shopFlag}})
    console.log(res)
    this.setData({
      charging: res,
      //charging_id:res._id
    })
    this.getBindTable(appData.shopInfo.shop.tableSum)
    this.data.bindTableCount = [] //初始化数据  防止二次加载时 数据异常
    for (let index = 0; index < this.data.charging.length; index++) {
      const element = this.data.charging[index];
      this.data.bindTableCount.push(element.bindTable.length)
    }
    this.setData({
      bindTableCount: this.data.bindTableCount
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.loadData();
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