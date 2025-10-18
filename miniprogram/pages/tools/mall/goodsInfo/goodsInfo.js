// pages/tools/mall/goodsInfo/goodsInfo.js
const app = getApp()
const appData = app.globalData
const mall_utils = require('../mall_utils')
const zx = require('../../../../utils/zx')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showCommotydiList: [],
    index: -1,

    // 购物车弹窗相关
    showCartModal: false,
    cartSelectedColor: null,
    cartQuantity: 0,

    // 购买弹窗相关
    showBuyModal: false,
    buySelectedColor: null,
    buyQuantity: 0,
    paymentMethod: 'wx',//支付方式选择 wx微信 cod快递代收
    remarks: '',
    distributionMode: 0,//0快递 1店铺自提
    distributionModeArr: ['快递配送', '门店自提'],
    //收货地址
    shoppingAdd: [],
    shoppingAddSelected: 0,
    //购物车信息
    shoppingCart: [],
    //本店自取地址
    merchantAdd: {
      shopName: '长春市高新区仓库',
      address: '长春市高新区宜居路东北亚动漫产业园区9号楼',
      phone: '15204462555',
      latitude: 43.77112565448118,
      longitude: 125.21260249347685
    }
  },
  openLocation(e) {
    console.log(e)
    zx.openLocation(e.mark.latitude, e.mark.longitude)
  },
  distributionModeChange(e) {
    console.log(e)
    this.setData({
      distributionMode: parseInt(e.detail.value),
      paymentMethod: 'wx'
    })
    if (this.data.distributionMode === 1) {
      this.setData({
        expressFee: 0
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.setData({
      index: options.index
    })
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('gaveData', data => {
      console.log(data)
      that.setData({
        showCommotydiList: data.showCommotydiList,
        shoppingCart: data.shoppingCart
      })
      // 初始化默认选择第一个颜色
      const firstColor = Object.keys(that.data.showCommotydiList[that.data.index].color)[0];
      console.log(firstColor)
      that.setData({
        selectedColor: firstColor,
        cartSelectedColor: firstColor,
        buySelectedColor: firstColor
      });
    })
  },

  // 选择颜色
  selectColor(e) {
    this.setData({
      selectedColor: e.currentTarget.dataset.color
    });
  },

  // 显示加入购物车弹窗
  showAddCartModal() {
    this.setData({
      showCartModal: true,
      cartSelectedColor: this.data.selectedColor
    });
  },

  // 隐藏加入购物车弹窗
  hideAddCartModal() {
    this.setData({ showCartModal: false });
  },

  // 选择购物车颜色
  selectCartColor(e) {
    console.log(e)
    const colorObj = e.currentTarget.dataset.color
    if (this.data.showCommotydiList[this.data.index].color[colorObj].sum <= 0) {
      app.showModal('提示', '选择的商品库存不足!')
      return
    }
    this.setData({
      cartSelectedColor: e.currentTarget.dataset.color
    })
  },

  // 购物车数量变化
  onCartQuantityChange(e) {
    console.log(e)
    //数量应该 大于0 且 不高于商品库存
    const max = this.data.showCommotydiList[this.data.index].color[this.data.cartSelectedColor].sum
    if (e.detail > max) {
      app.showToast('库存不足', 'error')
      this.setData({
        cartQuantity: this.data.cartQuantity
      });
      return
    } else if (e.detail === 0) {
      app.showToast('至少购买1个', 'error')
      this.setData({
        cartQuantity: this.data.cartQuantity
      });
      return
    }
    this.setData({
      cartQuantity: e.detail
    });
  },

  // 确认加入购物车
  async confirmAddCart() {
    if (this.data.cartQuantity <= 0) {
      app.showModal('提示', '请选择商品数量')
      return
    }
    //生成购物单
    const commotydi = this.data.showCommotydiList[this.data.index]
    const shoppingCart = {
      commotydiName: commotydi.commotydiName,
      colorObjName: this.data.cartSelectedColor,
      color: commotydi.color[this.data.cartSelectedColor],
      commotydi_id: commotydi._id,
      Quantity: this.data.cartQuantity,//数量
      userOpenid: appData.merchant_info._openid,
      shoppingTemplate: commotydi?.shoppingTemplate || {}
    }
    // 这里调用加入购物车的API
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shopping_cart',
        data: shoppingCart
      }
    })
    if (!res.success) {
      app.showModal('提示', '加入购物车失败!')
      return
    }
    shoppingCart._id = res.data._id
    this.data.shoppingCart.push(shoppingCart)
    app.showToast('加入成功', 'success')
    this.hideAddCartModal();
  },

  // 显示购买弹窗
  showBuyModal() {
    const that = this
    //获取运费模版
    mall_utils.getShoppingTemplate(this.data.showCommotydiList[this.data.index].shopId).then(res => {
      that.setData({
        shoppingTemplate: res
      })
    })
    //获取收货地址
    mall_utils.getShoppingAdd(appData.merchant_info._openid).then(res => {
      that.setData({
        shoppingAdd: res.shoppingAdd,
        shoppingAddSelected: res.shoppingAddSelected
      })
    })
    this.setData({
      showBuyModal: true,
      buySelectedColor: this.data.selectedColor
    });
  },
  // 隐藏购买弹窗
  hideBuyModal() {
    this.setData({ showBuyModal: false });
  },

  // 选择购买颜色
  selectBuyColor(e) {
    const colorObj = e.currentTarget.dataset.color
    if (this.data.showCommotydiList[this.data.index].color[colorObj].sum <= 0) {
      app.showModal('提示', '选择的商品库存不足!')
      return
    }
    this.setData({
      buySelectedColor: e.currentTarget.dataset.color
    });
    if (this.data.distributionMode === 0) {
      this.getSelectedGoodsExpressFee()
    }
  },

  // 购买数量变化
  onBuyQuantityChange(e) {
    console.log(e)
    //数量应该 大于0 且 不高于商品库存
    const max = this.data.showCommotydiList[this.data.index].color[this.data.buySelectedColor].sum
    if (e.detail > max) {
      app.showToast('库存不足', 'error')
      this.setData({
        buyQuantity: this.data.buyQuantity
      });
      return
    } else if (e.detail === 0) {
      app.showToast('至少购买1个', 'error')
      this.setData({
        buyQuantity: this.data.buyQuantity
      });
      return
    }
    this.setData({
      buyQuantity: e.detail
    });
    if (this.data.distributionMode === 0) {
      this.getSelectedGoodsExpressFee()
    }
  },
  //获取已选择的 商品运费
  getSelectedGoodsExpressFee() {
    const that = this
    //构建订单信息
    const commotydi = this.data.showCommotydiList[this.data.index]
    const order = {
      //商品信息
      goodsList: [{
        goodsId: commotydi._id,
        goodsName: commotydi.commotydiName,
        goodsHeadPic: commotydi.headPic,
        goodsColor: commotydi.color[this.data.buySelectedColor].color,
        goodsColorObjName: this.data.buySelectedColor,
        goodsQuantity: this.data.buyQuantity,
        goodsPrice: commotydi.color[this.data.buySelectedColor].merchantPrice,
        goodsSort: commotydi.sort,
        shoppingTemplate: this.data.showCommotydiList[this.data.index].shoppingTemplate
      }]
    }
    //这里应该 根据模版 获取运费价格
    mall_utils.getExpressFee(order, this.data.shoppingTemplate).then(res => {
      that.setData({
        expressFee: res
      })
    })
  },
  // 选择地址
  selectAddress(e) {
    console.log(e)
    const shoppingAddSelected = this.data.shoppingAdd.length > 0 ? this.data.shoppingAddSelected : -1
    const that = this
    wx.navigateTo({
      url: `../shoppingAddManage/shoppingAddManage?index=${shoppingAddSelected}`,
      events: {
        upData: (res) => {
          that.setData({
            shoppingAddSelected: res.shoppingAddSelected,
            shoppingAdd: res.shoppingAdd
          });
        }
      },
      success: function (res) {
        res.eventChannel.emit('gaveData', {
          shoppingAdd: that.data.shoppingAdd,
          shoppingAddSelected: that.data.shoppingAddSelected
        })
      }
    });
  },
  // 支付方式变化
  onPaymentChange(e) {
    console.log(e)
    if (this.data.distributionMode === 1 && e.currentTarget.dataset.name === 'cod') {
      app.showModal('提示', '自提无法物流代收,请选择微信支付')
      return
    }
    this.setData({
      paymentMethod: e.currentTarget.dataset.name
    });
  },

  // 备注变化
  onRemarksChange(e) {
    this.setData({
      remarks: e.detail
    });
  },
  async resell(e) {//一键转售 
    let shopType = 'shopMall'
    const typeRes = await wx.showModal({
      title: '请选择转售方式.',
      content: '',
      confirmText: '店铺售卖',
      cancelText: '商城售卖'
    })
    const goodsInfo = JSON.parse(JSON.stringify(this.data.showCommotydiList[this.data.index]));
    console.log(goodsInfo)
    delete goodsInfo._id
    //是否店铺售卖
    if (typeRes.confirm) {
      await this.shopSellResell(goodsInfo)
      return
    }
    goodsInfo.source = 1
    goodsInfo.shopId = appData.shop_account._id
    goodsInfo.shoppingTemplate = {}//清空运费组
    //把所有颜色数量置0
    for (let key in goodsInfo.color) {
      goodsInfo.color[key].sum = 0
    }
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_mall',
        data: goodsInfo
      }
    })
    if (!res.success) {
      app.showModal('提示', '上传数据时失败!')
      return
    }
    app.showModal('提示', '一键代卖成功!')
  },
  //店铺售卖 转售
  async shopSellResell(goodsInfo) {
    const newCommotidy = {
      picId: goodsInfo.headPic,
      name: goodsInfo.commotydiName,
      class: goodsInfo.sort,
      units: goodsInfo.unit,
      primeCost: goodsInfo.lowMerchantPrice,
      sellCost: goodsInfo.lowOutPrice,
      sum: 0,
      lowSum: 0
    }
    //向服务器  提交新增数据
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_commotidy',
        data: {
          ...newCommotidy,
          shopId: appData.shop_account._id,
        }
      }
    })
    if (res.success) {
      app.showToast('转售成功!', 'success')
    } else {
      app.showToast('转售失败!', 'error')
    }
    return
  },
  // 确认订单
  async confirmOrder() {
    if (this.data.shoppingAdd.length < 1 || this.data.shoppingAddSelected < 0) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      });
      return;
    } else if (this.data.buyQuantity <= 0) {
      app.showModal('提示', '请选择商品数量')
      return
    }
    //构建订单信息
    const now = new Date()
    const commotydi = this.data.showCommotydiList[this.data.index]
    const order = {
      orderNum: zx.createOrderNum(now, 'official_mall'),
      userOpenid: appData.merchant_info._openid,
      shopId: commotydi.shopId,
      shoppingAdd: this.data.distributionMode ? {} : this.data.shoppingAdd[this.data.shoppingAddSelected],
      payMode: this.data.paymentMethod,//wx微信付款 cod物流代收
      orderState: 0,//0未支付,1待发货,2待收货,3完成,4售后,5取消订单
      distributionMode: this.data.distributionMode,//0快递,1自提
      merchantAdd: this.data.distributionMode ? this.data.merchantAdd : {},
      applyReturnStatus: 0,//售后状态, 0未申 1已申请退货 2已同意申请退货 3已拒绝退货 4已申请换货 5已同意换货 6已拒绝换货
      placeTime: now.getTime(),//下单时间
      placeTimeStr: app.getNowTime(now),
      remarks: this.data.remarks,//备注
      //商品信息
      goodsList: [{
        goodsId: commotydi._id,
        goodsName: commotydi.commotydiName,
        goodsHeadPic: commotydi.headPic,
        goodsColor: commotydi.color[this.data.buySelectedColor].color,
        goodsColorObjName: this.data.buySelectedColor,
        goodsQuantity: this.data.buyQuantity,
        goodsPrice: commotydi.color[this.data.buySelectedColor].merchantPrice,
        goodsSort: commotydi.sort
      }],
      log: [],
      sub_mch_id: mall_utils.sub_mchid,
      expressFee: 0,
    }
    //这里应该 根据模版 获取运费价格
    order.expressFee = this.data.expressFee * 100
    //获取订单总价
    order.orderAmount = mall_utils.getOrderTotalFee(order)
    order.log.push(`订单下单--${app.getNowTime(new Date())}--金额:${order.orderAmount / 100}--操作人:用户`)
    //下单
    const placeOrderRes = await app.callFunction({
      name: 'place_order_mall',
      data: {
        order: order
      }
    })
    console.log(placeOrderRes)
    if (!placeOrderRes.success) {//下单错误
      app.showModal('提示', '下单错误!')
      throw 'ERROR ---placeOrderError'
    }

    //支付  判断是否需要支付
    if (order.payMode === 'wx') {
      const payRes = await app.new_pay(
        order.orderAmount,
        '店铺购物',
        mall_utils.sub_mchid,
        order.orderNum,
        order.userOpenid
      )
      if (!payRes) {
        app.showModal('支付失败!请在购物记录处进行重新付款,超时未付款订单将会被取消.')
        this.setData({
          showBuyModal: false
        })
        app.showModal('提示', '支付失败,请到我的订单处继续支付.超时未支付订单将被取消.')
        throw 'error payError'
      }
      //付款成功  检测付款是否成功!
      const queryPayStatus = await zx.inquirePayState(app.callFunction, order.orderNum, mall_utils.sub_mchid)
      console.log(queryPayStatus)
      if (queryPayStatus.data.trade_state !== 'SUCCESS') {//支付成功
        app.showModal('提示', '支付失败!请在购物记录处进行重新付款,超时未付款订单将会被取消.')
        throw 'error payError'
      }
    }

    //修改订单状态 为已支付
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'user_mall_order',
        query: {
          orderNum: order.orderNum
        },
        upData: {
          orderState: 1
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '付款成功信息修改失败,请到已购买列表中刷新付款状态.')
      return
    }
    this.setData({
      showBuyModal: false
    })
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
    console.log('页面卸载')
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('acceptDataFromOpenedPage', this.data.shoppingCart)
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