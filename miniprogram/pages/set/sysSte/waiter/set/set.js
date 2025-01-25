// pages/set/sysSte/waiter/set/set.js
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    active: 0,
    setPosition: '',
    power: {},
    changed:false,
    statementKeys: [],
    statementValues: [],
    operateKeys: [],
    operateValues: [],
    setKeys: [],
    setValues: [],
    systemSetKeys: [],
    systemSetValues: [],
    titel: {
      statement: ['按天/月查看营业额,显示近7天营业额曲线', '按现金,微信,会员卡,代币等分类查询', '按桌台费,商品费,陪练费,会员储值分类查询', '查看已结账的单据及详情', '查看正在计费的单据列表及详情', '新办会员的信息列表', '会员储值列表及详情', '商品销售列表汇总信息', '员工清点商品记录表', '一键补货的商品明细表', '员工配送次数统计及配送的商品明细', '查看现金收取记录及员工代收的现金明细', '员工上下班的打卡记录', '收取员工手中的现金', '查看当前低于现存量的商品', '查看今日过生日的会员名单,可一键发送短信', '查看赠送的优惠卷明细', '查看微信收款和退款的明细', '查看退款明细及状态'],
      operate: ['没有固定台子的客人消费的商品', '为散客开台,结账时不可刷会员卡', '为客人结账,管理人员开的台不可使用会员卡结算', '为客人更换桌台', '将一个台子的结算费用并入到另一个正在消费的桌台上', '为已开台的桌台点单,配送客人自助点单的商品', '结账时收取客人现金,现金计入未上交现金中', '商品结算时可选择并入台费的方式', '清点库存中商品与电脑中的数量书否一致,调整后自动产生盈亏金额', '自动判断要求补货的数量,一键补齐', '允许使用负数做商品的退货', '给已开台的客人赠送优惠卷', '必须盘点单开关打开方可生效', '退非本日的商品', '允许10分钟内撤销美团券核销'],
      set: ['设置店铺信息,设置后用户端自动显示', '设置员工信息及使用系统的功能权限', '设置桌台费的计费规则及桌台信息', '设置会员的级别,充值规则,折扣信息,卡扣规则', '修改会员信息,比赛奖励和会员消费,积分明细查询', '设置会员获取积分的规则', '商品信息设置及明细账目查询', '商品入库,对国标商品首次扫码入库自动建立档案', '短信充值,短信群发,发送记录查看', '查看管理客户评价', '设置优惠券的优惠规则', '设置套餐的规则,客人自助开台时可选择套餐', '客人在线预定桌台或房间', '多个店铺实现会员卡通用', '设置公告,客人开台时自动弹窗告知', '允许修改会员生日', '查看客人预定的信息', '取消客人的预定并退款', '查看客人自动开台记录', '手动退客人开台押金', '修改会员级别,会员余额,会员积分数据', '美团接入设置和管理', '抖音接入管理'],
      systemSet: ['申请和设置微信的收款账号信息', '灯控器的通讯设置', '打印参数及打印格式设置', '对与营业相关的参数进行调整', '添加桌台及缴纳年费查看年费截止日期', '把桌台得器材与桌台码进行绑定', '设置门禁机的参数', '已结账单退款权限']
    }
  },
  async changeDatabaseData(obj, shopFlag, data) {
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'power',
        flagName: 'shopFlag',
        flag: shopFlag,
        objName: obj,
        data: data
      }
    })
    console.log(res)
    if (res === 'ok') {
      return 'ok';
    } else {
      return 'error';
    }
  },
  async tap(e) {
    const path = e.mark.obj + '.' + e.mark.index + '.' + e.mark.titel
    console.log(path)
    const values = this.data.power[e.mark.obj][e.mark.index][e.mark.titel] === true ? false : true
    this.setData({
      ['power.' + e.mark.obj + '[' + e.mark.index + '].' + e.mark.titel]: values
    })
    this.getKeys()
    this.data.changed = true
  },
  onChange(e) {
    this.setData({
      active: e.detail.index
    })
    console.log(this.data.active)
  },

  getKeys() {
    //清空数组
    this.data.statementKeys = []
    this.data.statementValues = []
    this.data.operateKeys = []
    this.data.operateValues = []
    this.data.setKeys = []
    this.data.setValues = []
    this.data.systemSetKeys = []
    this.data.systemSetValues = []
    for (let index = 0; index < this.data.power.statement.length; index++) {
      const element = this.data.power.statement[index];
      this.data.statementKeys.push(Object.keys(element)[0])
      this.data.statementValues.push(Object.values(element)[0])
    }
    for (let index = 0; index < this.data.power.operate.length; index++) {
      const element = this.data.power.operate[index];
      this.data.operateKeys.push(Object.keys(element)[0])
      this.data.operateValues.push(Object.values(element)[0])
    }
    for (let index = 0; index < this.data.power.set.length; index++) {
      const element = this.data.power.set[index];
      this.data.setKeys.push(Object.keys(element)[0])
      this.data.setValues.push(Object.values(element)[0])
    }
    for (let index = 0; index < this.data.power.systemSet.length; index++) {
      const element = this.data.power.systemSet[index];
      this.data.systemSetKeys.push(Object.keys(element)[0])
      this.data.systemSetValues.push(Object.values(element)[0])
    }
    this.setData({
      statementKeys: this.data.statementKeys,
      statementValues: this.data.statementValues,
      operateKeys: this.data.operateKeys,
      operateValues: this.data.operateValues,
      setKeys: this.data.setKeys,
      setValues: this.data.setValues,
      systemSetKeys: this.data.systemSetKeys,
      systemSetValues: this.data.systemSetValues,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options.position)
    this.setData({
      setPosition: options.position,
      power: appData.shop_member_power[`${options.position}`]
    })
    console.log(this.data.power)
    this.getKeys()
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
    console.log('页面隐藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (!this.data.changed) {
      return
    }
    console.log('页面卸载')
    app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_member_power',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          [`${this.data.setPosition}`]:this.data.power
        }
      }
    }).then(res =>{
      console.log(res)
      if (res.success) {
        app.showToast('保存成功!','success')
      }else{
        app.showToast('保存失败','error')
      }
    })
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

  }
})