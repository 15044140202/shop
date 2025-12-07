// pages/operate/operate.js
const app = getApp();
const appData = app.globalData;
const db = wx.cloud.database();
import Dialog from '@vant/weapp/dialog/dialog';
const { zxUtils, groupBuySelectShow, groupBugOpenTable, getTableGroupBuying, getTableGroupBuyInfo, reSelectOrderGroupBuy } = require('./groupBuyingOpenTable.js')
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
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
    groupBuyMakeName: '',
    closeOrOpen: '开台',

    sortColor: "red",
    message: [],
    //我的 相关 数据
    show: false,
    options: [
      '上班打卡', //考勤记录
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
    shop_table: appData.shop_table,
    tableState: [],
    shop_charging: [],
    shop_integral_set: {},
    shop_account: appData.shop_account,
    tableOrder: appData.tableOrder,

    totalOrder: [],
    todayOrders: []
  },
  //团购券开台
  async groupBuyingOpenTable(e) {
    console.log(e)
    await groupBugOpenTable(this, e.mark.GPOdata)

  },
  groupBuySelectShow(e) {
    groupBuySelectShow(this)
  },
  async tap(e) {
    console.log(e.mark.item)
    if (e.mark.item === 'cashPledge') { //设置押金金额
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
  async goto(e) {
    if (e.mark.path === './my/my') {
      wx.navigateTo({
        url: e.mark.path,
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
    if (appData.shop_account.shopInfo.telephone === "1" || appData.shop_account.shopInfo.telephone === undefined) { //认证手机号码
      this.setData({
        bindTelShow: true
      })
      return;
    }
    if (await app.power('systemSet', '桌台管理')) {
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
          //调用刷新桌台状态函数
          that.refreshTableState(that.data.shop_table);
          console.log({ '本页面桌台数据': that.data.shop_table })
          console.log({ 'appData桌台数据': appData.shop_table })
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.shop_table)
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
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const now = new Date()
    //获取本店计费规则  积分规则
    this.setData({
      shop_charging: appData.shop_charging,
      shop_integral_set: appData.shop_integral_set,
      shop_operate_set: appData.shop_operate_set,
      shop_group_buying: appData.shop_group_buying,
    })
    console.log(this.data.options)
    now.setHours(0,0,0,0)
    const startTimeStamp = now.getTime()
    now.setHours(23,59,59,999)
    const endTimeStamp = now.getTime()
    //获取今日订单
    this.setData({
      todayOrders: await app.getOrderData(startTimeStamp, endTimeStamp)
    })
    //处理消息  //用于处理今日结账未打扫的桌台 显示在消息按钮上面  后面修正
    this.setData({
      [`menu_data[1].showRedDot`]: this.disposeMessage(appData.orderForm)
    })
    //检查商户各种费用余额
    await app.checkMerchantBalance(appData.shop_table, appData.shop_account)
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
  async onReady() {

  },
  signalLamp(color) {
    this.setData({
      sortColor: color,
    })
  },
  async refreshTableState(shop_table = this.data.shop_table) {
    console.log(shop_table)
    const that = this
    //更新本地账单数据 以便消息 提示
    const NOW = new Date()
    NOW.setHours(0,0,0,0)
    const startTimeStamp = NOW.getTime()
    NOW.setHours(23,59,59,999)
    const endTimeStamp = NOW.getTime()
    appData.orderForm = await app.getOrderData(startTimeStamp,endTimeStamp, false)
    this.data.orderForm = appData.orderForm
    this.setData({
      [`menu_data[1].showRedDot`]: this.disposeMessage(appData.orderForm)
    })
    //刷新本地桌台数据 信号颜色变化 
    this.signalLamp('red')
    //同步数据
    that.data.shop_table = shop_table
    //循环解析桌台 订单信息
    for (let index = 0; index < this.data.shop_table.length; index++) {
      const theTable = this.data.shop_table[index];
      if (theTable.orderForm === '' || theTable.orderForm === 'sweep') {
        theTable.state = '空闲',
          theTable.tableCost = -1,
          theTable.icon = '../../icon/自选套餐.png'
      } else {
        if (theTable.orderForm.startsWith('S')) {
          theTable.state = '自助开台'
        } else {
          theTable.state = '店员开台'
        }
        //桌台订单
        theTable.order = await this.getTableOrder(theTable.orderForm)
        //桌台图标\
        theTable.icon = theTable.order.groupBuyType === 'mtCoupon' ? '../../icon/美团.png' : theTable.order.groupBuyType === 'dyCoupon' ? '../../icon/抖音.png' : theTable.order.groupBuyType === 'ksCoupon' ? '../../icon/快手.png' : '../../icon/自选套餐.png'
        //套餐是否以核验
        theTable.groupBuyInspection = theTable.order.groupBuyInspection === false ? false : true
        // 已消费金额
        if (theTable.order) {
          theTable.tableCost = theTable.order.orderName === '自助套餐订单' ? theTable.order.cashPledge : app.computeTableCost(this.data.shop_charging, theTable.chargingId, theTable.order.price, theTable.order.time, new Date())
        }
        // 桌台结束时间
        theTable.endTime = theTable.closeTableTime ? app.getNowTime(new Date(theTable.closeTableTime), 'hms') : '支付中...'
        // 桌台结束时间颜色
        if (theTable.endTime === '支付中...') {
          theTable.endTimeColor = "#fff"
        } else {
          const lastTime = theTable.closeTableTime - new Date().getTime()
          theTable.endTimeColor = lastTime > 10 * 60 * 1000 ? '#fff' : lastTime > 5 * 60 * 1000 ? 'yellow' : 'red'
        }
      }
    }
    //设置本地变量 信号颜色变化  及刷新桌台信息
    this.signalLamp('green')
    this.setData({
      shop_table: this.data.shop_table
    })
  },
  async getTableOrder(orderFormNum) {
    const todayOrderForm = this.data.orderForm;
    //匹配今日订单数据
    let thisOrder = todayOrderForm.find(item => item.orderNum === orderFormNum)
    //判断今日订单数据  是否匹配到
    if (!thisOrder) { //没有匹配到
      //服务器里搜索该订单数据
      const res = await app.getOrderInfo('table_order', orderFormNum)
      if (!res.success) {
        app.showModal('提示', '获取指定订单错误!')
        console.log(res)
        return
      }
      thisOrder = res.data; //寻找到订单
    }
    return thisOrder
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
    console.log(p)
    this.setData({
      optNum: p.mark.tableMark + 1,
      optPrice: this.getNowPrice(p.mark.tableMark),
      tableCtrlShow: true,
      groupBuyMakeName: this.data.shop_table[p.mark.tableMark]?.groupBuyInspection ? '重核选顾客的团购套餐' : '团购券核销',
      closeOrOpen: this.data.shop_table[p.mark.tableMark].orderForm === '' ? '开台' : '结账'
    })

  },
  tableLongPress(p) {
    const thisTable = this.data.shop_table[p.mark.tableMark]
    if (thisTable.orderForm) {//判断是否是空台
      app.showModal('提示', '这不是空台,无法操作!')
      return
    }
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
    if (!this.data.shop_operate_set.sweepSet.sweep) { //允许打扫开灯
      app.showToast('设置禁用!', 'error')
      return;
    }
    const clostTableTime = new Date().getTime() + this.data.shop_operate_set.sweepSet.sweepTime * 60 * 1000
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_table',
        query: {
          shopId: appData.shop_account._id,
          tableNum: this.data.optNum
        },
        upData: {
          ONOFF: 1,
          orderForm: 'sweep',
          closeTableTime: clostTableTime,
        }
      }
    })
    await app.lightCtrl(this.data.optNum, '1', app.getMemberName() + "(打扫开灯)")
    console.log(res)
    wx.hideLoading()
    this.longPressClose() //关闭菜单
    return;
  },
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  //获取桌台选择的计费规则选项下标
  getChargingSelect(tableChargingId, chaging) {
    return chaging.findIndex(item => item._id === tableChargingId)
  },
  /**
   * @description 获取现在 的价格
   * @param {*} tableNum 
   */
  getNowPrice(tableNum) {
    //判断tableChargingFlag  是否为未选择,  如果为未选择  不允许开台
    if (this.data.shop_table[tableNum].chargingId === '') {
      return -1;
    }
    const chargingSeletc = this.getChargingSelect(this.data.shop_table[tableNum].chargingId, this.data.shop_charging)
    if (chargingSeletc === -1) return -1 //绑定的计费规则不存在
    const charging = this.data.shop_charging[chargingSeletc]
    //判断时间是否只有一个    只有一个的话 为全天一个价格!
    if (charging.timeSegment.length === 1) { //返回第一个时间段的价格
      return charging.timeSegment[0].price;
    }
    //多个时间段 判断现在处于哪个时间段区间
    // 1. 获取先时间值
    const now = new Date();
    const time = app.getNowTime(now)
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
    console.log(e)
    if (e.mark.item === 'pledge') { //设置押金金额
      this.setData({
        cashPledge: parseInt(e.detail.value ? e.detail.value : 0)
      })
      console.log(this.data.cashPledge)
    }
  },
  async awaitOrderResult(orderNum) {
    for (let index = 0; index < 50; index++) {
      // 使用Promise.race，哪个promise先resolve或reject，就处理哪个  
      try {
        const res = await app.payOrderQuery(orderNum, appData.shop_account.proceedAccount)
        console.log(res)
        if (res.success && 'trade_state' in res.data) {
          if (res.data.trade_state === "SUCCESS") { //支付成功
            return true;
          }
        }
        //这里要加 取消支付的情况处理
      } catch (e) {
        console.log('orderQuery catch ', e);
      }
      await app.delay(2000);
    }
    return false;
  },
  async sanCodePay(pledge, orderNum) {
    let cardId
    try {
      cardId = await wx.scanCode({
        onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
      });
    } catch (e) {
      console.log('支付 error:' + e)
      return false
    }
    console.log('调用微信支付!:' + cardId.result)
    let payCode
    try {
      payCode = await app.cardPay((pledge * 100).toString(), '开台押金', appData.shop_account.proceedAccount, orderNum, cardId.result, 'wxad610929898d4371')
      if (!payCode.success && payCode.data.err_code_des !== '需要用户输入支付密码') { //支付返回错误
        await app.payErrCodeMsg(payCode.data)
        //支付错误撤销订单
        return false
      }
    } catch (e) {
      console.log('支付ERROR:' + e)
    }
    console.log('查询支付结果')
    if (await this.awaitOrderResult(orderNum)) {
      console.log('支付成功!')
      return true
    }
  },
  async waiterOpen(tableNum) { //服务员开台
    const now = new Date(); //下单时间种子
    const orderNum = app.createOrderNum(now, 'W'); //订单编号
    const price = await this.getNowPrice(this.data.optNum - 1); //获取现阶段价格
    var pledge = this.data.cashPledge;
    const pledgeState = pledge === 0 || this.data.payMode === '现金' ? 1 : 0 //后付款模式默认 为付款成功
    console.log({
      '此时段价:': price,
      '押金:': pledge
    })
    //先下单  再检测支付结果  再开台
    const placeOrderRes = await this.placeOrder({
      cashPledge: pledge,
      commotidyCost: 0,
      endTime: '未结账',
      integral: 0,
      joinCost: 0,
      log: [`${app.getNowTime(now)}---开台.押金${pledge}元`],
      orderName: '店员开台订单', //自助开台  店员开台
      orderNum: orderNum,
      payMode: '未结账',
      pledgeMode: `${this.data.payMode === '微信' ? 'wx' : 'cash'}`, // wx   cash mtCoupon dyCoupon cashCoupon 
      pledgeState: pledgeState,
      price: price, //单价
      shopId: appData.shop_account._id,
      tableCost: 0,
      tableNum: tableNum, //桌台号码
      time: now.getTime(),
      userName: appData.status, //开台人 名字
      userOpenid: appData.merchant_info._openid//开台人 openid
    })
    if (!placeOrderRes.success) {//下单失败
      app.showModal('提示', '下单失败!')
      return
    }
    //支付押金 选择界面  现金or微信   微信则直接展示收款码
    if (pledge > 0) { //押金模式
      if (this.data.payMode === '微信') {//押金模式 且支付方式 为微信
        const payRes = await this.sanCodePay(pledge, orderNum)
        if (!payRes) { //支付失败
          app.showToast('支付失败!', 'error')
          await app.repealOrder(orderNum, tableNum, appData.shop_account._id,appData.shop_account.proceedAccount)
          return;
        }
        console.log('支付成功!')
        //执行支付完成 函数
        const paymentDoneRes = await app.paymentDone(orderNum, appData.shop_account._id, tableNum, await app.getTableVersion(tableNum))
        if (!paymentDoneRes.success) {
          app.showModal('提示', '处理付款成功失败!')
          return
        }
      } else {//现金付款模式
        app.showModal('提示', `开台成功!请收取押金:${pledge}元`)
      }
    } else {//后付款模式
      app.showModal('提示', `后结账模式,请关台时收取台费!`)
    } 
    app.lightCtrl(tableNum, '1',app.getMemberName() + '(店员开台)').then(res => {
      app.showToast('开台成功!')
    }) 
  },
  /**
   * 异步函数 placeOrder 用于处理下单操作
   * @param {Object} orderOBJ - 包含订单相关信息的对象
   * @returns {Promise<string>} 返回开台人的 openid
   * 该函数会创建一个订单记录，包括押金、消费成本、积分、订单名称、订单号等信息，
   * 并将其添加到 'table_order' 集合中。同时记录开台的日志信息。
   */
  async placeOrder(orderOBJ) {
    const tableVersion = await app.getTableVersion(orderOBJ.tableNum)
    if (tableVersion === -1) {
      return
    }
    //开台 开始
    const addOrderRes = await app.callFunction({
      name: 'place_order_table',
      data: {
        order: orderOBJ,
        tableVersion: tableVersion
      }
    })
    console.log({
      '下单结果': addOrderRes
    })
    return addOrderRes
  },
  async open(e) { //开台
    //判断此桌台年费是否已过期
    if (new Date().getTime() >= new Date(this.data.shop_table[this.data.optNum - 1].useEndTime).getTime()) {
      app.showModal('提示', '此桌台已过期,请续费后使用!')
      return;
    }
    if (await app.power('operate', '开台')) {
      console.log('有权限');
    } else {
      app.showToast('没有权限', 'error');
      return;
    }
    //判断桌台是否绑定 计费规则 及 灯控器
    if (await app.haveLight() === false || this.data.shop_table[this.data.optNum - 1].chargingId === '') { //没有绑定灯控器
      app.showModal('提示', '请先设置桌台计费规则并且绑定灯控器后方可开台!')
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
        this.waiterOpen(this.data.optNum);
      }
    } else if (e.mark.item === 'payMode') { //支付押金方式选择界面
      //分析支付方式
      if (this.data.payMode === '现金') { //现金支付
        this.waiterOpen(this.data.optNum);
      } else if (this.data.payMode === '微信') { //微信支付
        this.waiterOpen(this.data.optNum);
      }
    }
  },
  async closeTableMessage(order) {
    let message = ''
    if (order.pledgeMode === 'card') {
      message = `扣除会员卡:${order.tableCost}元.`
    } else if (order.refundCost) {
      message = `退还押金:${order.refundCost}元\n\n返还方式: 微信原路返回`
    } else if (['cash', '现金'].includes(order.pledgeMode) && order.cashPledge > order.tableCost) {
      message = `退还押金: ${order.cashPledge - order.tableCost}元\n\n返还方式: 现金\n\n现金模式请直接退给顾客现金`
    } else {
      return true
    }
    return await app.DialogConfirm({
      Dialog,
      title: '结账详情',
      message: message,
      messageAlign: 'left'
    })
  },
  async getThisTableOrder(orderNum) {
    let order = this.data.orderForm.find(item => item.orderNum === orderNum)
    if (!order) {//今日订单里面没有数据 查找订单
      const res = await app.callFunction({
        name: 'getData_where',
        data: {
          collection: 'table_order',
          query: {
            orderNum: orderNum
          }
        }
      })
      console.log(res)
      if (res.data.length > 0) {
        order = res.data[0]
      }
    }
    if (!order) {
      throw '没有找到桌台对应订单--- ERROR'
    }
    return order
  },
  async closeTable(tableNum) {
    if (!app.power('operate', '结账')) {
      app.noPowerMessage()
      return
    }
    //结账前 先刷新桌台信息  防止桌台信息没有及时刷新 导致的数据错误
    await this.onPullDownRefresh()
    console.log('结账')
    const now = new Date();
    const orderForm = await this.getThisTableOrder(this.data.shop_table[this.data.optNum - 1].orderForm);
    //计算应返现金 后修改押金金额
    if (orderForm.orderName === '自助套餐订单') {
      orderForm.tableCost = orderForm.cashPledge;
    } else {
      orderForm.tableCost = app.computeTableCost(this.data.shop_charging, this.data.shop_table[this.data.optNum - 1].chargingId, orderForm.price > 0 ? orderForm.price : this.getNowPrice(this.data.optNum - 1), orderForm.time, app.getNowTime(now)) //计算桌台费
    }
    //重新按结账时间 计算积分
    orderForm.integral = app.computeIntegral(this.data.shop_integral_set, orderForm.tableCost, 0, 0)
    //此处判断是否为 非计时模式 非计时模式需要缴费
    if (orderForm.cashPledge === 0) { //计时模式 
      if (orderForm.tableCost > 0) { //且需要支付的金额大于0
        //显示选择支付方式选择界面
        const res = await  wx.showActionSheet({
          itemList: ['微信支付', '现金支付'],
        })
        if (res.tapIndex === 1) { //现金支付
          console.log('选择现金支付!');
          orderForm.payMode = '现金';
          orderForm.pledgeMode = 'cash';
        } else if(res.tapIndex === 0) {//微信支付
          const cardId = await wx.scanCode({
            onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
          });
          //生成一个随机支付订单
          const payOrder = orderForm.orderNum + app.getRandomString(6)
          const payCode = await app.cardPay((orderForm.tableCost * 100).toString(), `${orderForm.tableNum}号台台费`, appData.shop_account.proceedAccount, payOrder, cardId.result, 'wxad610929898d4371')
          console.log(payCode)
          if (!payCode.success && !['需要用户输入支付密码', ''].includes(payCode.data.err_code_des)) { //支付返回错误
            await app.payErrCodeMsg(payCode.data)
            wx.hideLoading()
            return;
          }
          const payRes = await this.awaitOrderResult(payOrder);
          if (!payRes) { //支付失败
            app.showToast('支付失败!', 'error')
            return;
          }
          orderForm.payOrder = payOrder
          orderForm.payMode = '微信';
          orderForm.pledgeMode = 'wx';
        }
      } else {//订单金额为0  默认为现金模式
        orderForm.payMode = '现金'
      }
      console.log('支付完成!')
    } else { //计时模式
      //修改支付方式
      orderForm.payMode = orderForm.pledgeMode === 'wx' ? '微信' : orderForm.pledgeMode === 'card' ? '会员卡' : orderForm.pledgeMode === 'mtCoupon' ? '美团券' : orderForm.pledgeMode === 'dyCoupon' ? '抖音券' : orderForm.pledgeMode === 'cash' ? '现金' : '代金券'
      //计算应退还金额
      if (orderForm.tableCost < orderForm.cashPledge && (orderForm.pledgeMode === 'cash' || orderForm.pledgeMode === 'wx')) { //需退还部分押金的情况 (仅返现金及微信模式  其他模式不返)
        if (orderForm.pledgeMode === 'wx') { //判断是否为 微信退还
          console.log('微信退还:' + (orderForm.cashPledge - orderForm.tableCost) + '元')
          orderForm.refundOrder = `R_${app.getRandomString(5)}_${orderForm.orderNum}`
          orderForm.refundCost = orderForm.cashPledge - orderForm.tableCost
        }
      }
    }
    orderForm.endTime = app.getNowTime(now); //修改结账时间
    orderForm.log.push(`${app.getNowTime(now)}${appData.status}---结算`) //添加结算日志
    console.log(orderForm)
    if (!await this.closeTableMessage(orderForm)) {
      return
    }
    const tableVersion = await app.getTableVersion(orderForm.tableNum)
    if (tableVersion === -1) {
      return
    }
    //修改服务器订单数据  
    delete orderForm._id
    const res = await app.callFunction({
      name: 'close_table',
      data: {
        overOrderForm: orderForm,
        tableVersion: tableVersion,
        sub_mchid: appData.shop_account.proceedAccount
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '关台失败!')
      return
    }
    //执行关灯指令
    await app.lightCtrl(this.data.optNum, '0',app.getMemberName() + '(店员结账)')
    return;
  },
  async couponInspection(e) {
    console.log(e)
    if (e.mark.item === 'gbSelect') {
      await reSelectOrderGroupBuy(this, e.mark.thisTbaleGP)
      this.setData({
        GPSshow: false
      })
    } else if (e.mark.item === 'gbs') {//选择团购套餐类型
      this.setData({
        couponCodeShow: false,
        GPSshow: true
      })
    } else { //显示团购券号码
      //提醒用户订阅消息
      const res = await wx.requestSubscribeMessage({
        tmplIds: ['EWkxfbkyuC9n7LmrxPdafgM0aFVfw38Sl4NmCOwO2kg']
      })
      console.log(res)
      const thisTable = this.data.shop_table[this.data.optNum - 1]
      //空台无需核验
      if (!thisTable.orderForm) {
        this.tableCtrlClose() //关闭菜单
        return
      }
      const thisTableOrder = this.data.orderForm.find(item => item.orderNum === thisTable.orderForm)
      //判断是否是团购券开的台
      if (!thisTableOrder?.groupBuyType) {
        app.showModal('提示', '此桌台不是团购券开台桌台,无法核验!')
        this.tableCtrlClose() //关闭菜单
        return
      }
      const gbInfo = getTableGroupBuyInfo(this)
      const thisTbaleGP = getTableGroupBuying(this, gbInfo)
      console.log(gbInfo, thisTbaleGP)
      this.setData({
        gbInfo: gbInfo,
        thisTbaleGP: thisTbaleGP,
        couponCodeShow: true
      })
    }
    this.tableCtrlClose() //关闭菜单
  },
  async tapTableInfo() {
    if (await app.power('systemSet', '桌台管理')) {
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
    //处理 订单 消息 
    if (appData.shop_account._id !== this.data.shop_account._id) { //有切换店铺
      this.setData({
        shop_table: appData.shop_table,
        shop_account: appData.shop_account,
        shop_charging: appData.shop_charging,
        shop_integral_set: appData.shop_integral_set,
        shop_operate_set: appData.shop_operate_set,
        shop_group_buying: appData.shop_group_buying,
      })
    }
    await this.onPullDownRefresh()
    console.log(this.data.options)
    //开启监听本店桌台订单
    const that = this;
    appData.watcher = db.collection('shop_table').where({
      shopId: appData.shop_account._id
    }).watch({
      onChange: function (snapshot) {
        console.log('snapshot:', snapshot);
        if (snapshot.docChanges.length && appData.shop_account._id === snapshot.docChanges[0].doc.shopId) { //确保店铺没有被切换  数据对应没有错误
          for (let index = 0; index < appData.shop_table.length; index++) {
            const element = appData.shop_table[index];
            if (element._id === snapshot.docChanges[0].doc._id) {
              Object.assign(appData.shop_table[index], snapshot.docChanges[0].doc)
              break
            }
          }
          that.shop_table = appData.shop_table
          that.refreshTableState(snapshot.docs);
          return
        }
        that.refreshTableState(snapshot.docs);
      },
      onError: function (err) {
        console.error('the watch closed because of error', err)
      }
    })
    console.log(appData.watcher);
    //定时修改 桌台 实时费用
    this.data.setIntervalId = setInterval(() => {
      console.log('定时刷新任务!')
      that.refreshTableState(that.data.shop_table)
    }, 60000) //定时刷新
  },
  //获取今天和昨天的所有订单
  async getOrder_TodayAndYesterday() {
    const today = new Date()
    today.setHours(0,0,0,0)
    const startTimeStamp = today.getTime()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    yesterday.setHours(23,59,59,999)
    const endTimeStamp = yesterday.getTime()
    const totalOrder = await app.getOrderData(startTimeStamp, endTimeStamp)
    this.data.totalOrder = totalOrder
    return totalOrder
  },
  copyCode(e) {
    console.log(e)
    const code = zxUtils.extractNumbers(e.mark.copyInfo)
    console.log(code)
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '已复制' })
    })
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
    //获取店铺桌台信息
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_table',
        query: {
          shopId: appData.shop_account._id
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取桌台信息失败!')
      return
    }
    appData.shop_table = res.data
    this.data.shop_table = res.data
    await this.refreshTableState(this.data.shop_table)
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