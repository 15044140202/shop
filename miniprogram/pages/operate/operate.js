// pages/operate/operate.js
const utils = require('../../utils/light');
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
import Dialog from '@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    APPDATA: appData,
    shopInfo: appData.shopInfo,
    tableCtrlShow: false,
    longPressShow: false,
    cashPledgeShow: false, //押金输入界面显示/隐藏
    cashPledge: 0, //开台押金金额
    payMode: '微信', //支付方式选择
    payModeShow: false, //支付方式选择界面
    color1: "#646464",
    optNum: 0, //选择桌台序号
    optPrice: 0, //选择桌台单价
    switchName: '重发关灯指令',
    closeOrOpen: '开台',

    sortColor: "red",
    message: [],
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
        path: "./outSell/outSell",
        showRedDot: false
      },
      {
        iconName: 'comment-o',
        titel_name: "消息",
        path: "./message/message",
        showRedDot: false
      },
      {
        iconName: 'friends-o',
        titel_name: "在店顾客",
        path: "./inShopCustomer/inShopCustomer",
        showRedDot: false
      },
      {
        iconName: 'manager-o',
        titel_name: "我的",
        path: "./my/my",
        showRedDot: false
      }
    ],
    table_data: appData.shopInfo.shop.tableSum,
    tableState: [],
    charging: [],
    integral: {},

    tableOrder: [],

    watcher: undefined // 店铺信息监听器
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
    } else if (e.mark.item === 'cashPledge') { //设置押金金额
      this.setData({
        cashPledge: parseInt(e.mark.value)
      })
    } else if (e.mark.item === 'payMode') { //设置支付方式
      this.setData({
        payMode: e.mark.value
      })
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
        ['shopInfo.telephone']: phoneNum
      })
      appData.shopInfo.telephone = phoneNum
      this.setData({
        bindTelShow: false
      })
    } else {
      console.log('没有获取到手机号码!')
    }
  },
  async tableManager() {
    //判断电话号码认证是否完成
    if (appData.shopInfo.telephone === "1" || appData.shopInfo.telephone === "") { //认证手机号码
      this.setData({
        bindTelShow: true
      })
      return;
    }
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
  onClose(e) {
    if (e.mark.item === 'cashPledge') { //押金显示 点击取消
      this.setData({
        cashPledgeShow: false,
      })
    } else if (e.mark.item === 'payMode') { //支付方式选择界面显示  点击取消 
      this.setData({
        payModeShow: false,
      })
    } else { //未定义 内容
      this.setData({
        show: false
      });
    }

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
    //获取本店计费规则  积分规则
    this.setData({
      charging: await app.callFunction({
        name: 'getDatabaseRecord_fg',
        data: {
          collection: 'charging',
          record: 'charging',
          shopFlag: appData.shopInfo.shopFlag
        }
      }),
      integral: await app.callFunction({
        name: 'getDatabaseRecord_fg',
        data: {
          collection: 'integral',
          record: 'integral',
          shopFlag: appData.shopInfo.shopFlag
        }
      }),
      operateSet: await this.getSweepSet()
    })
    console.log(this.data.options)
    //处理消息
    this.setData({
      [`menu_data[1].showRedDot`]: this.disposeMessage(appData.orderForm)
    })

    //开启监听本店桌台订单
    const that = this;
    appData.watcher = db.collection('shopAccount').where({
      shopFlag: appData.shopInfo.shopFlag
    }).watch({
      onChange: function (snapshot) {
        console.log('snapshot:', snapshot);
        if (appData.shopInfo.shopFlag === snapshot.docChanges[0].doc.shopFlag) { //确保店铺没有被切换  数据对应没有错误
          appData.shopInfo = snapshot.docChanges[0].doc;
          that.refreshTableState();
        }
      },
      onError: function (err) {
        console.error('the watch closed because of error', err)
      }
    })
    console.log(this.data.watcher);
    await app.checkMerchantBalance(appData.shopInfo, this.data.operateSet)
  },
  disposeMessage(orderArray) {
    for (let index = 0; index < orderArray.length; index++) {
      const element = orderArray[index];
      if (element.orderName === "店员开台订单" || element.orderName === "自助开台订单" || element.orderName === "自助套餐订单") {
        if (element.endTime !== '未结账' && !('sweep' in element)) { //已结账单  未打扫 显示红点
          return true;
        }
      } else if (element.orderName === '商品单') {
        if (!('sweep' in element)) { //已结账单  未打扫 显示红点
          return true;
        }
      }
    }
    return false;
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {},
  async refreshTableState(param) {
    var autoClear = false;
    //刷新本地桌台数据 信号颜色变化 
    this.setData({
      sortColor: 'red',
      table_data: appData.shopInfo.shop.tableSum
    })
    // appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate(), 'null', 'null');
    this.data.tableState = [];
    //判断桌台订单 长度 与桌台数据 是否一致
    if (this.data.tableOrder.length !== this.data.table_data.length) { //不一致则 初始化
      this.data.tableOrder = []
      for (let index = 0; index < this.data.table_data.length; index++) {
        this.data.tableOrder.push(null)
      }
      console.log(this.data.tableOrder)
    }
    //循环获取桌台 订单信息
    for (let index = 0; index < this.data.table_data.length; index++) {
      const element = this.data.table_data[index];
      if (element.orderForm === '') { //判断桌台是否为空台
        this.data.tableState.push({
          endTime: '',
          state: '空闲',
          tableCost: ''
        })
        //对应桌台订单赋值 为 null
        this.data.tableOrder[index] = null;
      } else { //非空台
        //先判断 现有桌台订单 是否为null
        if (this.data.tableOrder[index] === null) { //为空
          //获取这个订单
          const res = await this.getTableStateOfOrderForm(element.orderForm, this.data.charging, element.chargingFlag)
          console.log(res)
          this.data.tableOrder[index] = res.order
          this.data.tableState.push(res.tableState)
        } else { //非空  判断订单与桌台订单 是否一致
          if (this.data.tableOrder[index].orderNum === element.orderForm) { //订单 编号一致 则不需要更新
            const thisOrder = this.data.tableOrder[index];
            //给桌台状态赋值
            var now = undefined;
            if ('orderTotalTimeLong' in thisOrder) {
              now = new Date(thisOrder.startTime).getTime() + 60 * 1000 * (thisOrder.orderTotalTimeLong); //结束时间
            } else {
              now = new Date(thisOrder.startTime).getTime() + 60 * 60 * 1000 * (thisOrder.cashPledge / thisOrder.price); //结束时间
            }
            this.data.tableState.push({
              endTime: thisOrder.cashPledge > 0 || thisOrder.cashCoupon > 0 ? app.getNowTime(new Date(now), 'hms') : '非定时开台', //结束时间
              state: thisOrder.orderNum.slice(0, 1) === 'S' ? '自助开台' : '店员开台', //根据订单数据  修改 桌台开台类型
              tableCost: thisOrder.orderName === '自助套餐订单' ? thisOrder.cashPledge : app.computeTableCost(this.data.charging, element.chargingFlag, thisOrder.price, thisOrder.startTime, new Date()) //已消费金额
            })
            //判断结束时间 是否已结束  已结束 函数最后调用 自动结算函数
            // if (new Date().getTime() >= new Date(now).getTime() && thisOrder.cashPledge > 0) { //订单已到时间 并且是押金模式
            //   autoClear = true;
            // } 
          } else { //不一致 需要更新
            //获取这个订单
            const res = await this.getTableStateOfOrderForm(element.orderForm, this.data.charging, element.chargingFlag)
            console.log(res)
            this.data.tableOrder[index] = res.order
            this.data.tableState.push(res.tableState)
          }
        }
      }
    }
    //设置本地变量 信号颜色变化  及刷新桌台信息
    this.setData({
      sortColor: 'green',
      tableState: this.data.tableState
    })
    //更新本地账单数据 以便消息 提示
    if (param !== false) {
      appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate(), 'null', 'null')
      this.setData({
        [`menu_data[1].showRedDot`]: this.disposeMessage(appData.orderForm)
      })
    }

  },
  async getTableStateOfOrderForm(orderFormNum, chargingArray, chargingFlag) {
    var tempData = {
      state: '空闲',
      endTime: '',
      tableCost: ''
    }
    var thisOrder = undefined;
    const todayOrderForm = appData.orderForm;
    //匹配今日订单数据
    for (let index = 0; index < todayOrderForm.length; index++) {
      const element = todayOrderForm[index];
      if (element.orderNum === orderFormNum && element.endTime === '未结账') { //这个订单
        thisOrder = element //寻找到订单
        break;
      }
    }
    //判断今日订单数据  是否匹配到
    if (thisOrder === undefined) { //没有匹配到
      //服务器里搜索该订单数据
      const res = await app.getOrderForm(appData.shopInfo.shopFlag, app.getOrderFormDate(orderFormNum), 'orderNum', orderFormNum)
      console.log({
        '搜索到订单数据': res
      })
      thisOrder = res; //寻找到订单
    }
    console.log({
      '匹配订单': thisOrder
    })
    console.log(thisOrder.orderNum.slice(0, 1))
    //根据订单数据  修改 桌台开台类型
    thisOrder.orderNum.slice(0, 1) === 'S' ? tempData.state = '自助开台' : tempData.state = '店员开台';

    //根据订单数据  修改 桌台结束时间
    console.log(thisOrder.startTime)
    var now = undefined;
    if ('orderTotalTimeLong' in thisOrder) {
      now = new Date(thisOrder.startTime).getTime() + 60 * 1000 * (thisOrder.orderTotalTimeLong)
    } else {
      now = new Date(thisOrder.startTime).getTime() + 60 * 60 * 1000 * (thisOrder.cashPledge / thisOrder.price);
    }
    tempData.endTime = thisOrder.cashPledge > 0 || thisOrder.cashCoupon > 0 ? app.getNowTime(new Date(now), 'hms') : '非定时开台'
    if (thisOrder.orderName === '自助套餐订单') {
      tempData.tableCost = thisOrder.cashPledge;
    } else {
      tempData.tableCost = app.computeTableCost(chargingArray, chargingFlag, thisOrder.price, thisOrder.startTime, new Date());
    }
    console.log(tempData.tableCost)

    return {
      tableState: tempData,
      order: thisOrder
    };
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
      optPrice: this.getNowPrice(p.mark.tableMark),
      tableCtrlShow: true,
      switchName: this.data.table_data[p.mark.tableMark].orderForm === '' ? '重发关灯指令' : '重发开灯指令',
      closeOrOpen: this.data.table_data[p.mark.tableMark].orderForm === '' ? '开台' : '结账'
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
      app.showToast('请先绑定灯控!', 'error')
      return;
    }
    app.showLoading('指令下发中!', true)
    //判断是否允许打扫开灯
    if (this.data.operateSet.sweepSet.sweep === false) { //允许打扫开灯
      app.showToast('设置禁用!', 'error')
      return;
    }
    app.showLoading('指令下发中!', true)
    await app.callFunction({
      name: 'lightCtrl',
      data: {
        lightName: appData.device.lightCtrl,
        lightData: `{"A${this.data.optNum.toString().padStart(2, '0') }":21${(this.data.operateSet.sweepSet.sweepTime).toString().padStart(4,'0')},"res":"123"}`
      }
    })
    wx.hideLoading()
    this.longPressClose() //关闭菜单
    return;
  },
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  //获取桌台选择的计费规则选项下标
  getChargingSelect(tableChargingFlag, chaging) {
    for (let index = 0; index < chaging.length; index++) {
      const element = chaging[index];
      if (element.flag === tableChargingFlag) {
        return index;
      } else if (index === chaging.length - 1) { //此桌台没有绑定任何计费规则
        return -1;
      }
    }
  },
  //获取此时段 此桌台价格 函数
  getNowPrice(tableNum) {
    //判断tableChargingFlag  是否为未选择,  如果为未选择  不允许开台
    if (this.data.table_data[tableNum].chargingFlag === '') {
      return -1;
    }
    const chargingSeletc = this.getChargingSelect(this.data.table_data[tableNum].chargingFlag, this.data.charging)
    const charging = this.data.charging[chargingSeletc]
    //判断时间是否只有一个    只有一个的话 为全天一个价格!
    if (charging.timeSegment.length === 1) { //返回第一个时间段的价格
      return charging.timeSegment[0].price;
    }
    //多个时间段 判断现在处于哪个时间段区间
    // 1. 获取先时间值
    const now = new Date();
    const time = app.getNowDate(now)
    const nowValue = parseInt(time.slice(8, 12))
    console.log(nowValue)
    // 2. 判断现之间值  处于哪个时间段 并返回对应价格
    charging.timeSegment[0];
    const startTime = this.getTimeInt(charging.timeSegment[0].startTime);
    const endTime = this.getTimeInt(charging.timeSegment[0].endTime);
    console.log({
      '起始时间:': startTime,
      '结束时间:': endTime
    })
    //判断是否处于第一时间段中  如不处于第一时间段  直接返回第二时间段 价格
    if (nowValue >= startTime && nowValue < endTime) {
      return parseInt(charging.timeSegment[0].price);
    } else {
      return parseInt(charging.timeSegment[1].price);
    }
  },
  //取时间字符串 所有整数部分 返回整数型
  getTimeInt(timeString) {
    // 定义字符串
    let timeStr = timeString;
    // 使用正则表达式匹配数字部分
    let matches = timeStr.match(/\d+/g);
    var valuesString = '';
    // 检查是否有匹配结果
    for (let index = 0; index < matches.length; index++) {
      const element = matches[index];
      valuesString += element
    }
    return parseInt(valuesString)
  },
  input(e) {
    console.log(e.mark.item)
    if (e.mark.item === 'pledge') { //设置押金金额
      this.setData({
        cashPledge: parseInt(e.detail.value === NaN ? 0 : e.detail.value)
      })
      console.log(this.data.cashPledge)
    }
  },
  async awaitOrderResult(orderNum) {
    var RES = undefined;
    // 创建一个promise，该promise在3秒后resolve  
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve('timeout');
      }, 3000);
    });
    for (let index = 0; index < 50; index++) {
      // 使用Promise.race，哪个promise先resolve或reject，就处理哪个  
      await Promise.race([
        app.callFunction({
          name: 'inquirePayOrder',
          data: {
            out_trade_no: orderNum,
            sub_mch_id: appData.shopInfo.proceedsAccount,
            appid: 'wxad610929898d4371'
          }
        }),
        timeoutPromise
      ]).then(res => {
        // 如果callFunction的promise先resolve，那么就处理它的结果  
        console.log(res);
        if ('trade_state' in res) {
          if (res.trade_state === "SUCCESS") { //支付成功
            RES = true;
          }
        }
      }).catch(err => {
        // 如果timeoutPromise先resolve，那么就处理它的结果  
        console.log('Timeout or error:', err);
      });
      if (RES === true) {
        return true;
      }
      await app.delay(1000);
    }
    return false;
  },
  async waiterOpen(tableNum) { //服务员开台
    const now = new Date(); //下单时间种子
    const orderNum = app.createOrderNum(now, 'W'); //订单编号
    const price = await this.getNowPrice(this.data.optNum - 1); //获取现阶段价格
    var pledge = this.data.cashPledge;
    console.log({
      '此时段价:': price,
      '押金:': pledge
    })
    //支付押金 选择界面  现金or微信   微信则直接展示收款码
    if (pledge > 0 && this.data.payMode === '微信') { //押金模式 且支付方式 为微信
      const cardId = await wx.scanCode({
        onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
      });
      console.log('调用微信支付!:' + cardId.result)
      const payCode = await app.cardPay((pledge * 100).toString(), '开台押金', appData.shopInfo.proceedsAccount, orderNum, cardId.result, 'wxad610929898d4371')
      console.log({
        '调用结果:': payCode
      })
      if (payCode === undefined) { //支付返回错误
        app.showToast('支付失败!', 'error')
        return;
      }
      const payRes = await this.awaitOrderResult(orderNum);
      if (!payRes) { //支付失败
        app.showToast('支付失败!', 'error')
        return;
      }
    }
    //开台 开始
    const addOrderRes = await app.callFunction({
      name: 'userOpenTable',
      data: {
        pledge: pledge,
        pledgeMode: `${this.data.payMode === '微信' ? 'wx' :'cash'}`, // wx   cash mtCoupon dyCoupon cashCoupon 
        openPersonName: appData.status, //开台人 名字
        openPersonOpenid: appData.status, //开台人 openid
        orderNum: orderNum,
        orderName: '店员开台订单', //自助开台  店员开台
        price: price, //单价
        integral: 0,
        shopFlag: appData.shopInfo.shopFlag,
        tableNum: this.data.optNum, //桌台号码
        userOpenid: '店员'
      }
    })
    app.showLoading('加载中...', true)
    console.log({
      '下单结果': addOrderRes
    })
    var timeLong = pledge / price * 60; //订单总时长  单位分钟
    if (addOrderRes === 'ok') { //下单成功
      //判断是否是 押金模式  或非押金模式
      console.log(pledge)
      if (pledge > 0) { //押金模式
        //下达定时关灯
        lightRes = await app.callFunction({
          name: 'lightCtrl',
          data: {
            lightName: appData.device.lightCtrl,
            lightData: `{"A${(this.data.optNum).toString().padStart(2, '0') }":21${timeLong.toString().padStart(4,'0')},"res":"123"}`
          }
        })
        //判断开灯指令是否下发正确
        if (lightRes !== 'ok') { //下发指令失败
          wx.hideLoading();
          Dialog.alert({
            title: '提示',
            message: '指令下达失败!请点击开灯按钮!',
          }).then(() => {
            return;
          })
        } else {
          console.log('下单成功!');
        }
      } else { //非押金  定时 模式
        var lightRes = await app.callFunction({
          name: 'lightCtrl',
          data: {
            lightName: appData.device.lightCtrl,
            lightData: `{"A${(this.data.optNum).toString().padStart(2, '0') }":110000,"res":"123"}`
          }
        })
        app.showLoading('指令下发中...', true)
        //判断开灯指令是否下发正确
        if (lightRes !== 'ok') { //下发指令失败
          wx.hideLoading();
          Dialog.alert({
            title: '提示',
            message: '指令下达失败!请点击开灯按钮!',
          }).then(() => {
            return;
          })
        }
      }
      wx.hideLoading();
    } else {
      console.log('下单函数返回失败值!')
    }
  },
  async open(e) { //开台
    //判断此桌台年费是否已过期
    if (new Date().getTime() >= new Date(this.data.table_data[this.data.optNum - 1].useEndTime).getTime()) {
      app.showModal('提示', '此桌台已过期,请续费后使用!')
      return;
    }
    if (await app.power('operate', '1', '开台')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }
    //判断桌台是否绑定 计费规则 及 灯控器
    if (await app.haveLight() === false || this.data.table_data[this.data.optNum - 1].chargingFlag === '') { //没有绑定灯控器
      Dialog.alert({
        title: '提示',
        message: '请先设置桌台计费规则并且绑定灯控器后方可开台!',
      }).then(() => {})
      return;
    }
    if (this.data.closeOrOpen === '开台') { //不定时开台
      console.log('不定时开台!')
      this.setData({
        cashPledgeShow: true
      })
    } else { //关台
      this.closeTable(this.data.optNum)
    }
    //关闭点击桌台 选项
    this.setData({
      tableCtrlShow: false
    })
  },
  //押金输入界面
  onConfirm(e) {
    if (e.mark.item === 'cashPledge') {
      if (this.data.cashPledge > 0) { //需支付押金
        this.setData({
          payModeShow: true
        })
      } else {
        this.waiterOpen();
      }
    } else if (e.mark.item === 'payMode') { //支付押金方式选择界面
      //分析支付方式
      if (this.data.payMode === '现金') { //现金支付
        //现金支付 直接开台 收取方式为现金
        Dialog.alert({
          message: `请收取顾客现金${this.data.cashPledge}元`,
        }).then(() => {
          // on close
        });
        this.waiterOpen();
      } else if (this.data.payMode === '微信') { //微信支付
        this.waiterOpen();
      }
    }
  },
  async closeTable(tableNum) {
    console.log('结账')
    const now = new Date();
    const orderForm = this.data.tableOrder[tableNum - 1];
    //计算应返现金 后修改押金金额
    if (orderForm.orderName === '自助套餐订单') {
      orderForm.tableCost = orderForm.cashPledge;
    } else {
      orderForm.tableCost = app.computeTableCost(this.data.charging, appData.shopInfo.shop.tableSum[this.data.optNum - 1].chargingFlag, orderForm.price > 0 ? orderForm.price : this.getNowPrice(this.data.optNum - 1), orderForm.startTime, app.getNowTime(now)) //计算桌台费
    }
    //重新按结账时间 计算积分
    orderForm.integral = app.computeIntegral(this.data.integral, orderForm.tableCost, 0, 0)
    //此处判断是否为 非计时模式 非计时模式需要缴费
    if (orderForm.cashPledge === 0) { //计时模式 
      if (orderForm.tableCost > 0) { //且需要支付的金额大于0
        //显示选择支付方式选择界面
        var payMode = 'cash';
        try {
          await Dialog.confirm({
            title: '选择支付方式',
            message: `${orderForm.tableCost}元\n现金收取请直接收取\n微信支付需扫客人首付款码.`,
            confirmButtonText: '微信支付',
            cancelButtonText: '现金支付'
          });
          //点击确认键   微信支付
          payMode = 'wx'
          const cardId = await wx.scanCode({
            onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
          });
          console.log('调用微信支付!:' + cardId.result)
          const payCode = await app.cardPay((orderForm.tableCost * 100).toString(), `${orderForm.tableNum}号台台费`, appData.shopInfo.proceedsAccount, orderForm.orderNum, cardId.result, 'wxad610929898d4371')
          console.log({
            '调用结果:': payCode
          })
          if (payCode === undefined) { //支付返回错误
            app.showToast('支付失败!', 'error')
            return;
          }
          const payRes = await this.awaitOrderResult(orderForm.orderNum);
          if (!payRes) { //支付失败
            app.showToast('支付失败!', 'error')
            return;
          }
          orderForm.payMode = '微信';
          orderForm.pledgeMode = 'wx';

        } catch { //点击取消按钮  现金支付
          if (payMode === 'wx') { //判断是否为 微信支付模式 在扫描界面退出导致的 误进此选项
            return; //误进入
          }
          console.log('选择现金支付!');
          orderForm.payMode = '现金';
          orderForm.pledgeMode = 'cash';
        }
      }
      console.log('支付完成!')
    } else { //计时模式
      //修改支付方式
      orderForm.payMode = orderForm.pledgeMode === 'wx' ? '微信' : orderForm.pledgeMode === 'card' ? '会员卡' : orderForm.pledgeMode === 'mtCoupon' ? '美团券' : orderForm.pledgeMode === 'dyCoupon' ? '抖音券' : orderForm.pledgeMode === 'cash' ? '现金' : '代金券'
      //计算应退还金额
      if (orderForm.tableCost < orderForm.cashPledge && (orderForm.pledgeMode === 'cash' || orderForm.pledgeMode === 'wx')) { //需退还部分押金的情况 (仅返现金及微信模式  其他模式不返)
        try {
          await Dialog.confirm({
            title: '返还金额',
            message: `退还押金:${orderForm.cashPledge - orderForm.tableCost}元\n返还方式${orderForm.pledgeMode==='cash'?'现金':'微信'}\n现金模式请直接退给顾客现金`,
          })
          //点击确认
          if (orderForm.pledgeMode === 'wx') { //判断是否为 微信退还
            console.log('微信退还:' + (orderForm.cashPledge - orderForm.tableCost) + '元')
            const refundRes = await app.refund(orderForm.cashPledge * 100, (orderForm.cashPledge - orderForm.tableCost) * 100, orderForm.orderNum, `R${orderForm.orderNum}`, appData.shopInfo.proceedsAccount); //退还押金  
            console.log(refundRes)
            //应该此处 添加判断 是否返还成功!
          } else { //退还现金

          }
        } catch (error) {
          //点击取消
          return;
        }
      }
    }
    orderForm.endTime = app.getNowTime(now); //修改结账时间
    orderForm.log.push(`${app.getNowTime(now)}${appData.status}---结算`) //添加结算日志
    console.log(orderForm)
    //修改服务器订单数据  
    const res = await app.callFunction({
      name: 'closeTable',
      data: {
        shopFlag: appData.shopInfo.shopFlag,
        orderFormDate: app.getOrderFormDate(orderForm.orderNum),
        overOrderForm: orderForm
      }
    })
    console.log(res)
    //执行关灯指令
    await app.callFunction({
      name: 'lightCtrl',
      data: {
        lightName: appData.device.lightCtrl,
        lightData: `{"A${(this.data.optNum).toString().padStart(2, '0') }":100000},"res":"123"}`
      }
    })
    return;
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
    this.data.switchName === '重发关灯指令' ? io = 'off' : io = 'on';
    app.showLoading('指令发送中...', true)
    if (io === 'off') { //关灯
      const res = await app.callFunction({
        name: 'lightCtrl',
        data: {
          lightName: appData.device.lightCtrl,
          lightData: `{"A${this.data.optNum.toString().padStart(2, '0') }":100000,"res":"123"}`
        }
      })
    } else { //开灯  需要获取订单信息 判断延迟关灯时间
      const startTime = new Date(this.data.tableOrder[this.data.optNum - 1].startTime).getTime() / 1000; //开始时间截---秒
      const now = new Date().getTime() / 1000; //现在时间截--- 秒
      var timeLong = 0;
      if (this.data.tableOrder[this.data.optNum - 1].orderName === '自助套餐订单') { //套餐订单
        timeLong = this.data.tableOrder[this.data.optNum - 1].orderTotalTimeLong * 60 //订单总时长---秒
      } else {
        timeLong = this.data.tableOrder[this.data.optNum - 1].cashPledge / this.data.tableOrder[this.data.optNum - 1].price * 60 * 60 //订单总时长---秒
      }
      var surplusTime = timeLong - (parseInt(now) - parseInt(startTime)) //总时长  减去  已经过去的时间  = 剩余时间---秒
      if (surplusTime < 15) { //剩余时间多发于15秒开灯  否则不开灯
        return;
      }
      app.showLoading('指令下达...', true)
      //下达开灯定时关灯
      const lightRes = await app.callFunction({
        name: 'lightCtrl',
        data: {
          lightName: appData.device.lightCtrl,
          lightData: `{"A${(this.data.optNum).toString().padStart(2, '0') }":21${(parseInt(surplusTime/60)).toString().padStart(4,'0')},"res":"123"}`
        }
      })
      //判断开灯指令是否下发正确
      if (lightRes !== 'ok') { //下发指令失败
        wx.hideLoading();
        app.showToast('指令下达失败', 'error');
        return;
      }
      wx.hideLoading();
    }
    wx.hideLoading();
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
  async onShow() {
    console.log({
      'appShopInfo': appData.shopInfo.shopFlag,
      'thisShopInfo': this.data.shopInfo.shopFlag
    })
    //处理 订单 消息 
    appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate(), 'null', 'null')
    this.setData({
      [`menu_data[1].showRedDot`]: this.disposeMessage(appData.orderForm)
    })

    if (appData.shopInfo.shopFlag === this.data.shopInfo.shopFlag) { //没有切换店铺
      return;
    }
    this.setData({
      shopInfo: appData.shopInfo,
      ['options[0]']: this.getAttendanceState() === false ? '上班' : '下班' //获取打卡信息,
    })
    //获取本店计费规则  积分规则
    this.setData({
      charging: await app.callFunction({
        name: 'getDatabaseRecord_fg',
        data: {
          collection: 'charging',
          record: 'charging',
          shopFlag: appData.shopInfo.shopFlag
        }
      }),
      integral: await app.callFunction({
        name: 'getDatabaseRecord_fg',
        data: {
          collection: 'integral',
          record: 'integral',
          shopFlag: appData.shopInfo.shopFlag
        }
      }),
      operateSet: await this.getSweepSet()
    })
    console.log(this.data.options)
    //关闭以前的监听器
    await appData.watcher.close();
    await app.delay(1000)
    //开启监听本店桌台状态变化信息
    const that = this;
    console.log(appData.shopInfo.shopFlag)
    appData.watcher = db.collection('shopAccount').where({
      shopFlag: appData.shopInfo.shopFlag
    }).watch({
      onChange: function (snapshot) {
        console.log('snapshot:', snapshot);
        if (appData.shopInfo.shopFlag === snapshot.docChanges[0].doc.shopFlag) { //确保店铺没有被切换  数据对应没有错误
          appData.shopInfo = snapshot.docChanges[0].doc;
          that.refreshTableState();
        }
      },
      onError: function (err) {
        console.error('the watch closed because of error', err)
      }
    })
    console.log(appData.watcher);
    //
    await app.checkMerchantBalance(appData.shopInfo, this.data.operateSet)
    //定时修改 桌台 实时费用
    this.data.setIntervalId = setInterval(this.refreshTableState, 60000, false) //定时刷新
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  async onHide() {
    console.log('页面隐藏')
    //关闭以前的监听器
    clearInterval(this.data.setIntervalId)
    await appData.watcher.close();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('页面卸载!')

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    app.showLoading('数据加载中...', true);
    //获取店铺信息
    await app.getShopInfo(this.data.shopInfo.shopFlag);
    await this.refreshTableState()
    wx.hideLoading()
    wx.stopPullDownRefresh()
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
    return appData.globalShareInfo;
  }
})