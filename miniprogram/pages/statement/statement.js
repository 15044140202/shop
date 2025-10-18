// pages/satement/statement.js
const app = getApp()
const appData = app.globalData;
const nowTime = app.getNowTime(undefined, '年月日')

function TOFIXED2(num) {
  return Math.round(num * 100) / 100
}
function getWxPayTotalSum(order) {
  if (order.payMode.includes('wx') || order.payMode.includes('微信')) {
    if (order.orderName === '储值单') { //充值单
      return order.amount
    } else if ((order.orderName === '店员开台订单' || order.orderName === '自助开台订单' || order.orderName === '自助套餐订单')) {
      if (order.cashCoupon) {
        return TOFIXED2(order.tableCost - order.cashCoupon);
      } else {
        return TOFIXED2(order.tableCost);
      }
    } else if (order.orderName === '商品单') {
      return TOFIXED2(element.commotidyCost);
    } else if (order.orderName === '精彩秀单') {
      return TOFIXED2(order.amount);
    } else if (order.orderName === '杆柜租赁') {
      return TOFIXED2(order.amount);
    }
    return 0
  } else {
    return 0
  }
}
/**
 * @description 获取未结账单总数量
 * @param {array} orders 
 */
function countUnclosedOrders(orders) {
  return orders.filter(order =>
    ['店员开台订单', '自助开台订单', '自助套餐订单', '美团套餐订单', '抖音套餐订单', '快手套餐订单'].includes(order.orderName) &&
    ['未结账'].includes(order?.endTime || '') &&
    order.pledgeState === 1
  ).length
}
const orderAmountName = {
  快手套餐订单: 'tableCost',
  抖音套餐订单: 'tableCost',
  美团套餐订单: 'tableCost',
  自助套餐订单: 'tableCost',
  自助开台订单: 'tableCost',
  店员开台订单: 'tableCost',
  储值单: 'amount',
  杆柜租赁: 'amount',
  精彩秀单: 'amount',
  商品单: 'commotidyCost',
  助教订单: 'amount'
}
const orderNameOfType = {
  桌台费: ['店员开台订单', '自助开台订单', '自助套餐订单', '美团套餐订单', '抖音套餐订单', '快手套餐订单'],
  商品费: ['商品单'],
  会员储值: ['储值单'],
  优惠券销售: ['代金券销售单'],
  精彩秀: ['精彩秀单'],
  助教订单: ['助教订单']
}
// ================== 支付统计工具函数 ================== 
const paymentHandlers = {
  现金: {
    handler: o => {
      if (['现金', 'cash'].includes(o.payMode)) {
        return o[`${orderAmountName[o.orderName]}`]
      }
      return 0
    }
  },
  微信: {
    handler: o => {
      if (['微信', '微信&代金券', 'wx', 'wx&cashCoupon'].includes(o.payMode) && (o.pledgeState === 1 || !('pledgeState' in o))) {
        if (o.tableCost > o.cashPledge && o.couponAmount == 0) {
          console.log(o)
        }
        // console.log("付款时间:"+app.getNowTime(new Date(o.time),'hms')+'押金:'+o.cashPledge+'台费:'+o.tableCost)
        if (o?.couponAmount) {
          return Math.max(
            (o[orderAmountName[o.orderName]] || 0) - (Number(o.couponAmount) || 0),
            0
          );
        }
        return (o[orderAmountName[o.orderName]] || 0)
      }
      //console.log(o)
      return 0
    }
  },
  会员卡: {
    handler: o => {
      if (['会员卡', 'card'].includes(o.payMode) && o.pledgeState === 1) {
        if (o?.couponAmount) {
          return o[`${orderAmountName[o.orderName]}`] - o.couponAmount
        }
        return o[`${orderAmountName[o.orderName]}`]
      }
      return 0
    }
  },
  代金券: {
    handler: o => {
      if (o.pledgeState === 1) {
        return o?.couponAmount || 0
      }
      return 0
    }
  },
  美团券: {
    handler: o => {
      return ['美团券', 'mtCoupon'].includes(o.pledgeMode) ? o.tableCost : 0
    }
  },
  抖音券: {
    handler: o => {
      return ['抖音券', 'dyCoupon'].includes(o.pledgeMode) ? o.tableCost : 0
    }
  },
  快手券: {
    handler: o => {
      return ['快手券', 'ksCoupon'].includes(o.pledgeMode) ? o.tableCost : 0
    }
  },
  微信退款: {
    handler: o => {
      if (['wx', '微信', '微信&代金券', 'wx&cashCoupon'].includes(o.payMode) && Array.isArray(o?.log)) {
        return o.log.reduce((acc, item) => {
          const textChunk = String(item).split('---')?.[1] || ''
          if (textChunk.includes('退款') && (o.tableCost > 0 || o.amount > 0)) {
            const amountMatch = textChunk.match(/-?\d+(\.\d+)?/)   // 支持负数及小数 
            return acc + (Number(amountMatch?.[0]) || 0)
          }
          return acc;
        }, 0);
      }
      return 0; // 明确默认返回值 
    }
  }
}
//=============判断是否是已结账单==========
function isSettledOrder(order) {
  if (order.orderName === '商品单' && order.payState !== 1) {
    return false
  } else if (order.payMode !== '未支付' && order.endTime !== '未结账' && order.payState !== 0) {
    return true
  }
  return false
}
/**
 * @description 计算各种支付方式 总金额
 * @param {array} orders 
 * @param {string} paymentType 
 */
