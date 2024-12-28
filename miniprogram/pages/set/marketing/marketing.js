// pages/set/marketing/marketing.js
const app = getApp();
const appData = app.globalData;
Page({
  /**
   * 页面的初始数据
   */
  data: {
    itemSelect: '',

    luckSudoku: {
      switch: false,
      prize: [{
          name: '谢谢!',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '红牛1瓶',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '谢谢!',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '代金券',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '谢谢!',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '代金券',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '谢谢!',
          totalSum: 100,
          probability:0.125
        },
        {
          name: '谢谢!',
          totalSum: 100,
          probability:0.125
        },
      ],
      startDate: '2024/07/28 00:00:00',
      endDate: '2024/09/28/ 00:00:00',
      everyDaySum:0
    }
  },
  tap(e) {
    console.log(e)
    if (this.data.itemSelect === e.mark.item) { //再次点击  隐藏所有
      this.setData({
        itemSelect: ''
      })
      return;
    } else if (e.mark.item === 'luckSudoku') {
      this.setData({
        itemSelect: 'luckSudoku'
      })
      return;
    } else if (e.mark.item === 'luckSudokuSwitch') {
      if (this.data.luckSudoku.switch === false) {
        this.setData({
          ['luckSudoku.switch']: true
        })
      } else {
        this.setData({
          ['luckSudoku.switch']: false
        })
      }
      return;
    }
  },
  computerProbability(name){ 
    const prize = this.data[`${name}`].prize;
    var totalSum = 0;
    for (let index = 0; index < prize.length; index++) {//计算总数量
      const element = prize[index];
      totalSum += element.totalSum
    }
    for (let index = 0; index < prize.length; index++) {//计算每个概率
      const element = prize[index];
      this.setData({
        [`${name}.prize[${index}].probability`]:element.totalSum/totalSum*100
      })
    }
  },
  input(e){
    console.log(e);
    if (e.mark.item === 'luckSudokuPrizeName') {
      if (e.detail.value.length > 12) {
        app.showToast('名称过长!','error')
        return;
      }else{
        this.setData({
          [`luckSudoku.prize[${e.mark.index}].name`]:e.detail.value
        })
        return;
      }
    }else if (e.mark.item === 'luckSudokuPrizeTotalSum'){
      this.setData({
        [`luckSudoku.prize[${e.mark.index}].totalSum`]:parseInt(e.detail.value) 
      })
      this.computerProbability('luckSudoku');
      return;
    }else if (e.mark.item === 'luckSudokuEveryDaySum'){
      this.setData({
        [`luckSudoku.everyDaySum`]:parseInt(e.detail.value) 
      })
      return;
    }
  },
  change(e){
    console.log(e);
    if (e.mark.item === 'luckSudokuStartDate') {
      this.setData({
        [`luckSudoku.startDate`]:e.detail.value.replace(/-/g, '/') + " 00:00:00"
      })
      return;
    }else if (e.mark.item === 'luckSudokuEndDate'){
      this.setData({
        [`luckSudoku.endDate`]:e.detail.value.replace(/-/g, '/') + " 00:00:00"
      })
      return;
    }
  },
  video_tap() {
    console.log('显示演示视频')
  },
  async getLuckSudoku(shopFlag){
    const res = await app.callFunction({
      name:'getDatabaseRecord_fg',
      data:{
        collection:'luckSudoku',
        record:'luckSudoku',
        shopFlag:shopFlag
      }
    })
    console.log(res)
    if (Object.keys(res).length === 0) {//空数据
      const r = await this.save();
      if (r === 'ok') {
        app.showToast('初始化成功!')
      }else{
        app.showToast('初始化失败!')
      }
    }else{
      this.setData({
        luckSudoku:res
      })
      return;
    }
  },
  async save(){
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'luckSudoku',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'luckSudoku',
        data:this.data.luckSudoku
      }
    })
    if (res === 'ok') {
      //保存成功
      app.showToast('保存成功!','success')
      console.log(res)
    }else{
      //保存失败!
      app.showToast('保存失败!','error')
      console.log(res)
    }
    return res;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //获取数据-幸运九宫格
    const  res = await this.getLuckSudoku(appData.shopInfo.shopFlag)

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