const string = ''
const num = 0
const member_power_defult = {
  statement: {
    '查看营业额': { descripsion: '按天/月查看营业额,显示近7天营业额曲线', value: false },
    '按收款方式查询': { descripsion: '按现金,微信,会员卡,代币等分类查询', value: false },
    '按收入项目查询': { descripsion: '按桌台费,商品费,陪练费,会员储值分类查询', value: false },
    '已结账单据': { descripsion: '查看已结账的单据及详情', value: false },
    '未结账单据': { descripsion: '查看正在计费的单据列表及详情', value: false },
    '新办会员列表': { descripsion: '新办会员的信息列表', value: false },
    '会员储值列表': { descripsion: '会员储值列表及详情', value: false },
    '商品销售报表': { descripsion: '商品销售列表汇总信息', value: false },
    '商品清点记录': { descripsion: '员工清点商品记录表', value: false },
    '补货记录': { descripsion: '一键补货的商品明细表', value: false },
    '员工配送统计': { descripsion: '员工配送次数统计及配送的商品明细', value: false },
    '收取员工现金记录': { descripsion: '查看现金收取记录及员工代收的现金明细', value: false },
    '员工打卡记录': { descripsion: '员工上下班的打卡记录', value: false },
    '收员工营业现金': { descripsion: '收取员工手中的现金', value: false },
    '库存不足列表': { descripsion: '查看当前低于现存量的商品', value: false },
    '今日过生日会员': { descripsion: '查看今日过生日的会员名单,可一键发送短信', value: false },
    '赠送优惠券': { descripsion: '查看赠送的优惠卷明细', value: false },
    '微信收支明细': { descripsion: '查看微信收款和退款的明细', value: false },
    '微信退款明细': { descripsion: '查看退款明细及状态', value: false }
  },
  operate: {
    '外卖': { descripsion: '没有固定台子的客人消费的商品', value: false },
    '开台': { descripsion: '为散客开台,结账时不可刷会员卡', value: false },
    '结账': { descripsion: '为客人结账,管理人员开的台不可使用会员卡结算', value: false },
    '换台': { descripsion: '为客人更换桌台', value: false },
    '并台': { descripsion: '将一个台子的结算费用并入到另一个正在消费的桌台上', value: false },
    '商品销售及配送': { descripsion: '为已开台的桌台点单,配送客人自助点单的商品', value: false },
    '现金结算': { descripsion: '结账时收取客人现金,现金计入未上交现金中', value: false },
    '商品并入台费结算': { descripsion: '商品结算时可选择并入台费的方式', value: false },
    '清点商品': { descripsion: '清点库存中商品与电脑中的数量书否一致,调整后自动产生盈亏金额', value: false },
    '一键补货': { descripsion: '自动判断要求补货的数量,一键补齐', value: false },
    '退货': { descripsion: '允许使用负数做商品的退货', value: false },
    '赠送优惠券': { descripsion: '给已开台的客人赠送优惠卷', value: false },
    '盘点时不允许修改库存': { descripsion: '必须盘点单开关打开方可生效', value: false },
    '跨天退货': { descripsion: '退非本日的商品', value: false },
    '撤销美团券核销': { descripsion: '允许10分钟内撤销美团券核销', value: false }
  },
  set: {
    '店铺设置': { descripsion: '设置店铺信息,设置后用户端自动显示', value: false },
    '员工及权限': { descripsion: '设置员工信息及使用系统的功能权限', value: false },
    '计费规则及桌台档案': { descripsion: '设置桌台费的计费规则及桌台信息', value: false },
    '会员优惠设置': { descripsion: '设置会员的级别,充值规则,折扣信息,卡扣规则', value: false },
    '会员档案设置': { descripsion: '修改会员信息,比赛奖励和会员消费,积分明细查询', value: false },
    '积分规则设置': { descripsion: '设置会员获取积分的规则', value: false },
    '商品档案设置': { descripsion: '商品信息设置及明细账目查询', value: false },
    '商品采购入库': { descripsion: '商品入库,对国标商品首次扫码入库自动建立档案', value: false },
    '短信设置及群发': { descripsion: '短信充值,短信群发,发送记录查看', value: false },
    '建议和评价': { descripsion: '查看管理客户评价', value: false },
    '优惠券管理': { descripsion: '设置优惠券的优惠规则', value: false },
    '套餐设置': { descripsion: '设置套餐的规则,客人自助开台时可选择套餐', value: false },
    '预定管理': { descripsion: '客人在线预定桌台或房间', value: false },
    '连锁管理': { descripsion: '多个店铺实现会员卡通用', value: false },
    '公告管理': { descripsion: '设置公告,客人开台时自动弹窗告知', value: false },
    '修改会员生日': { descripsion: '允许修改会员生日', value: false },
    '预定列表': { descripsion: '查看客人预定的信息', value: false },
    '取消预定': { descripsion: '取消客人的预定并退款', value: false },
    '开门记录': { descripsion: '查看客人自动开台记录', value: false },
    '退开门押金': { descripsion: '手动退客人开台押金', value: false },
    '修改会员敏感信息': { descripsion: '修改会员级别,会员余额,会员积分数据', value: false },
    '美团接入管理': { descripsion: '美团接入设置和管理', value: false },
    '抖音接入管理': { descripsion: '抖音接入管理', value: false }
  },
  systemSet: {
    '微信收款账号设置': { descripsion: '申请和设置微信的收款账号信息', value: false },
    '灯控器设置': { descripsion: '灯控器的通讯设置', value: false },
    '打印机设置': { descripsion: '打印参数及打印格式设置', value: false },
    '营业参数设置': { descripsion: '对与营业相关的参数进行调整', value: false },
    '桌台管理': { descripsion: '添加桌台及缴纳年费查看年费截止日期', value: false },
    '绑定桌台码': { descripsion: '把桌台得器材与桌台码进行绑定', value: false },
    '门禁设置': { descripsion: '设置门禁机的参数', value: false },
    '退款/部分退款': { descripsion: '已结账单退款权限', value: false }
  }
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
  shopSmartDisplay:[],
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