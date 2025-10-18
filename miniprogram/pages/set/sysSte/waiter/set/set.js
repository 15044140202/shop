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
    changed: false,
    shop_member_power: {
      statement: {
        '查看营业额': { descripsion: '按天/月查看营业额,显示近7天营业额曲线', value: false },
        '按收款方式查询': { descripsion: '按现金,微信,会员卡,代币等分类查询', value: false },
        '按收入项目查询': { descripsion: '按桌台费,商品费,陪练费,会员储值分类查询', value: false },
        '已结单据': { descripsion: '查看已结账的单据及详情', value: false },
        '未结单据': { descripsion: '查看正在计费的单据列表及详情', value: false },
        '新增会员': { descripsion: '新办会员的信息列表', value: false },
        '会员储值': { descripsion: '会员储值列表及详情', value: false },
        '商品盘点记录': { descripsion: '员工清点商品记录表', value: false },
        '商品入库报表': { descripsion: '店铺商品采购入库记录', value: false },
        '商品销售报表': { descripsion: '商品销售列表汇总信息', value: false },
        '收取员工现金记录': { descripsion: '收缴员工营业期间收取的现金', value: false },
        '员工本月打卡记录': { descripsion: '员工上下班的打卡记录', value: false },
        '赠送优惠券': { descripsion: '查看赠送的优惠卷明细', value: false },
        '微信收支明细': { descripsion: '查看微信收款和退款的明细', value: false },
        '微信退款明细': { descripsion: '查看退款明细及状态', value: false },
        '预定列表': { descripsion: '查看客人预约桌台列表', value: false },
        '库存不足': { descripsion: '查看当前低于预设最低商品数量的商品', value: false },
        '今日生日': { descripsion: '查看今日过生日的会员名单,可一键发送短信', value: false },
        '微信实时余额': { descripsion: '查看当日微信实时余额', value: false },
        '开灯记录': { descripsion: '查看店员后台开灯记录', value: false },
        '客人欠款': { descripsion: '查看客人未付欠款', value: false }
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
        '撤销美团券核销': { descripsion: '允许10分钟内撤销美团券核销', value: false },
        '核验团购券':{descripsion: '核销团购券,重核选顾客的团购套餐', value: false}
      },
      set: {
        '店铺设置': { descripsion: '设置店铺信息,设置后用户端自动显示', value: false },
        '店铺转让':{ descripsion: '店铺转让给其他人', value: false },
        '员工及权限': { descripsion: '设置员工信息及使用系统的功能权限', value: false },
        '计费规则及桌台档案': { descripsion: '设置桌台费的计费规则及桌台信息', value: false },
        '会员优惠设置': { descripsion: '设置会员的级别,充值规则,折扣信息,卡扣规则', value: false },
        '会员档案设置': { descripsion: '修改会员信息,比赛奖励和会员消费,积分明细查询', value: false },
        '积分规则设置': { descripsion: '设置会员获取积分的规则', value: false },
        '商品档案设置': { descripsion: '商品信息设置及明细账目查询', value: false },
        '商品采购入库': { descripsion: '商品入库,对国标商品首次扫码入库自动建立档案', value: false },
        '短信设置及群发': { descripsion: '短信充值,短信群发,发送记录查看', value: false },
        '建议/意见': { descripsion: '查看管理客户评价', value: false },
        '优惠券管理': { descripsion: '设置优惠券的优惠规则', value: false },
        '套餐设置': { descripsion: '设置套餐/包时段的规则,客人自助开台时可选择套餐', value: false },
        '预定管理': { descripsion: '客人在线预定桌台或房间', value: false },
        '连锁管理': { descripsion: '多个店铺实现会员卡通用', value: false },
        '公告管理': { descripsion: '设置公告,客人开台时自动弹窗告知', value: false },
        '修改会员生日': { descripsion: '允许修改会员生日', value: false },
        '预定列表': { descripsion: '查看客人预定的信息', value: false },
        '取消预定': { descripsion: '取消客人的预定并退款', value: false },
        '开门记录': { descripsion: '查看客人自动开台记录', value: false },
        '退开门押金': { descripsion: '手动退客人开台押金', value: false },
        '修改会员敏感信息': { descripsion: '修改会员级别,会员余额,会员积分数据', value: false },
        '团购接入管理': { descripsion: '美团/抖音/快手等接入设置和管理', value: false },
        '营销活动管理': { descripsion: '幸运九宫格等营销活动的设置', value: false },
        '店铺小账本': { descripsion: '店铺小账本查看及记录', value: false },
        '缴费记录':{ descripsion: '查看店铺各种缴费记录', value: false },
        '店铺招聘':{ descripsion: '查看及发布店铺招聘信息', value: false },
      },
      systemSet: {
        '微信收款账号设置': { descripsion: '申请和设置微信的收款账号信息', value: false },
        '灯控器设置': { descripsion: '灯控器的通讯设置', value: false },
        '打印机设置': { descripsion: '打印参数及打印格式设置', value: false },
        '营业参数设置': { descripsion: '对与营业相关的参数进行调整', value: false },
        '桌台管理': { descripsion: '添加桌台及缴纳年费查看年费截止日期', value: false },
        '绑定桌台码': { descripsion: '把桌台得器材与桌台码进行绑定', value: false },
        '门禁设置': { descripsion: '设置门禁机的参数', value: false },
        '退款/部分退款': { descripsion: '已结账单退款权限', value: false },
        '设备管理':{descripsion: '添加/删除/设置店铺设备', value: false}
      }
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
    console.log(e)
    const values = this.data.shop_member_power[e.mark.obj][e.mark.index].value ? false : true
    console.log(values)
    this.setData({
      ['shop_member_power.' + e.mark.obj + '.' + e.mark.index + '.' + 'value']: values
    })
    this.data.changed = true
  },
  onChange(e) {
    this.setData({
      active: e.detail.index
    })
    console.log(this.data.active)
  },
  mergeExistingProperties(target, source) {
    for (let key in source) {
      if (target.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
    return target;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options.position)
    console.log(this.data.shop_member_power)
    //合并数据库本地现有的 权限属性
    this.data.shop_member_power.statement = this.mergeExistingProperties(this.data.shop_member_power.statement,appData.shop_member_power[options.position].statement)
    this.data.shop_member_power.operate = this.mergeExistingProperties(this.data.shop_member_power.operate,appData.shop_member_power[options.position].operate)
    this.data.shop_member_power.set = this.mergeExistingProperties(this.data.shop_member_power.set,appData.shop_member_power[options.position].set)
    this.data.shop_member_power.systemSet = this.mergeExistingProperties(this.data.shop_member_power.systemSet,appData.shop_member_power[options.position].systemSet)

    this.setData({
      setPosition: options.position,
      shop_member_power: this.data.shop_member_power
    })
    console.log(this.data.shop_member_power)
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
      name: 'upDate',
      data: {
        collection: 'shop_member_power',
        query: {
          shopId: appData.shop_account._id
        },
        upData: {
          [this.data.setPosition]: this.data.shop_member_power
        }
      }
    }).then(res => {
      console.log(res)
      if (res.success) {
        appData.shop_member_power[this.data.setPosition] = this.data.shop_member_power
        console.log( appData.shop_member_power[this.data.setPosition] )
        app.showToast('保存成功!', 'success')
      } else {
        app.showToast('保存失败', 'error')
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