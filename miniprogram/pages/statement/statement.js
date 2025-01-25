// pages/satement/statement.js
const app = getApp()
const appData = app.globalData;
const nowTime = app.getNowTime(undefined, '年月日')
function getOrderSum(item, orderForm) {
  var sum = 0;
  for (let index = 0; index < orderForm.length; index++) {
    const element = JSON.parse(orderForm[index]);
    if (item === '商品单' || item === '商品费') { //分析商品单
      if (element.orderName === '商品单') {
        sum += parseFloat(element.commotidyCost);
      }
    } else if (item === '未结单据') { //分析未结单据
      if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
        if (element.endTime === '未结账' || element.endTime === '') {
          sum += 1;
        }
      }
    } else if (item === '已结单据') { //分析已结单据
      if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
        if (element.endTime !== '未结账' && element.endTime !== '') {
          sum += 1;
        }
      }
    } else if (item === 'total') { //分析总营业额
      if (element.orderName === '储值单') { //充值单
        sum += parseFloat(element.amount);
      } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
        sum += parseFloat(element.tableCost);
      } else if (element.orderName === '商品单') {
        sum += parseFloat(element.commotidyCost);
      } else if (element.orderName === '精彩秀单') {
        sum += parseFloat(element.cost);
      } else if (element.orderName === '杆柜租赁') {
        sum += parseFloat(element.amount);
      }
    } else if (item === '现金') { //分析现金营业额
      if (element.payMode.includes('cash') || element.payMode.includes('现金')) {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          if (element.cashCoupon) {
            sum += parseFloat(element.tableCost - element.cashCoupon);
          } else {
            sum += parseFloat(element.tableCost);
          }
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        }
      }
    } else if (item === '微信') { //微信微信营业额
      if (element.payMode.includes('wx') || element.payMode.includes('微信')) {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          if (element.cashCoupon) {
            sum += parseFloat(element.tableCost - element.cashCoupon);
          } else {
            sum += parseFloat(element.tableCost);
          }
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        } else if (element.orderName === '精彩秀单') {
          sum += parseFloat(element.cost);
        } else if (element.orderName === '杆柜租赁') {
          sum += parseFloat(element.amount);
        }
      }
    } else if (item === '微信退款') { //微信微信营业额
      if (element.payMode === 'wx' || element.payMode === '微信') {
        if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          sum += (element.cashPledge - element.tableCost > 0 ? element.cashPledge - element.tableCost : 0); //押金退款的金额
          if (element.log.length > 2) { //日志大于2条  则说明有有退款  罗出退款
            for (let i = 0; i < element.log.length; i++) {
              const e = element.log[i];
              if (i >= 1 && element.log[i].includes('---')) {
                const logArray = e.split('---');
                if (logArray[1].slice(0, 2) === '退款') {
                  sum += parseInt(logArray[1].match(/\d+/)[0])
                }
              }
            }
          }
        }
      }
    } else if (item === '会员卡') {
      if (element.payMode.includes('card') || element.payMode.includes('会员卡')) {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          if (element.cashCoupon) {
            sum += parseFloat(element.tableCost - element.cashCoupon);
          } else {
            sum += parseFloat(element.tableCost);
          }
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        } else if (element.orderName === '精彩秀单') {
          sum += parseFloat(element.cost);
        }
      }
    } else if (item === '代金券') {
      if (element.payMode.includes('cashCoupon') || element.payMode.includes('代金券')) {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          if (element.cashCoupon) {
            sum += parseFloat(element.cashCoupon);
          }
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        }
      }
    } else if (item === '美团券') {
      if (element.payMode === 'mtCoupon' || element.payMode === '美团券') {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          sum += parseFloat(element.tableCost);
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        }
      }
    } else if (item === '抖音券') {
      if (element.payMode === 'dyCoupon' || element.payMode === '抖音券') {
        if (element.orderName === '储值单') { //充值单
          sum += parseFloat(element.amount);
        } else if (element.orderName === '店员开台订单' || element.orderName === '自助开台订单' || element.orderName === '自助套餐订单') {
          sum += parseFloat(element.tableCost);
        } else if (element.orderName === '商品单') {
          sum += parseFloat(element.commotidyCost);
        }
      }
    } else if (item === '桌台费') {
      if (element.orderName === '自助开台订单' || element.orderName === '店员开台订单' || element.orderName === '自助套餐订单') {
        sum += parseFloat(element.tableCost);
      }
    } else if (item === '会员储值') {
      if (element.orderName === '储值单') {
        sum += parseFloat(element.amount);
      }
    } else if (item === '优惠券销售') {
      if (element.orderName === '优惠券销售单') {
        sum += parseFloat(element.amount);
      }
    } else if (item === '精彩秀单') {
      if (element.orderName === '精彩秀单') {
        sum += parseFloat(element.cost);
      }
    } else if (item === '商品入库记录') {
      if (element.orderName === '进货单') {
        sum += 1;
      }
    } else if (item === '商品入库报表') {
      if (element.orderName === '进货单') {
        sum += parseFloat(element.amount);
      }
    } else if (item === '员工收取现金记录') {
      if (element.orderName === '商品单' || element.orderName === '店员开台订单') {
        if (element.payMode === '现金' || element.payMode === 'cash') {
          sum += 1;
        }
      }
    }
  }
  return sum;
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

    merchant_info: appData.merchant_info,
    shopName_seletNum: 0,

    AccountsTotal: 0,
    cash_data: [],
    card_data: [],
    item_data: [],
    sattement_data: [],
    warn_data: [],
    debt_data: []
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
    const task = []
    //获取时间段内 新增的会员数量
    task.push(this.getNewVipSum(dateObj[0] + " 00:00:00", dateObj[1] + " 23:59:59"))
    //刷新当前显示日期的数据
    task.push(app.getOrderData(dateObj[0] + " 00:00:00", dateObj[1] + " 23:59:59"))
    const res = await Promise.all(task)
    this.setData({
      disPlayOrderForm: res[1]
    })
    this.dataLoad(this.data.disPlayOrderForm)
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
      const task = []
      //获取时间段内 新增的会员数量
      task.push(this.getNewVipSum(this.data.disPlayDate, this.data.disPlayDate))
      //刷新当前显示日期的数据
      task.push(app.getOrderData(this.data.disPlayDate, this.data.disPlayDate))
      const res = await Promise.all(task)
      this.setData({
        disPlayOrderForm: res[1]
      })
      appData.disPlayOrderForm = this.data.disPlayOrderForm;
      this.dataLoad(this.data.disPlayOrderForm)
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
        const task = []
        //获取时间段内 新增的会员数量
        task.push(this.getNewVipSum(this.data.disPlayDate, this.data.disPlayDate))
        //刷新当前显示日期的数据
        task.push(app.getOrderData(this.data.disPlayDate, this.data.disPlayDate))
        const res = await Promise.all(task)
        this.setData({
          disPlayOrderForm: res[1]
        })
        appData.disPlayOrderForm = this.data.disPlayOrderForm;
        this.dataLoad(this.data.disPlayOrderForm)
      } else {
        console.log('已经是今天!无法加载明日未发生的数据!')
      }
    }
  },
  async dataLoad(orderForm) {
    console.log(`运行处理${orderForm.length}条数据!`)
    const cash_sum = getOrderSum('现金', orderForm);
    const wx_sum = getOrderSum('微信', orderForm);
    const card_sum = getOrderSum('会员卡', orderForm);
    const cash_coupon = getOrderSum('代金券', orderForm);
    const mt_coupon = getOrderSum('美团券', orderForm);
    const dy_coupon = getOrderSum('抖音券', orderForm);
    const tableCost = getOrderSum('桌台费', orderForm);
    const commotidyCost = getOrderSum('商品费', orderForm);
    const top_up = getOrderSum('会员储值', orderForm);
    const couponCost = getOrderSum('优惠券销售', orderForm);
    const sportShowCost = getOrderSum('精彩秀单', orderForm)
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
        url: `/pages/statement/cash/cash?item=vip&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}`
      },
      {
        sum: cash_coupon,
        name: "代金券",
        url: `/pages/statement/cash/cash?item=cashCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}`
      },
      {
        sum: mt_coupon,
        name: "美团券",
        url: `/pages/statement/cash/cash?item=mtCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}`
      },
      {
        sum: dy_coupon,
        name: "抖音券",
        url: `/pages/statement/cash/cash?item=dyCoupon&card=${card_sum}&cashCouponCost=${cash_coupon}&mtCouponCost=${mt_coupon}&dyCouponCost=${dy_coupon}`
      }
      ],
      item_data: [{
        sum: tableCost,
        yuan: "元",
        name: "桌台费",
        url: `/pages/statement/cash/cash?item=tableCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      },
      {
        sum: commotidyCost,
        yuan: "元",
        name: "商品费",
        url: `/pages/statement/cash/cash?item=commotidyCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      },
      {
        sum: top_up,
        yuan: "元",
        name: "会员储值",
        url: `/pages/statement/cash/cash?item=top_up&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      },
      {
        sum: couponCost,
        yuan: "元",
        name: "优惠券销售",
        url: `/pages/statement/cash/cash?item=couponCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      },
      {
        sum: sportShowCost,
        yuan: "元",
        name: "精彩秀",
        url: `/pages/statement/cash/cash?item=sportShowCost&tableCost=${tableCost}&commotidyCost=${commotidyCost}&top_up=${top_up}&couponCost=${couponCost}&sportShowCost=${sportShowCost}`
      }
      ],
      sattement_data: [{
        sum: getOrderSum('未结单据', orderForm),
        yuan: "单",
        name: "未结单据",
        path: './orderForm/orderForm?item=未结账单据'
      },
      {
        sum: getOrderSum('已结单据', orderForm),
        yuan: "单",
        name: "已结单据",
        path: './orderForm/orderForm?item=已结账单据'
      },
      {
        sum: appData.newVipData.length,
        yuan: "个",
        name: "新增会员",
        path: './orderForm/orderForm?item=新增会员'
      },
      {
        sum: getOrderSum('会员储值', orderForm),
        yuan: "元",
        name: "会员储值",
        path: './orderForm/orderForm?item=会员储值'
      },
      {
        sum: getOrderSum('商品入库记录', orderForm),
        yuan: "次",
        name: "商品入库记录",
        path: './orderForm/orderForm?item=入库单'
      },
      {
        sum: getOrderSum('商品入库报表', orderForm),
        yuan: "元",
        name: "商品入库报表",
        path: './orderForm/orderForm?item=入库单'
      },
      {
        sum: getOrderSum('商品单', orderForm),
        yuan: "元",
        name: "商品销售报表",
        path: './orderForm/orderForm?item=商品单'
      },
      {
        sum: getOrderSum('员工收取现金记录', orderForm),
        yuan: "次",
        name: "收取员工现金记录",
        path: './orderForm/orderForm?item=收取现金'
      },
      {
        sum: appData.memberAttendance.length,
        yuan: "次",
        name: "员工本月打卡记录",
        path: './attendance/attendance'
      },
      {
        sum: 0,
        yuan: "张",
        name: "赠送优惠券"
      },
      {
        sum: getOrderSum('微信', orderForm),
        yuan: "元",
        name: "微信收支明细"
      },
      {
        sum: getOrderSum('微信退款', orderForm),
        yuan: "元",
        name: "微信退款明细"
      },
      {
        sum: 0,
        yuan: "位",
        name: "预定列表"
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
      AccountsTotal: getOrderSum('total', orderForm)
    })
  },
  // async amendOldData() {//用于寻找旧数据  用完删除
  //   const res = await this.getOneMonthData('2025-01')

  // },
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
      console.log({'当前选择:':appData.shopSelect})
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
      this.setData({
        disPlayOrderForm: app.getOrderData(app.getNowTime(this.getDateObj(this.data.disPlayDate)), app.getNowTime(this.getDateObj(this.data.disPlayDate)))
      })
      this.dataLoad(this.data.disPlayOrderForm)
      // //获取员工 打卡记录
      // await app.getMemberAttendance()
    } else if (event.mark.item === 'monthSearch') {
      await this.getOneMonthData(event.detail.value)
    }
  },
  async goto(e) {
    console.log(e);
    app.showLoading('加载中...', true)
    var itemNum = '';
    var itemName = '';
    if (e.mark.item === 'turnover') {
      itemNum = 0;
      itemName = '查看营业额'
    } else if (e.mark.item === 'collectionType') {
      itemNum = 1;
      itemName = '按收款方式查询'
    } else if (e.mark.item === 'collectionItem') {
      itemNum = 2;
      itemName = '按收入项目查询'
    } else if (e.mark.item === '未结账单据') {
      itemNum = 4
      itemName = '未结账单据'
    } else if (e.mark.item === '已结账单据') {
      itemNum = 3
      itemName = '已结账单据'
    } else if (e.mark.item === '商品销售报表') {
      itemNum = 7
      itemName = '商品销售报表'
    } else if (e.mark.item === '员工打卡记录') {
      itemNum = 12
      itemName = '员工打卡记录'
    } else if (e.mark.item === '新增会员') {
      itemNum = 5
      itemName = '新办会员列表'
    } else if (e.mark.item === '会员储值'){
      itemNum = 6
      itemName = '会员储值列表'
    }else if (e.mark.item === '商品入库记录'){
      itemNum = 6
      itemName = '会员储值列表'
    }
    if (itemNum === '' || itemName === '') { //未注册设置项目  返回
      wx.hideLoading()
      return
    }
    if (await app.power('statement', itemNum, itemName) === false) {
      app.noPowerMessage()
      return
    }
    //appData.orderForm = await app.getOrderData(this.data.disPlayDate,this.data.disPlayDate);
    wx.hideLoading()
    wx.navigateTo({
      url: e.mark.path,
    })
  },
  /**
   * 获取今日新增会员数量
   * @param {date} date 
   */
  async getNewVipSum(startTime, endTime) {
    console.log('起始时间:' + startTime + "||结束时间:" + endTime)
    const startTimeStr = startTime.replace(/(\d{4})年(\d{2})月(\d{2})日/, '$1/$2/$3')
    const endTimeStr = endTime.replace(/(\d{4})年(\d{2})月(\d{2})日/, '$1/$2/$3')
    const startT = new Date(app.getDateTimeLowOrHi(new Date(startTimeStr), undefined)).getTime()
    const endT = new Date(app.getDateTimeLowOrHi(undefined, new Date(endTimeStr))).getTime()
    const res = await app.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"vip_list\").where({
            shopId:\"${app.globalData.shop_account._id}\",
            startTime:_.gte(${startT}).and(_.lte(${endT}))
          }).orderBy(\"startTime\", \"desc\").limit(1000).skip(0).get()`
      }
    })
    console.log(res)
    appData.newVipData = res.data
    return res.pager.Total
  },
  async getOtherData(){
    //获取 商品入库记录  , 员工打卡记录 , 赠送优惠券记录 , 预定列表 记录
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
    //获取首个店铺的当日数据
    const task = []
    //获取时间段内 新增的会员数量
    task.push(this.getNewVipSum(this.data.disPlayDate, this.data.disPlayDate))
    //刷新当前显示日期的数据
    task.push(app.getOrderData(this.data.disPlayDate, this.data.disPlayDate))
    const res = await Promise.all(task)
    this.setData({
      disPlayOrderForm: res[1]
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
    //this.getOtherData()//获取其他数据  未完成  以后写
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
    // app.showLoading('数据加载中...', true);
    // appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate(), 'null', 'null');
    // appData.disPlayOrderForm = appData.orderForm;
    // wx.stopPullDownRefresh();
    // wx.hideLoading();
    // this.dataLoad(appData.orderForm);
    // this.setData({
    //   disPlayDate: this.data.nowDate
    // })
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