function sumByPayment(orders, paymentType) {
  const config = paymentHandlers[paymentType]
  if (!config?.handler) return 0
  return TOFIXED2(orders.reduce((sum, order) => {
    if (isSettledOrder(order)) {
      if (order.orderName === '助教订单') {
        sum += (config.handler(order) / 100)
      } else {
        sum += config.handler(order)
      }

    }
    return sum
  }, 0))
}
/**
 * @description 获取已结账单总数量
 * @param {array} orders 
 */
function countClosedOrders(orders) {
  return orders.filter(order =>
    ['店员开台订单', '自助开台订单', '自助套餐订单', '美团套餐订单', '抖音套餐订单', '快手套餐订单'].includes(order.orderName) &&
    !['未结账'].includes(order?.endTime || '') &&
    order.pledgeState === 1
  ).length
}
function getTotalAmount(orders) {
  return orders.reduce((acc, item) => {
    if (item.endTime !== '未结账' && item.payMode !== '未支付' && item?.payState !== 0) {
      if (item.orderName === '商品单') {
        if (item.payState === 1) {
          acc += item[orderAmountName[item.orderName]]
        }
      } else if (item.orderName === '助教订单') {
        acc += item[orderAmountName[item.orderName]] / 100
      } else {
        acc += item[orderAmountName[item.orderName]]
      }
    }
    return TOFIXED2(acc)
  }, 0)
}
function sumByOrderType(orders, type) {
  return orders.reduce((acc, item) => {
    if (orderNameOfType[type].includes(item.orderName) && isSettledOrder(item)) {
      if (item.orderName === '助教订单') {
        acc += item[orderAmountName[item.orderName]] / 100
      } else {
        acc += item[orderAmountName[item.orderName]]
      }
    }
    return TOFIXED2(acc)
  }, 0)
}
function getOrderSum(item, orderForm) {
  switch (item) {
    case '已结单据':
      return countClosedOrders(orderForm)
    case '未结单据':
      return countUnclosedOrders(orderForm)
    case 'total':
      return getTotalAmount(orderForm)
    case '现金':
      return sumByPayment(orderForm, '现金')
    case '微信':
      return sumByPayment(orderForm, '微信')
    case '会员卡':
      return sumByPayment(orderForm, '会员卡')
    case '代金券':
      return sumByPayment(orderForm, '代金券')
    case '美团券':
      return sumByPayment(orderForm, '美团券')
    case '抖音券':
      return sumByPayment(orderForm, '抖音券')
    case '快手券':
      return sumByPayment(orderForm, '快手券')
    case '桌台费':
      return sumByOrderType(orderForm, '桌台费')
    case '商品费':
      return sumByOrderType(orderForm, '商品费')
    case '会员储值':
      return sumByOrderType(orderForm, '会员储值')
    case '优惠券销售':
      return sumByOrderType(orderForm, '优惠券销售')
    case '助教订单':
      return sumByOrderType(orderForm, '助教订单')
    case '精彩秀单':
      return sumByOrderType(orderForm, '精彩秀')
    case '微信退款明细':
      return sumByPayment(orderForm, '微信退款')
  }
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appGlobalData: appData,
    disPlayDate: nowTime,
    nowDate: nowTime,
    disPlayOrderForm: [],

    disPlayStartDateObj:new Date().getTime(),
    disPlayEndDateObj:new Date().getTime(),
    disPlayDateObj:new Date(),
    nowDateObj:new Date(),

    merchant_info: appData.merchant_info,
    shopName_seletNum: appData.shopSelect,

    AccountsTotal: 0,
    cash_data: [],
    card_data: [],
    item_data: [],
    sattement_data: [],
    warn_data: [],
    debt_data: [],
    purchaseData: [],
    purchaseTotalSum: 0,
    giftCouponSum: 0,

    data_card: true,

    memberAttendance: []
  },
  getDateObj(ymd) {
    if (ymd.length < 10) { //判断参数是否为日期
      return new Date();
    }
    const dateStr = ymd + ' 12:00:00';
    const dateParts = dateStr.match(/(\d+)年(\d+)月(\d+)日 (\d+):(\d+):(\d+)/);
    if (dateParts) {
      const year = parseInt(dateParts[1]);
      const month = parseInt(dateParts[2]) - 1; // 月份从0开始  
      const day = parseInt(dateParts[3]);
      const hour = parseInt(dateParts[4]);
      const minute = parseInt(dateParts[5]);
      const second = parseInt(dateParts[6]);
      const date = new Date(year, month, day, hour, minute, second);
      return date;
    } else {
      console.log('Invalid date string');
      return 'error';
    }
  },
  async getOneMonthData(month) {
    console.log(month)
    console.log('当前显示:' + this.data.disPlayDate)
    this.setData({
      disPlayDate: month
    })
    console.log('月份查询:' + this.data.disPlayDate)
    const dateObj = this.getDatesOfMonth(month.split('-')[0], month.split('-')[1])
    console.log(dateObj)
    const startTimeStamp = new Date(dateObj[0] + ' 00:00:00').getTime()
    const endTimeStamp = new Date(dateObj[1] + " 23:59:59").getTime()
    //刷新当前显示日期的数据
    const res = await app.getOrderData(startTimeStamp, endTimeStamp)
    appData.disPlayOrderForm = res
    this.setData({
      disPlayOrderForm: res
    })
    this.dataLoad(this.data.disPlayOrderForm)
    //获取其他数据
    this.getOtherData(startTimeStamp,endTimeStamp)
    return res[1]
  },
  // 定义一个函数来获取指定年月的所有日期  
  getDatesOfMonth(year, month) {
    // 计算该月的天数  
    let daysInMonth = new Date(year, month, 0).getDate();
    console.log('该月有' + daysInMonth + '天')
    const monthStart = app.getNowTime(new Date(year, month - 1, 1)).substring(0, 10)
    const monthEnd = app.getNowTime(new Date(year, month - 1, daysInMonth)).substring(0, 10)
    return [monthStart, monthEnd];
  },
  async tap(e) {
    console.log(e.mark);
    if (e.mark.item === 'left') { //前一天
      console.log('当前显示:' + this.data.disPlayDate)
      const date = this.getDateObj(this.data.disPlayDate);
      date.setDate(date.getDate() - 1)
      this.setData({
        disPlayDate: app.getNowTime(date, '年月日')
      })
      console.log('上一天:' + this.data.disPlayDate)
      const {startTimeStamp , endTimeStamp} = app.getTimeLowOrHi(date)
      //刷新当前显示日期的数据
      const res = await app.getOrderData(startTimeStamp, endTimeStamp)
      this.setData({
        disPlayOrderForm: res
      })
      this.dataLoad(this.data.disPlayOrderForm)
      //获取其他数据
      this.getOtherData(startTimeStamp, endTimeStamp)
    } else if (e.mark.item === 'right') { //后一天
      //把现在日期  和 当前显示日期转换成整数 用于对比
      const nowDateNum = parseInt(this.data.nowDate.match(/\d+/g)[0] + this.data.nowDate.match(/\d+/g)[1] + this.data.nowDate.match(/\d+/g)[2]);
      console.log(nowDateNum)
      const disPlayDateNum = parseInt(this.data.disPlayDate.match(/\d+/g)[0] + this.data.disPlayDate.match(/\d+/g)[1] + this.data.disPlayDate.match(/\d+/g)[2])
      //判断 当前显示日期 是否小于 当日日期
      if (nowDateNum > disPlayDateNum) { //可以加载下一天
        console.log('当前显示:' + this.data.disPlayDate)
        const date = this.getDateObj(this.data.disPlayDate);
        date.setDate(date.getDate() + 1)
        this.setData({
          disPlayDate: app.getNowTime(date, '年月日')
        })
        appData.disPlayDate = this.data.disPlayDate
        console.log('下一天:' + this.data.disPlayDate)
        const {startTimeStamp , endTimeStamp} = app.getTimeLowOrHi(date)
        //刷新当前显示日期的数据
        const res = await app.getOrderData(startTimeStamp, endTimeStamp)
        this.setData({
          disPlayOrderForm: res
        })
        this.dataLoad(this.data.disPlayOrderForm)
        //获取其他数据
        this.getOtherData(startTimeStamp, endTimeStamp)
      } else {
        console.log('已经是今天!无法加载明日未发生的数据!')
      }
    } else if (e.mark.item === 'data_card_change') {//切换data_card 显示种类
      this.setData({
        data_card: this.data.data_card ? false : true
      })
    }
  },
  async dataLoad(orderForm) {
    console.log(`运行处理${orderForm.length}条数据!`)
    const cash_sum = await app.power('statement', '按收款方式查询') ? getOrderSum('现金', orderForm) : '***';
    const wx_sum = await app.power('statement', '按收款方式查询') ? getOrderSum('微信', orderForm) : '***';
    const card_sum = await app.power('statement', '按收款方式查询') ? getOrderSum('会员卡', orderForm) : '***';
    const cash_coupon = await app.power('statement', '按收款方式查询') ? getOrderSum('代金券', orderForm) : '***';
    const mt_coupon = await app.power('statement', '按收款方式查询') ? getOrderSum('美团券', orderForm) : '***';
    const dy_coupon = await app.power('statement', '按收款方式查询') ? getOrderSum('抖音券', orderForm) : '***';
    const ks_coupon = await app.power('statement', '按收款方式查询') ? getOrderSum('快手券', orderForm) : '***';
    const tableCost = await app.power('statement', '按收入项目查询') ? getOrderSum('桌台费', orderForm) : '***';
    const commotidyCost = await app.power('statement', '按收入项目查询') ? getOrderSum('商品费', orderForm) : '***';
    const top_up = await app.power('statement', '按收入项目查询') ? getOrderSum('会员储值', orderForm) : '***';
    const couponCost = await app.power('statement', '按收入项目查询') ? getOrderSum('优惠券销售', orderForm) : '***';
    const sportShowCost = await app.power('statement', '按收入项目查询') ? getOrderSum('精彩秀单', orderForm) : '***'
    const girlCost = await app.power('statement', '按收入项目查询') ? getOrderSum('助教订单', orderForm) : '***'
    this.setData({
      cash_data: [{
        sum: cash_sum,
        name: "现金",
        url: `/pages/statement/cash/cash?item=cash&cash=${cash_sum}&wx=${wx_sum}&card=${card_sum}&coupon=${cash_coupon + mt_coupon + dy_coupon}`
      },
      {
        sum: wx_sum,
        name: "微信",
        url: `/pages/statement/cash/cash?item=wx&cash=${cash_sum}&wx=${wx_sum}&card=${card_sum}&coupon=${cash_coupon + mt_coupon + dy_coupon}`
      }
      ],
      card_data: [{
        sum: card_sum,
        name: "会员卡",
        url: `/pages/statement/cash/cash?item=vip&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}&ksCouponCost=${ks_coupon}`
      },
      {
        sum: cash_coupon,
        name: "代金券",
        url: `/pages/statement/cash/cash?item=cashCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}&ksCouponCost=${ks_coupon}`
      },
      {
        sum: mt_coupon,
        name: "美团券",
        url: `/pages/statement/cash/cash?item=mtCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}&ksCouponCost=${ks_coupon}`
      },
      {
        sum: dy_coupon,
        name: "抖音券",
        url: `/pages/statement/cash/cash?item=dyCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}&&ksCouponCost=${ks_coupon}`
      },
      {
        sum: ks_coupon,
        name: "快手券",
        url: `/pages/statement/cash/cash?item=ksCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}&&ksCouponCost=${ks_coupon}`
      }
      ],
      item_data: [{
        sum: tableCost,
        yuan: "元",
        name: "桌台费",
        url: `/pages/statement/cash/cash?item=tableCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}&girlCost=${girlCost}`
      },
      {
        sum: commotidyCost,
        yuan: "元",
        name: "商品费",
        url: `/pages/statement/cash/cash?item=commotidyCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}&girlCost=${girlCost}`
      },
      {
        sum: top_up,
        yuan: "元",
        name: "会员储值",
        url: `/pages/statement/cash/cash?item=top_up&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}&girlCost=${girlCost}`
      },
      {
        sum: couponCost,
        yuan: "元",
        name: "优惠券销售",
        url: `/pages/statement/cash/cash?item=couponCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}&girlCost=${girlCost}`
      },
      {
        sum: girlCost,
        yuan: "元",
        name: "助教单",
        url: `/pages/statement/cash/cash?item=girlCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}&girlCost=${girlCost}`
      },
      {
        sum: sportShowCost,
        yuan: "元",
        name: "精彩秀",
        url: `/pages/statement/cash/cash?item=sportShowCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      }
      ],
      sattement_data: [{
        sum: await app.power('statement', '未结单据') ? getOrderSum('未结单据', orderForm) : '***',
        yuan: "单",
        name: "未结单据",
        path: './orderForm/orderForm?item=未结单据'
      },
      {
        sum: await app.power('statement', '已结单据') ? getOrderSum('已结单据', orderForm) : '***',
        yuan: "单",
        name: "已结单据",
        path: './orderForm/orderForm?item=已结单据'
      },
      {
        sum: appData?.newVipData?.length || 0,
        yuan: "个",
        name: "新增会员",
        path: './orderForm/orderForm?item=新增会员'
      },
      {
        sum: top_up,
        yuan: "元",
        name: "会员储值",
        path: './orderForm/orderForm?item=会员储值'
      },
      {
        sum: 0,
        yuan: "次",
        name: "商品盘点记录",
        path: './orderForm/orderForm?item=商品盘点记录'
      },
      {
        sum: 0,
        yuan: "元",
        name: "商品入库报表",
        path: '../set/commotidySet/listSearch/listSearch'
      },
      {
        sum: await app.power('statement', '商品销售报表') ? getOrderSum('商品费', orderForm) : '***',
        yuan: "元",
        name: "商品销售报表",
        path: './orderForm/orderForm?item=商品销售报表'
      },
      {
        sum: 0,
        yuan: "元",
        name: "收取员工现金记录",
        path: './orderForm/orderForm?item=收取员工现金记录'
      },
      {
        sum: await app.power('statement', '员工本月打卡记录') ? 0 : '***',
        yuan: "次",
        name: "员工本月打卡记录",
        path: './attendance/attendance'
      },
      {
        sum: this.data.giftCouponSum,
        yuan: "张",
        name: "赠送优惠券",
        path: `./giftCoupon/giftCoupon?disPlayDate=${this.data.disPlayDate}`
      },
      {
        sum: wx_sum,
        yuan: "元",
        name: "微信收支明细",
        path: './orderForm/orderForm?item=微信收支明细'
      },
      {
        sum: await app.power('statement', '微信退款明细') ? getOrderSum('微信退款明细', orderForm) : '***',
        yuan: "元",
        name: "微信退款明细",
        path: './orderForm/orderForm?item=微信退款明细'
      },
      {
        sum: 0,
        yuan: "位",
        name: "预定列表",
        path: './orderForm/orderForm?item=预定列表'
      },
      {
        sum: '点击查看详情',
        yuan: "",
        name: "开灯记录",
        path: `./openLightRecord/openLightRecord?item=开灯记录&date=${this.data.disPlayDate}`
      }
      ],
      warn_data: [{
        sum: 1,
        yuan: "个",
        name: "库存不足"
      },
      {
        sum: 0,
        yuan: "个",
        name: "今日生日"
      },
      {
        sum: 0,
        yuan: "元",
        name: "微信实时余额"
      }
      ],
      debt_data: [{
        sum: 0,
        yuan: "元",
        name: "客人欠款"
      },],
      AccountsTotal: await app.power('statement', '查看营业额') ? getOrderSum('total', orderForm) : '***'
    })
  },
  getAttendance() {
    const that = this
    //获取当月店铺考勤记录
    const now = new Date()
    app.getMemberAttendance(now.getFullYear(), now.getMonth()).then(res => {
      that.data.sattement_data[8].sum = res.length
      that.setData({
        memberAttendance: res,
        sattement_data: this.data.sattement_data
      })
      appData.memberAttendance = res
    })
  },
  async bindPickerChange(event) {
    const that = this
    console.log(event);
    if (event.mark.item === "shopSelect") { //切换店铺
      if (appData.merchant_info.shopId.length - 1 < parseInt(event.detail.value)) { //开设分店
        wx.navigateTo({
          url: '../login/login?item=addShop',
        })
        return;
      } else if (event.detail.value == appData.shopSelect) {//没有切换店铺直接返回
        return
      }
      this.setData({
        shopName_seletNum: event.detail.value
      });
      appData.shopSelect = event.detail.value;
      console.log({ '当前选择:': appData.shopSelect })
      //保存最后一次使用店铺的shopID
      this.saveLsatShopId(this.data.merchant_info.shopId[event.detail.value].shopId).then(res => {
        console.log({ '保存最后一次使用店铺的shopID res': res })
      })
      //检查店铺名称是否变更
      app.checkMerchantShopName(appData.merchant_info, appData.shop_account).then(nameRes => {
        if (nameRes) {
          that.setData({
            [`merchant_info.shopId[${nameRes.index}].shopName`]: nameRes.shopName
          })
          appData.merchant_info.shopId[nameRes.index].shopName = nameRes.shopName
        }
      })
      //获取店铺信息
      const res = await app.getLoginShopData(appData.merchant_info.shopId[appData.shopSelect].shopId)
      if (!res.success) {
        app.showModal('错误!', '获取店铺信息错误!')
        return
      }
      Object.assign(appData, app.resultDispose(res.data))

      //获取职位信息
      appData.status = app.getStatus(appData.merchant_info._openid)
      console.log('职位:' + appData.status)

      // //获取今日账单数据
      const todayDate = new Date()
      const nowDate = app.getNowTime(new Date(todayDate), '年月日')
      const {startTimeStamp , endTimeStamp} = app.getTimeLowOrHi(todayDate)
      this.setData({
        disPlayDate: nowDate,
        nowDate: nowDate,
        disPlayOrderForm: await app.getOrderData(startTimeStamp, endTimeStamp)
      })
      this.dataLoad(this.data.disPlayOrderForm)
      this.getOtherData(startTimeStamp, endTimeStamp)
      // //获取员工 打卡记录
      // await app.getMemberAttendance()
    } else if (event.mark.item === 'monthSearch') {
      await this.getOneMonthData(event.detail.value)
    }
  },
  async saveLsatShopId(lastShopId) {
    return await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'merchant_info',
        query: {
          _openid: this.data.merchant_info._openid
        },
        upData: {
          lastShopId: lastShopId
        }
      }
    })
  },
  async goto(e) {
    console.log(e);
    if (!await app.power('statement', e.mark.item)) {
      app.noPowerMessage()
      return
    }
    wx.navigateTo({
      url: e.mark.path,
    })
  },
  /**
   * 获取今日新增会员数量
   * @param {date} date 
   */
  async getNewVipSum(startTimeStamp, endTimeStamp) {
    console.log('起始时间:' + app.getNowTime(new Date(startTimeStamp)) + "||结束时间:" + app.getNowTime(new Date(endTimeStamp)))
    const res = await app.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"vip_list\").where({
            shopId:\"${app.globalData.shop_account._id}\",
            startTime:_.gte(${startTimeStamp}).and(_.lte(${endTimeStamp}))
          }).orderBy(\"startTime\", \"desc\").limit(1000).skip(0).get()`
      }
    })
    console.log(res)
    appData.newVipData = res.data
    this.setData({
      [`sattement_data[2].sum`]:res.pager.Total
    })
    return res.pager.Total
  },
  async getOtherData(startTimeStamp, endTimeStamp) {
    //获取 商品入库记录  , 员工打卡记录 , 赠送优惠券记录 , 预定列表 记录
    console.log('起始时间:' +app.getNowTime(new Date(startTimeStamp)) + "||结束时间:" +app.getNowTime(new Date(endTimeStamp)))
    //获取指定时间段的 新会员数量
    this.getNewVipSum(startTimeStamp,endTimeStamp)
    const that = this
    //获取当日商品入库数据
    app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_commotidy_po',
        query: {
          shopId: appData.shop_account._id,
        },
        _gte: {
          record: 'time',
          value: startTimeStamp
        },
        _lte: {
          record: 'time',
          value: endTimeStamp
        }
      }
    }).then(res => {
      console.log(res)
      that.data.purchaseData = res.data
      //计算总价
      that.data.purchaseTotalSum = res.data.reduce((acc, item) => {
        acc += parseInt(item.amount) 
        return acc
      }, 0)
      that.setData({
        ['sattement_data[5].sum']: - that.data.purchaseTotalSum / 100,
      })
    })
    //获取当日赠送优惠券张数
    app.callFunction({
      name: 'collection_count',
      data: {
        collection: 'server_logs',
        query: {
          shopId: appData.shop_account._id,
          source: '送券'
        },
        _gte: {
          record: 'timestamp',
          value: startTimeStamp
        },
        _lte: {
          record: 'timestamp',
          value: endTimeStamp
        }
      }
    }).then(res => {
      console.log(res)
      that.setData({
        [`sattement_data[9].sum`]: res.total
      })
    })

  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const that = this
    //添加开设分店选项 
    this.data.merchant_info.shopId.push({ shopName: '开设分店' })
    this.setData({
      merchant_info: this.data.merchant_info
    })
    this.data.nowDateObj = new Date()
    const {startTimeStamp , endTimeStamp} = app.getTimeLowOrHi(this.data.nowDateObj,'日')
    //刷新当前显示日期的数据
    const res = await app.getOrderData(startTimeStamp, endTimeStamp)
    this.setData({
      disPlayOrderForm: res
    })
    this.dataLoad(this.data.disPlayOrderForm)
    //检查店铺名称是否变更
    app.checkMerchantShopName(appData.merchant_info, appData.shop_account).then(nameRes => {
      if (nameRes) {
        that.setData({
          [`merchant_info.shopId[${nameRes.index}].shopName`]: nameRes.shopName
        })
        appData.merchant_info.shopId[nameRes.index].shopName = nameRes.shopName
      }
    })

    //获取本月员工打卡次数
    if (await app.power('statement', '员工本月打卡记录')) this.getAttendance()

    this.getOtherData(startTimeStamp, endTimeStamp)//获取其他数据  未完成  以后写
    return
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    this.setData({
      shopName_seletNum: appData.shopSelect
    })

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
  async onPullDownRefresh() {
    const now = new Date()
    const {startTimeStamp , endTimeStamp} = app.getTimeLowOrHi(now,'日')
    this.setData({
      disPlayDate:app.getNowTime(now,'年月日')
    })
    app.showLoading('数据加载中...', true);
    const res = await app.getOrderData(startTimeStamp, endTimeStamp)
    console.log(res)
    this.setData({
      disPlayOrderForm: res
    })
    wx.stopPullDownRefresh();
    wx.hideLoading();
    this.dataLoad(this.data.disPlayOrderForm);
    this.setData({
      disPlayDate: this.data.nowDate
    })
    this.getOtherData(startTimeStamp, endTimeStamp)
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