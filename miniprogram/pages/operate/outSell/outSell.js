// pages/set/commotidySet/commotidyPurchaseSet/commotidyPurchaseSet.js
const appData = getApp().globalData;
const app = getApp();
import Dialog from '@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
    commotidy: [],

    class: [],
    active: '',
    addCommotidy: [],
    inventoryHidden: false,
    sum: 0,

    hidden: true
  },
  async payCommotidyCost() {
    const now = new Date();
    const orderNum = app.createOrderNum(now, 'goods_W') + '0' //桌台号 '0'为吧台 
    //获取店员名称
    const shop_member = appData.shop_member
    const myOpenid = appData.merchant_info._openid
    const memberName = appData.status + '|' + (shop_member.find(item => item._openid === myOpenid)?.userName || 'BOSS')

    //显示选择支付方式选择界面
    var payMode = 'cash';
    try {
      await Dialog.confirm({
        title: '选择支付方式',
        message: `${this.data.sum / 100}元\n现金收取请直接收取\n微信支付需扫客人首付款码.`,
        confirmButtonText: '微信支付',
        cancelButtonText: '现金支付'
      });
      //点击确认键   微信支付
      payMode = 'wx'
    } catch { //点击取消按钮  现金支付
      payMode = 'cash';
    }
    console.log('支付方式:' + payMode)
    this.deletZero();
    const that = this
    //生成售卖商品清单
    const commotidyList = this.data.addCommotidy.reduce((acc, item) => {
      acc.push({
        name: that.data.commotidy[item.index].name,
        sum: item.sum,
        price: that.data.commotidy[item.index].sellCost,
        goodsId: that.data.commotidy[item.index]._id
      })
      return acc
    }, [])

    //构建订单
    const order = {
      orderNum: orderNum,
      orderName: '商品单',
      shopId: appData.shop_account._id,
      goodsList: commotidyList,
      time: now.getTime(),
      sellPerson: memberName,
      buyPerson:{
        name:memberName,
        openid:myOpenid
      },
      integral: 0,
      commotidyCost: this.data.sum / 100,
      payState: payMode === 'wx' ? 0 : 1,//0未支付  1 已支付 2已退款
      payMode: payMode,
      sub_mchid:appData.shop_account.proceedAccount
    }
    console.log(order)
    //下单
    const placeOrderRes = await app.callFunction({
      name: 'place_order_goods',
      data: {
        order: order
      }
    })
    console.log(placeOrderRes)
    if (!placeOrderRes.success) {
      app.showModal('下单错误!')
      throw 'error --- 下单错误!'
    }
    //微信支付
    if (payMode === 'wx') {
      const cardId = await wx.scanCode({
        onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
      });
      const payCode = await app.cardPay((order.commotidyCost * 100).toString(), `商品费`, appData.shop_account.proceedAccount, order.orderNum, cardId.result, 'wxad610929898d4371')
      console.log(payCode)
      if (!payCode.success && !['需要用户输入支付密码', ''].includes(payCode.data.err_code_des)) { //支付返回错误
        await app.payErrCodeMsg(payCode.data)
        wx.hideLoading()
        return;
      }
      const payRes = await app.awaitOrderResult(order.orderNum);
      if (!payRes) { //支付失败
        app.showToast('支付失败!', 'error')
        return;
      }
      //支付成功
      const payMent_done_res = await app.callFunction({
        name: 'payment_done_goods_order',
        data: {
          orderNum: order.orderNum
        }
      })
      if (!payMent_done_res.success) {
        app.showModal('处理支付成功失败!请联系客服处理!')
        return
      }
    }

    //处理本地数据
    commotidyList.forEach(item => {
      for (let index = 0; index < that.data.commotidy.length; index++) {
        const element = that.data.commotidy[index];
        if (element._id === item.goodsId) {
          element.sum -= item.sum
        }
      }
    })
    this.setData({
      commotidy: this.data.commotidy
    })

    return
  },
  deletZero() {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (element.sum == '0') { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
  },
  delete(e) {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (e.mark.index == index) { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
    this.getSum()
  },
  addCommotidy(e) {
    console.log(e)
    //首先检测这个商品是否已添加到添加列表了
    const index = this.data.addCommotidy.findIndex(item => item.index === e.mark.index)
    if (index > -1) {
      this.setData({
        [`addCommotidy[${index}].sum`]: this.data.addCommotidy[index].sum + 1
      })
      this.getSum()
      return;
    }
    //添加新商品
    this.data.addCommotidy.push({
      index: e.mark.index,
      sum: 1
    })
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    this.getSum()
    console.log(this.data.addCommotidy)
  },
  input(e) {
    if (e.detail.value === '') {
      this.data.addCommotidy[e.mark.index].sum = 0
    } else {
      this.setData({
        [`addCommotidy[${e.mark.index}].sum`]: parseInt(e.detail.value)
      })
    }
    this.getSum()
    console.log(this.data.addCommotidy[e.mark.index].sum)
  },
  getSum() {
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum + parseFloat(this.data.commotidy[element.index].sellCost) * parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum: sum
    })
  },

  hidden() {
    this.data.inventory === true ? this.setData({
      inventory: false
    }) : this.setData({
      inventory: true
    })
  },
  async getCommotidy() {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_commotidy',
        query: {
          shopId: appData.shop_account._id
        }
      }
    })
    console.log(res)
    return res.data
  },
  getGoodsClass() {
    // 使用 Set 自动去重
    const goodsclass = [...new Set(this.data.commotidy.map(item => item.class))];
    console.log(goodsclass);
    this.setData({
      class: goodsclass
    });
    this.setData({
      active: goodsclass[0],
    })
  },
  onChange(e) {
    console.log(e)
    this.setData({
      active: e.detail.title
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading("数据加载中...", true)
    const res = await this.getCommotidy();
    if (res.length > 0) {
      this.setData({
        commotidy: res,
        hidden: false
      })
    } else {
      app.showToast('无商品数据!', 'error')
    }

    //获取商品类别
    this.getGoodsClass()

    wx.hideLoading();
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
    return appData.globalShareInfo;
  }
})