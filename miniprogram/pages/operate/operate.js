// pages/operate/operate.js
const utils = require('../../utils/light');
const appData = getApp().globalData;
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    tableCtrlShow: false,
    longPressShow: false,
    color1: "#646464",
    optNum: 0,
    switchName: '重发关灯指令',
    sortColor: "red",

    //我的 相关 数据
    show: false,
    options: [
      '上班', //考勤记录
      '应交现金'
    ],
    //营业设置
    operateSet: {},

    menu_data: [{
        iconName: 'shopping-cart-o',
        titel_name: "外卖",
        path: "./outSell/outSell"
      },
      {
        iconName: 'comment-o',
        titel_name: "消息",
        path: "./message/message"
      },
      {
        iconName: 'friends-o',
        titel_name: "在店顾客",
        path: "./inShopCustomer/inShopCustomer"
      },
      {
        iconName: 'manager-o',
        titel_name: "我的",
        path: "./my/my"
      }
    ],
    table_data: appData.shopInfo.shop.tableSum,
    tableState: [],
    shopName_selet: [],
    shopNameSwitch: false
  },

  async tap(e) {
    console.log(e.mark.item)
    if (e.mark.item === '上班') {
      if (appData.status === 'boss') {
        app.showToast('老板不需要打卡!', 'error')
      } else {
        app.showLoading('打卡中...', true)
        //发送打卡信息...  
        const now = new Date();
        const nowYM = app.getNowTime_noSTR(now, '年月')
        const res = await app.callFunction({ //此步骤为了 如果为创建本月打卡模版的情况创建打卡模版
          name: 'getDatabaseRecord_fg',
          data: {
            collection: 'memberAttendance',
            record: `attendance${nowYM}`,
            shopFlag: appData.shopInfo.shopFlag
          }
        })
        console.log(res)
        const r = await app.callFunction({
          name: 'attendance',
          data: {
            memberOpenid: appData.merchantInfo._openid,
            shopFlag: appData.shopInfo.shopFlag,
            attendanceInfo: true, //true  为上班   false为下班
            dateYM: nowYM
          }
        })
        if (r === 'ok') {
          await app.getShopInfo(appData.shopInfo.shopFlag)
          app.showToast('打卡成功!', 'success')
          wx.hideLoading();
          this.setData({ //刷新 打卡状态
            ['options[0]']: this.getAttendanceState() === false ? '上班' : '下班' //获取打卡信息
          })
        } else {
          app.showToast('打卡失败!', 'error')
          wx.hideLoading();
        }
      }
    } else if (e.mark.item === '下班') {
      if (appData.status === 'boss') {
        app.showToast('老板不需要打卡!', 'error')
      } else {
        //发送打卡信息...  
        app.showLoading('打卡中...', true)
        const now = new Date();
        const nowYM = app.getNowTime_noSTR(now, '年月')
        const res = await app.callFunction({ //此步骤为了 如果为创建本月打卡模版的情况创建打卡模版
          name: 'getDatabaseRecord_fg',
          data: {
            collection: 'memberAttendance',
            record: `attendance${nowYM}`,
            shopFlag: appData.shopInfo.shopFlag
          }
        })
        console.log(res)
        const r = await app.callFunction({
          name: 'attendance',
          data: {
            memberOpenid: appData.merchantInfo._openid,
            shopFlag: appData.shopInfo.shopFlag,
            attendanceInfo: false, //true  为上班   false为下班
            dateYM: nowYM
          }
        })
        if (r === 'ok') {
          await app.getShopInfo(appData.shopInfo.shopFlag)
          app.showToast('打卡成功!', 'success')
          wx.hideLoading();
          this.setData({ //刷新 打卡状态
            ['options[0]']: this.getAttendanceState() === false ? '上班' : '下班' //获取打卡信息
          })
        } else {
          wx.hideLoading();
          app.showToast('打卡失败!', 'error')
        }
      }
    }
    this.setData({
      show: false
    })
  },
  async getSweepSet() {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'operateSet',
        record: 'operateSet',
        shopFlag: appData.shopInfo.shopFlag
      }
    })
    console.log(res)
    return res;
  },
  async goto(e) {
    if (e.mark.path === './my/my') {
      this.setData({
        show: true
      })
    } else {
      wx.navigateTo({
        url: e.mark.path,
      })
    }

  },
  async tableManager() {
    if (await app.power('systemSet', 4, '桌台管理') === true) {
      console.log('有权限')
    } else {
      app.showToast('没有权限!', 'error')
      return;
    }
    const that = this;
    wx.navigateTo({
      url: './manager/manager',
      events: {
        updata: function (data) {
          that.setData({
            table_data: data
          })
          //调用刷新桌台状态函数
          that.refreshTableState();
          console.log(that.data.table_data)
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.table_data)
      }
    })
  },
  onClose() {
    this.setData({
      show: false
    });
  },
  getAttendanceState() {
    const member = appData.shopInfo.shop.member;
    if (appData.status === 'boss') {
      return false; //老板不需要打卡
    }
    for (let index = 0; index < member.length; index++) {
      const element = member[index];
      if (element.memberOpenid === appData.merchantInfo._openid) { // 实验完成  需要把这个openid  换成 appData
        return element.attendanceState;
      }
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      ['options[0]']: this.getAttendanceState() === false ? '上班' : '下班' //获取打卡信息
    })
    console.log(this.data.options)
    //刷新桌台状态数据
    await this.refreshTableState();
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    //定时扫描店铺桌台状态
    setInterval(() => {
      //刷新桌台状态数据
      this.refreshTableState();

    }, 30000)
  },

  async refreshTableState() {
    //设置本地变量 信号颜色变化 
    this.setData({
      sortColor: 'red'
    })
    //刷新店铺订单状态 
    appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate());
    this.data.tableState = [];
    //添加本地桌台状态模型
    for (let index = 0; index < this.data.table_data.length; index++) {
      const element = this.data.table_data[index];
      if (element.orderForm === '') { //空闲桌台
        this.data.tableState.push({
          state: '空闲',
          endTime: '',
          tableCost: ''
        })
      } else { //非空台
        this.data.tableState.push(
          await this.getTableStateOfOrderForm(element.orderForm)
        )
      }
    }
    this.setData({
      tableState: this.data.tableState
    })
    //获取桌台状态
    appData.shopInfo.shop = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'shopAccount',
        record: 'shop',
        shopFlag: appData.shopInfo.shopFlag
      },
      showLoading: false
    })
    //设置本地变量 信号颜色变化  及刷新桌台信息
    this.setData({
      table_data: appData.shopInfo.shop.tableSum,
      sortColor: 'green'
    })
  },
  async getTableStateOfOrderForm(orderFormNum) {
    var tempData = {
      state: '空闲',
      endTime: '',
      tableCost: ''
    }
    const todayOrderForm = appData.orderForm;
    for (let index = 0; index < todayOrderForm.length; index++) {
      const element = todayOrderForm[index];
      if (element.orderNum === orderFormNum && element.endTime === '未结账') { //这个订单
        console.log(element.orderNum.slice(0, 1))
        //根据订单数据  修改 桌台开台类型
        if (element.orderNum.slice(0, 1) === 'S') {
          tempData.state = '自助开台';
        } else {
          tempData.state = '店员开台';
        }
        //根据订单数据  修改 桌台结束时间
        console.log(element.startTime)
        let now = new Date(element.startTime).getTime() + 60 * 60 * 1000 * (element.cashPledge / element.price);
        tempData.endTime = app.getNowTime(new Date(now)).slice(12)
        tempData.tableCost = parseInt(element.price * (new Date().getTime() - new Date(element.startTime).getTime()) / 1000 / 60 / 60);
        console.log(tempData.tableCost)
        return tempData;
      } else if (index === todayOrderForm.length - 1) { //今天数据没有 此订单信息 的情况
        //获取昨日订单数据

      }
    }

  },
  async refrishOrderForm() {
    await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate());
    const orderForm = appData.orderForm;
    for (let index = 0; index < orderForm.length; index++) {
      const element = orderForm[index];

    }

  },

  tableCtrlClose() {
    this.setData({
      tableCtrlShow: false
    });
  },
  longPressClose() {
    this.setData({
      longPressShow: false
    });
  },
  tableTap(p) {
    this.setData({
      optNum: p.mark.tableMark + 1,
      tableCtrlShow: true,
      switchName: appData.shopInfo.shop.tableSum[p.mark.tableMark].tableState === '空闲' ? '重发关灯指令' : '重发开灯指令'
    })
  },
  tableLongPress(p) {
    this.setData({
      optNum: p.mark.tableMark + 1,
      longPressShow: true
    })
  },
  async sweepOpenLight() {
    //首先应该判断 是否绑定了灯控器
    if (await app.haveLight() === false) { //没有绑定灯控器
      app.showToast('请先绑定灯控!','error')
      return;
    }
    //获取打扫设置
    this.data.operateSet = await this.getSweepSet();
    app.showLoading('指令下发中!', true)
    //判断是否允许打扫开灯
    if (this.data.operateSet.sweepSet.sweep === false) { //允许打扫开灯
      app.showToast('设置禁用!', 'error')
      return;
    }
    await utils.lightCtrl({ //开灯
      lightName: appData.shopInfo.shop.lightId,
      lightData: `{"A${this.data.optNum.toString().padStart(2, '0') }":110000,"res":"123"}`
    })

    await this.delay(2000)
    await utils.lightCtrl({ //定时关灯
      lightName: appData.shopInfo.shop.lightId,
      lightData: `{"A${this.data.optNum.toString().padStart(2, '0') }":20${(this.data.operateSet.sweepSet.sweepTime*60).toString().padStart(4,'0')},"res":"123"}`
    })
    wx.hideLoading()
    this.longPressClose() //关闭菜单
    return;
  },
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async open(e) { //开台
    if (await app.power('operate', '1', '开台')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }
  },
  async timedOpen(e) { //开台
    if (await app.power('operate', '1', '开台')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }

  },
  async couponOpen(e) { //开台
    if (await app.power('operate', '1', '开台')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }

  },

  async tapLight() {
    //首先应该判断 是否绑定了灯控器
    if (await app.haveLight() === false) { //没有绑定灯控器
      return;
    }
    var io = 'off'
    var offTime = new Date().getTime() //如果为重发开灯指令  则需要获取到开台信息 的关灯时间
    this.data.switchName === '重发关灯指令' ? io = 'off' : io = 'on';
    const res = await app.callFunction({
      name: 'getLightState',
      data: {
        shopFlag: appData.shopInfo.shopFlag,
        lightNum: this.data.optNum,
        lightState: io,
        offTime: offTime
      }
    });
    console.log(res);
    await utils.lightCtrl({
      lightName: appData.shopInfo.shop.lightId,
      lightData: res
    })
    this.tableCtrlClose() //关闭菜单
  },
  async tapTableInfo() {
    if (await app.power('systemSet', 4, '桌台管理')) {
      console.log('有权限')
    } else {
      app.showToast('没有权限', 'error');
      return;
    }

    wx.navigateTo({
      url: `./tableInfo/tableInfo?tableNum=${this.data.optNum}`,
    })
    this.setData({
      tableCtrlShow: false
    })
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