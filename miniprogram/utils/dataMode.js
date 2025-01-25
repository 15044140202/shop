const string = ''
const num = 0
const member_power_defult = {
  statement: [{
    '查看营业额': true
  },
  {
    '按收款方式查询': false
  },
  {
    '按收入项目查询': false
  },
  {
    '已结账单据': false
  },
  {
    '未结账单据': false
  },
  {
    '新办会员列表': false
  },
  {
    '会员储值列表': false
  },
  {
    '商品销售报表': false
  },
  {
    '商品清点记录': false
  },
  {
    '补货记录': false
  },
  {
    '员工配送统计': false
  },
  {
    '收取员工现金记录': false
  },
  {
    '员工打卡记录': false
  },
  {
    '收员工营业现金': false
  },
  {
    '库存不足列表': false
  },
  {
    '今日过生日会员': false
  },
  {
    '赠送优惠券': false
  },
  {
    '微信收支明细': false
  },
  {
    '微信退款明细': false
  }
  ],
  operate: [{
    '外卖': true
  },
  {
    '开台': true
  },
  {
    '结账': true
  },
  {
    '换台': true
  },
  {
    '并台': true
  },
  {
    '商品销售及配送': true
  },
  {
    '现金结算': false
  },
  {
    '商品并入太费结算': false
  },
  {
    '清点商品': false
  },
  {
    '一键补货': false
  },
  {
    '退货': false
  },
  {
    '赠送优惠券': false
  },
  {
    '盘点时不允许修改库存': false
  },
  {
    '跨天退货': false
  },
  {
    '撤销美团券核销': false
  }
  ],
  set: [{
    '店铺设置': false
  },
  {
    '员工及权限': false
  },
  {
    '计费规则及桌台档案': false,
  },
  {
    '会员优惠设置': false
  },
  {
    '会员档案设置': false
  },
  {
    '积分规则设置': false
  },
  {
    '商品档案设置': false
  },
  {
    '商品采购入库': false
  },
  {
    '短信设置及群发': false
  },
  {
    '建议和评价': false
  },
  {
    '优惠券管理': false
  },
  {
    '套餐设置': true
  },
  {
    '预定管理': false
  },
  {
    '连锁管理': false
  },
  {
    '公告管理': false
  },
  {
    '修改会员生日': false
  },
  {
    '预定列表': false
  },
  {
    '取消预定': false
  },
  {
    '开门记录': false
  },
  {
    '退开门押金': false
  },
  {
    '修改会员敏感信息': false
  },
  {
    '美团接入管理': false
  },
  {
    '抖音接入管理': false
  }
  ],
  systemSet: [{
    '微信收款账号设置': false
  },
  {
    '灯控器设置': false
  },
  {
    '打印机设置': false
  },
  {
    '营业参数设置': false
  },
  {
    '桌台管理': false
  },
  {
    '绑定桌台码': false
  },
  {
    '门禁设置': false
  },
  {
    '退款/部分退款': false
  }
  ]
}
let merchant_info = {
  _openid: '',
  shopId: []
}
let shop_Account = {
  _openid: '',
  shopInfo: {
    logoId: string,
    openTime: string,
    closeTime: string,
    foundTime: string,
    intro: string,
    shopName: string,
    shopAdd: string,
    telephone: string
  },
  proceedAccount: string,
  sportShowAmount: num,
  shortMsgDegree: num,
}
let shop_vip_set = {
  shopId: string,
  vipSet: [{
    chargingDiscount: [],
    commotidyCardDeduct: false,
    commotidyCostDiscount: num,
    name: '非会员',
    needIntegral: num,
    noBalanceDiscount: false,
    practiseBall: false,
    saveMoney: [],
    tableCardDeduct: true,
    vipSum:0
  }]
}
let shop_setmeal = {
  shopId: string,
  setmeal: [
    {
      bindChargingId: {},
      duration: num,
      name: string,
      setmealPrice: num,
      setmealStartTime: string,
      setmealEndTime: string,
      cardDeduct:false
    }
  ]
}
let shop_member_power = {
  shopId: string,
  cashier: member_power_defult,
  finance: member_power_defult,
  manager: member_power_defult,
  waiter: member_power_defult,
}
let shop_operate_set = {
  shopId: string,
  clientSet: {
    amountSeparateDisplay: true,
    disPlayPrice: true,
    integralNoDisPlay: false,
    selfExchange: true,
    selfMerge: true
  },
  commotidySet: {
    selfBuy: true
  },
  settleAmountSet: {
    commotidyAtOncePay: true,
    payFor: true,
    scanQrPay: 0
  },
  startSet: {
    detectDistance: true,
    phoneImpower: true
  },
  sweepSet: {
    sweep: true,
    sweepTime: 3
  }
}
let shop_lucksudoku_set = {
  shopId: string,
  startTime: string,
  endTime: string,
  switch: false,
  everyDaySum: num,
  prize: [
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
    {
      name: string,
      probability: num,
      totalSum: num
    },
  ]
}
let shop_integral_set = {
  shopId: string,
  commotidy: {
    everyCost: num,
    giveValues: num,
    switch: false
  },
  stored: {
    everyCost: num,
    giveValues: num,
    switch: false
  },
  tableCost: {
    everyCost: 1,
    giveValues: 1,
    switch: true
  }
}
let shop_device = {
  shopId: string,
  announcer: string,
  camera: [],
  cupboard: [],
  doorLock: string,
  lightCtrl: string,
  printer: string,
  cupboardUseRule: [
    {
    integral: 0,
    price: 0
  }, {
    integral: 0,
    price: 0
  }, {
    integral: 0,
    price: 0
  }],
  shopLightSet: [],
  sportShowPrice: 0,
}
let shop_charging = {
  shopId: string,
  blanceWarn: false,
  costCost: {
    everyCost: 5,
    freeCost: 0
  },
  name: '默认计费规则',
  periodCost: {
    freeTime: 3,
    periodTime: 15
  },
  periodSet: 'minute',
  startCost: {
    startCost: 10,
    startTime: 3,
    switch: true
  },
  timeSegment: [{
    startTime: '00:00',
    endTime: '00:00',
    price: 30
  }]
}
let shop_notice = {
  shopId: string,
  author: string,
  autoPop: true,
  content: string,
  startTime: string,
  endTime: string,
  lookSum: num,
  authorOpenid: string,
  state: false,
  titel: string
}

module.exports = {
  merchant_info,
  shop_Account,
  shop_notice,
  shop_vip_set,
  shop_setmeal,
  shop_member_power,
  shop_operate_set,
  shop_lucksudoku_set,
  shop_integral_set,
  shop_device,
  shop_charging
}