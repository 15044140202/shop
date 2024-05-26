// pages/operate/manager/manager.js
const utils = require('../../../utils/light');
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    table_data:[]
  },
  //桌台续费函数
  async renew(){
    app.showToast('续费功能待完善!','error')
  },
//添加桌台函数
  async addNewTable(){
    const newTable = {
      chargingFlag:'',
      tableName:'预览桌台',
      tableNum:this.data.table_data.length + 1 ,
      orderForm:'',
      useEndTime : new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    };
    const res = await app.callFunction({
      name:'addArrayDatabase_fg',
      data:{
        collection:'shopAccount',
        shopFlag:appData.shopInfo.shopFlag,
        objName:`shop.tableSum`,
        data:newTable
      }
    });
    if(res === 'ok'){
      app.showToast('添加成功','success');
      this.data.table_data.push(newTable)
      this.setData({
        table_data:this.data.table_data
      })
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('updata',this.data.table_data)
    }else{
      app.showToast('添加失败!','error')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel()
    const that = this;
    eventChannel.on('giveData',function(data){
      that.setData({
        table_data:data
      })
      console.log(that.data.table_data)
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