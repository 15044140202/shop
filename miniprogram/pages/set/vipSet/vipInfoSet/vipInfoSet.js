// pages/set/vipSet/vipInfoSet/vipInfoSet.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel:'设置会员的折扣、价格及存款',
    vipInfo:[],
    getIndex:0,
    tableDiscountIO:true
   
  },
  async save(){
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection: 'vipInfo',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'vipInfo',
        data:this.data.vipInfo
      }
    })
    if (res === 'ok') {
      app.showToast('保存成功!','success');
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('returnData', {data: 'ok'});
      wx.navigateBack();
    }else{
      app.showToast('保存失败!','error');
    }
  },
  addNewSave(){
    const NewSave = {amount:0,give:0,name:'存款'};
    this.data.vipInfo[this.data.getIndex].saveMoney.push(NewSave);
    this.setData({
      [`vipInfo[${this.data.getIndex}].saveMoney`]:this.data.vipInfo[this.data.getIndex].saveMoney
    })
  },
  change(e){
    this.setData({
      [`vipInfo[${this.data.getIndex}].${e.mark.name}`]:this.data.vipInfo[this.data.getIndex][`${e.mark.name}`]===true ? false : true
    })
    console.log(this.data.vipInfo[this.data.getIndex][`${e.mark.name}`])
  },
  hiddenTap(e){
    this.setData({
      [e.mark.name]:this.data[e.mark.name] === true ? false : true
    })
  },
  input(e){
    console.log(e.mark.name1 + e.mark.name2)
    console.log(e.detail.value)
    if (e.mark.name1 === 'name' && this.data.getIndex == 0) {
      wx.showToast({
        title: '非会员不可修改!',
        icon:'error'
      })
      this.setData({
        [`vipInfo[${this.data.getIndex}].${e.mark.name1}${e.mark.name2}`]: this.data.vipInfo[this.data.getIndex].name
      })
    }else{
      const temp = e.mark.name1 === 'name' ? e.detail.value :parseFloat(e.detail.value)
      this.setData({
        [`vipInfo[${this.data.getIndex}].${e.mark.name1}${e.mark.name2}`]:temp
      })
    }
    console.log(this.data.vipInfo[this.data.getIndex][`${e.mark.name1}`])
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) { 
    console.log(options.index);
    this.setData({
      getIndex:options.index
    })
    const eventChannel = this.getOpenerEventChannel();
    const that = this ;
    eventChannel.on('giveData', function(data) {
      that.setData({
        vipInfo:data.data
      })
      console.log(that.data.vipInfo)
    });
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