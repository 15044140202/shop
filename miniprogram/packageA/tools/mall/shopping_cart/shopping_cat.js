// pages/tools/mall/shopping_cart/shopping_cat.js
const app = getApp()
const appData = app.globalData
const zx = require('../../../../utils/zx')
const mall_utils = require('../mall_utils')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shoppingCart: [],
    allGoodsInfo: [],

    allSelected: true,
    totalPrice: 0,
    selectedCount: 0,

    showBuyModal: false,//购买弹窗
    paymentMethod: 'wx',//支付方式选择 wx微信 cod快递代收
    remarks: '',
    distributionMode: 0,//0快递 1店铺自提
    distributionModeArr: ['快递配送', '门店自提'],
    //本店自取地址
    merchantAdd: {
      shopName: '长春市高新区仓库',
      address: '长春市高新区宜居路东北亚动漫产业园区9号楼',
      phone: '15204462555',
      latitude: 43.77112565448118,
      longitude: 125.21260249347685
    }
  },
  // 备注变化
  onRemarksChange(e) {
    this.setData({
      remarks: e.detail
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
  openLocation(e) {
    console.log(e)
    zx.openLocation(e.mark.latitude, e.mark.longitude)
  },
  distributionModeChange(e) {
    console.log(e)
    this.setData({
      distributionMode: parseInt(e.detail.value),
      paymentMethod: 'wx',
      expressFee: 0
    })
    if (this.data.distributionMode === 0) {
      this.getSelectedGoodsExpressFee()
    }
  },
  //获取已选择的 商品运费
  getSelectedGoodsExpressFee() {
    const that = this
    //构建订单信息
    const order = {
      //商品信息
      goodsList: this.data.shoppingCart.reduce((acc, item) => {
        if (item.selected) {
          acc.push(item)
        }
        return acc
      }, [])
    }
    //这里应该 根据模版 获取运费价格
    mall_utils.getExpressFee(order, this.data.shoppingTemplate).then(res => {
      that.setData({
        expressFee: res
      })
    })
  },
  //获取购物车里面的 全部商品信息
  async getCartGoodsInfo(shoppingCart) {
    const task = []
    shoppingCart.forEach(item => {
      task.push(
        app.callFunction({
          name: "getData_where",
          data: {
            collection: 'shop_mall',
            query: {
              _id: item.commotydi_id
            }
          }
        })
      )
    })
    const allRes = await Promise.all(task)
    const allGoods = allRes.reduce((acc, item) => {
      if (!item.success) {
        app.showModal('提示', '获取商品信息错误!')
      } else {
        acc.push(...item.data)
      }
      return acc
    }, [])
    this.setData({
      allGoodsInfo: allGoods
    })
  },
  //隐藏购买狂
  hideBuyModal() {
    console.log('隐藏支付界面')
    this.setData({
      showBuyModal: false
    })
  },
  // 切换商品选中状态
  toggleSelect(e) {
    const index = e.currentTarget.dataset.index;
    const cartList = this.data.shoppingCart;
    cartList[index].selected = !cartList[index].selected;

    this.setData({
      shoppingCart: cartList,
      allSelected: cartList.every(item => item.selected)
    }, () => {
      this.calculateTotal();
    });

  },

  // 切换全选状态
  toggleAllSelect() {
    const allSelected = !this.data.allSelected;
    console.log(this.data.shoppingCart)
    const shoppingCart = this.data.shoppingCart.map(item => {
      item.selected = allSelected;
      return item;
    });

    this.setData({
      shoppingCart,
      allSelected
    }, () => {
      this.calculateTotal();
    });
  },

  // 增加数量
  increaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const shoppingCart = this.data.shoppingCart;
    const max = this.data.allGoodsInfo[index].color[shoppingCart[index].colorObjName].sum

    if (shoppingCart[index].Quantity >= max) {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      });
      return;
    }

    shoppingCart[index].Quantity += 1;
    this.setData({
      shoppingCart
    }, () => {
      this.calculateTotal();
    });
  },

  // 减少数量
  decreaseQuantity(e) {
    const index = e.currentTarget.dataset.index;
    const shoppingCart = this.data.shoppingCart;

    if (shoppingCart[index].Quantity <= 1) {
      wx.showToast({
        title: '最少购买1件',
        icon: 'none'
      });
      return;
    }

    shoppingCart[index].Quantity -= 1;
    this.setData({
      shoppingCart
    }, () => {
      this.calculateTotal();
    });
  },

  // 显示删除确认对话框
  showDeleteConfirm(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;

    wx.showModal({
      title: '提示',
      content: '确定要删除这个商品吗？',
      success(res) {
        if (res.confirm) {
          that.deleteItem(index);
        }
      }
    });
  },

  // 删除商品
  async deleteItem(index) {
    const shoppingCart = this.data.shoppingCart;
    //删除数据库中的 购物车商品
    const res = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'shopping_cart',
        query: {
          _id: shoppingCart[index]._id
        }
      }
    })
    if (!res.success) {
      app.showModal('提示', '删除购物车物品失败!')
      return
    }
    shoppingCart.splice(index, 1);
    this.setData({
      shoppingCart,
      allSelected: shoppingCart.length > 0 && shoppingCart.every(item => item.selected)
    });
    this.calculateTotal();
  },

  // 计算总价和选中数量
  calculateTotal() {
    let totalPrice = 0;
    let selectedCount = 0;

    this.data.shoppingCart.forEach(item => {
      if (item.selected) {
        totalPrice += item.Quantity * item.color.merchantPrice;
        selectedCount += item.Quantity;
      }
    });

    this.setData({
      totalPrice: totalPrice,
      selectedCount
    });
  },
  //确认订单
  async confirmOrder() {
    const selectedGoodsList = this.data.shoppingCart.reduce((acc, item, index) => {
      if (item.selected) {
        acc.push({
          goodsId: item.commotydi_id,
          goodsName: item.commotydiName,
          goodsHeadPic: this.data.allGoodsInfo[index].headPic,
          goodsColor: item.color.color,
          goodsColorObjName: item.colorObjName,
          goodsQuantity: item.Quantity,
          goodsPrice: item.color.merchantPrice,
          goodsSort: this.data.allGoodsInfo[index].sort
        })
      }
      return acc
    }, []);
    console.log(selectedGoodsList)
    //构建订单信息
    const now = new Date()
    const order = {
      orderNum: zx.createOrderNum(now, 'official_mall'),
      userOpenid: appData.merchant_info._openid,
      shopId: '11111111111111111111',
      shoppingAdd: this.data.distributionMode ? {} : this.data.shoppingAdd[this.data.shoppingAddSelected],
      payMode: this.data.paymentMethod,//wx微信付款 cod物流代收
      orderState: 0,//0未支付,1待发货,2待收货,3完成,4售后,5取消订单
      distributionMode: this.data.distributionMode,//0快递,1自提
      merchantAdd: this.data.distributionMode ? this.data.merchantAdd : {},
      applyReturnStatus: 0,//售后状态, 0未申 1已申请退货 2已同意申请退货 3已拒绝退货 4已申请换货 5已同意换货 6已拒绝换货
      placeTime: now.getTime(),//下单时间
      placeTimeStr: app.getNowTime(now),
      remarks: this.data.remarks,
      //商品信息
      goodsList: selectedGoodsList,
      log: [`订单下单--${app.getNowTime(new Date())}--金额:${this.data.totalPrice / 100}--操作人:用户`],
      sub_mch_id: mall_utils.sub_mchid,
      expressFee: this.data.expressFee * 100//快递费
    }
    //这里应该根据运费模版 获取运费价格

    order.orderAmount = this.data.totalPrice + (order?.expressFee || 0)
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
    //删除购物车中 已购买的商品
    const query = this.data.shoppingCart.reduce((acc, item) => {
      if (item.selected) {
        acc.push({ _id: item._id })
      }
      return acc
    }, [])
    const deleteRes = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'shopping_cart',
        query: query
      }
    })
    if (!deleteRes.success) {
      app.showModal('提示', '删除购物车商品时出错!请在我的订单处检查是否已下单成功,避免重复购买.')
    }
    //支付 判断是否需要支付页
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
        this.returnMallIndexPage()
        app.showModal('提示', '支付失败,请到我的订单处继续支付.超时未支付订单将被取消.')
        throw 'error payError'
      }
      //付款成功  检测付款是否成功!
      const queryPayStatus = await zx.inquirePayState(app.callFunction, order.orderNum, mall_utils.sub_mchid)
      console.log(queryPayStatus)
      if (queryPayStatus.data.trade_state !== 'SUCCESS') {//支付成功
        app.showModal('提示', '支付失败!请在购物记录处进行重新付款,超时未付款订单将会被取消.')
        this.returnMallIndexPage()
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
      this.returnMallIndexPage()
      return
    }
    //代收单  提示用户下单一完成
    if (order.payMode === 'cod') {
      app.showModal('提示','订单下单成功!请注意查收快递,我的订单处可查看快递进度.')
    }
    this.returnMallIndexPage()
  },
  //返回mall主页面
  returnMallIndexPage() {
    this.data.shoppingCart = this.data.shoppingCart.reduce((acc, item) => {
      if (!item.selected) {
        acc.push(item)
      }
      return acc
    }, [])
    wx.navigateBack()
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
  // 结算 显示支付弹窗
  checkout() {
    if (this.data.selectedCount === 0) {
      wx.showToast({
        title: '请选择要购买的商品',
        icon: 'none'
      });
      return;
    }
    const that = this
    //获取收货地址
    mall_utils.getShoppingAdd(appData.merchant_info._openid).then(res => {
      that.setData({
        shoppingAdd: res.shoppingAdd,
        shoppingAddSelected: res.shoppingAddSelected
      })
    })
    //获取运费模版
    const goods = this.data.shoppingCart.find(item => item.selected)
    mall_utils.getShoppingTemplate(goods.shopId).then(res => {
      that.setData({
        shoppingTemplate: res
      })
      that.getSelectedGoodsExpressFee()
    })
    this.setData({
      showBuyModal: true
    })
    return
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    //上页传过来的  shoppingCart
    eventChannel.on('gaveData', data => {
      const shoppingCart = data.reduce((acc, item) => {
        acc.push({ ...item, selected: true })
        return acc
      }, [])
      that.setData({
        shoppingCart: shoppingCart,
        selectedCount: shoppingCart.length,
      })
      console.log(data)
      that.getCartGoodsInfo(data).then(res => {
        that.calculateTotal()
      })
    })
  },
  // 新增跳转到首页方法
  goToIndex() {
    wx.navigateBack()
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
    eventChannel.emit('upData', this.data.shoppingCart)
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