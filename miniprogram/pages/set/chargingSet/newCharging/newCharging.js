// pages/set/chargingSet/newCharging/newCharging.js
const appData = getApp().globalData;
const app = getApp();
const utils = require('../../../../utils/light');
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    charging: [],
    name: '',
    periodCost: {
      periodTime: 15,
      freeTime: 3
    },
    costCost: {
      everyCost: 15,
      freeCost: 3
    },
    timeSegment: [],
    //该规则的唯一标志
    flag: '',
    //控制计费周期选择框的  hidden
    minuteHidden: false,
    periodHidden: true,
    costHidden: true,
    //是否使用起步价 
    startCost:{
      value:false,
      startTime:3,
      startCost:10
    } ,
    //是否开启高级设置
    advancedSet: false,
    advancedSetHidden: true,
    //是否启用开台押金  及 启动余额提醒
    cashPledge: true,
    pledge:[{name:'1小时',pledge:0},{name:'2小时',pledge:0},{name:'3小时',pledge:0},{name:'4小时',pledge:0},{name:'5小时',pledge:0},{name:'6小时',pledge:0}],
    balanceWarn: true,

    //修改规则  上一页传过来的  index
    index: 0


  },
  startCostSet(e){
    console.log(e.detail.value)
    this.setData({
      [`startCost.${e.mark.name}`]:e.detail.value
    })
    console.log(this.data.startCost.startTime)
  },
  tableTap(){
    Dialog.alert({
      title: '提示',
      message: '桌台计费规则请在修改桌台信息里面进行修改!',
    }).then(() => {
      // on close
    });
  },
  async save() {
    //判断  名称 不能为空  时间段不能没有 
    if (this.data.name === '') {
      wx.showToast({
        title: '请填写名称!',
        icon:'error'
      })
      return ;
    }else if (this.data.timeSegment.length < 1) {
      wx.showToast({
        title: '请设置时段价格!',
        icon:'error'
      })
      return ;
    }
    //构造计费规则 
    const charging = {
      shopFlag: appData.shopInfo.shopFlag,
      flag: this.data.flag,
      name: this.data.name,
      timeSegment: this.data.timeSegment,
      periodSet: this.data.minuteHidden === false ? 'minute' : this.data.periodHidden === false ? 'period' : 'costCost',
      periodCost: this.data.periodCost,
      costCost: this.data.costCost,
      startCost: this.data.startCost,
      cashPledge: this.data.cashPledge,
      pledge:this.data.pledge,
      balanceWarn: this.data.balanceWarn,
      bindTable: []
    }
    const res = await this.addCharging(charging)
    console.log(res)
  },
  async addCharging(p) {
    //此处有两个分支  当flag有值的时候  为修改原有数据   当flag为空的时候 为新增数据
    if (p.flag === '') { //新增数据**********************
      console.log('新添加计费规则!')
      var newP = p;
      newP.flag = await utils.getRandomString(20)
      const res = await app.callFunction({
        name:'addArrayDatabase_fg',
        data:{
          collection:'charging',
          shopFlag:newP.shopFlag,
          objName:'charging',
          data:newP
        }
      })
      console.log({
        "添加:": '结果',
        res
      })
      //添加成功
      if (res === 'ok') {
        this.getOpenerEventChannel().emit('upData', {
          charging: newP
        });
        console.log('添加成功!')
        //添加成功!
        wx.navigateBack()
        return true
      } else {
        console.log('添加失败!')
        return false
      }
    } else { //修改数据**********************
      console.log('修改计费规则!')
      const res = await app.callFunction({
        name:'amendArrayDatabase_fg',
        data:{
          collection:'charging',
          record:'charging',
          arrayFlag:'flag',
          data:p
        }
      })
      console.log({
        "添加:": '结果',
        res
      })
      if (res === 'ok') {
        //聚合数据
        this.data.charging[this.data.index].name = this.data.name
        this.data.charging[this.data.index].periodCost = this.data.periodCost
        this.data.charging[this.data.index].costCost = this.data.costCost
        this.data.charging[this.data.index].timeSegment = this.data.timeSegment
        this.data.charging[this.data.index].flag = this.data.flag
        this.data.charging[this.data.index].periodSet = this.data.minuteHidden === false ? 'minute' : this.data.periodHidden === false ? 'period' : 'costCost'
        this.data.charging[this.data.index].startCost = this.data.startCost
        this.data.charging[this.data.index].cashPledge = this.data.cashPledge
        this.data.charging[this.data.index].balanceWarn = this.data.balanceWarn
        //返回给上一界面新数据
        this.getOpenerEventChannel().emit('updateInvoice', {
          charging: this.data.charging
        });
        console.log('添加成功!')
        //添加成功!
        wx.navigateBack()
        return true
      } else {
        console.log('添加失败!')
        return false
      }
    }
  },

  balanceWarn() {
    this.setData({
      balanceWarn: this.data.balanceWarn === false ? true : false
    })
  },
  cashPledge() {
    this.setData({
      cashPledge: this.data.cashPledge === false ? true : false
    })
  },
  advancedSet() {
    this.setData({
      advancedSetHidden: this.data.advancedSetHidden === true ? false : true
    })
  },
  startCost() {
    this.setData({
      ['startCost.value']: this.data.startCost.value === false ? true : false
    })
  },
  startCostSet(e){
    this.setData({
      [`startCost.${e.mark.name}`]: e.detail.value
    })
  },
  addNewTimeSegment() {
    if (this.data.timeSegment.length > 1) {
      wx.showToast({
        title: '最多两个时段!',
        icon: 'error'
      })
    } else if (this.data.timeSegment.length === 0) {
      this.data.timeSegment.push({
        startTime: '00:00',
        endTime: '00:00',
        price: 25
      });
      this.setData({
        timeSegment: this.data.timeSegment
      })
    } else {
      let myArray = this.data.timeSegment;
      myArray[0].startTime = '00:00';
      myArray[0].endTime = '16:00';
      myArray[0].price = 25
      myArray.push({
        startTime: '16:00',
        endTime: '00:00',
        price: 30
      });
      this.setData({
        timeSegment: myArray
      })
    }
  },
  gotoTimeSegment(e) {
    console.log(e.mark.mymark)
    wx.navigateTo({
      url: `./timeSegment/timeSegment?index=${e.mark.mymark}`,
      // events: 注册将在目标页面触发（派发）的同名事件的监听器
      events: {
        updateInvoice: (result) => {
          console.log('返回传输的数据', result);
          this.amendTimeSegment(result.timeSegment)
        }
      },
      // success：跳转后进行可通过res.eventChannel 触发自定义事件
      success: (res) => {
        res.eventChannel.emit('sendQueryParams', {
          timeSegment: this.data.timeSegment
        })
      }
    })
  },
  //这个函数  用于检测设置的时间段是否正确  不正确 有重叠 或空缺会自动修改
  amendTimeSegment(timeSegment) { ///
    this.setData({
      timeSegment: timeSegment
    })
    console.log(this.data.timeSegment)
  },
  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },
  minuteTap() {
    this.setData({
      minuteHidden: false,
      periodHidden: true,
      costHidden: true
    })
  },
  periodTap() {
    this.setData({
      minuteHidden: true,
      periodHidden: false,
      costHidden: true
    })
  },
  costTap() {
    this.setData({
      minuteHidden: true,
      periodHidden: true,
      costHidden: false
    })
  },
  nameData(e) {
    this.setData({
      name: e.detail.value
    })
  },
  periodTime(e) {
    this.setData({
      'periodCost.periodTime': e.detail.value
    })
  },
  freeTime(e) {
    this.setData({
      'periodCost.freeTime': e.detail.value
    })
  },
  everyCost(e) {
    this.setData({
      'costCost.everyCost': e.detail.value
    })
  },
  freeCost(e) {
    this.setData({
      'costCost.freeCost': e.detail.value
    })
  },
  input(e){
    console.log(e);
    if (e.detail.value === '') {//无用数据  
       return; 
    };
    if (e.mark.item === 'name') {
      this.setData({
        [`pledge[${e.mark.index}].name`]:e.detail.value
      })
    }else if(e.mark.item === 'pledge'){
      this.setData({
        [`pledge[${e.mark.index}].pledge`]:parseInt(e.detail.value) 
      })
    }else{//未知数据
      return;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const index = parseInt(options.index, 10)
    this.setData({
      index: index
    })
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    let eventChannel = this.getOpenerEventChannel();
    eventChannel.once('sendQueryParams', (params) => {
      console.log('上一页面传来的数据', params);
      this.setData({
        charging: params.charging,
        name: params.charging[index].name,
        flag: params.charging[index].flag,
        periodCost: params.charging[index].periodCost,
        costCost: params.charging[index].costCost,
        timeSegment: params.charging[index].timeSegment,
        //控制计费周期选择框的  hidden
        minuteHidden: params.charging[index].periodSet === 'minute' ? false : true,
        periodHidden: params.charging[index].periodSet === 'period' ? false : true,
        costHidden: params.charging[index].periodSet === 'costCost' ? false : true,
        //是否使用起步价 
        startCost: params.charging[index].startCost,
        //是否启用开台押金  及 启动余额提醒
        cashPledge: params.charging[index].cashPledge,
        pledge:params.charging[index].pledge,
        balanceWarn: params.charging[index].balanceWarn
      })
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