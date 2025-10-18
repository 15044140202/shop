// pages/tools/mall/myOrders/myOrders.js
const app = getApp()
const appData = app.globalData
const zx = require('../../../../utils/zx')
const mall_utils = require('../mall_utils')
const barcode = require('wxbarcode'); // 直接引用
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderList: [],
    filteredOrderList: [], // 过滤后的订单数据
    activeTab: 0,
    skip: 0,
    limit: 50,
    total: 0,

    searchValue: '',
    themeColor: '#0094ff',
    tabs: [
      { title: '全部', status: 'all' },
      { title: '待支付', status: '0' },
      { title: '待发货', status: '1' },
      { title: '待收货', status: '2' },
      { title: '已完成', status: '3' },
      { title: '售后', status: 'after_sale' }
    ],
    pageLoading: false
  },
  //到店取货
  async takeDeliveryDoods(e) {
    console.log(e)
    const order = this.data.filteredOrderList[e.mark.index]
    wx.navigateTo({
      url: `./disBarCode/disBarCode?code=${order.placeTime}`,
    })

  },
  goShop(e){
    let order = this.data.filteredOrderList[e.mark.index]
    const shopAdd = order.merchantAdd
    wx.openLocation({
      latitude: shopAdd.latitude,    // 目标纬度（必填）
      longitude: shopAdd.longitude,  // 目标经度（必填）
      name:shopAdd.shopName,     // 位置名称（可选）
      address: shopAdd.address, // 详细地址（可选）
      scale: 18,             // 地图缩放级别（可选，默认18）
      success: () => {
        console.log("地图调起成功");
      },
      fail: (err) => {
        console.error("地图调起失败", err);
      }
    });
  },
  //删除订单
  async deleteOrder(e) {
    let order = this.data.filteredOrderList[e.mark.index]
    //退款前 应先刷新订单状态
    const thisOrder = await mall_utils.getOneOrder(app.callFunction, order._id)
    if (!thisOrder.success) {
      app.showModal('提示', '订单刷新失败!')
      return
    }
    console.log(thisOrder)
    order = thisOrder.data
    //分析是否符合退款条件 已支付 且 未发货和未取货 状态可退款
    if (order.orderState !== 5) {
      app.showModal('当前订单不可删除,非未支付状态订单!')
      throw 'ERROR -- 当前订单不可删除,非未支付状态订单!'
    }
    const confirm = await wx.showModal({
      title: '警告',
      content: '确定要删除该订单吗?删除后该订单一切记录均不可查询.如支付过的订单请不要删除!!!',
      showCancel: true
    })
    if (confirm.cancel) throw 'ERROR user cancel operate'//取消操作
    const res = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'user_mall_order',
        query: {
          _id: order._id
        }
      }
    })
    if (!res.success) {
      app.showModal('提示', '删除失败,请稍后再试.')
      return
    }
    //删除本地数据
    this.data.orderList = this.data.orderList.filter(item => item._id !== order._id)
    this.filterOrders(this.data.activeTab)
    app.showToast('删除成功', 'success')
  },
  //取消订单
  async cancelOrder(e) {
    let order = this.data.filteredOrderList[e.mark.index]
    //退款前 应先刷新订单状态
    const thisOrder = await mall_utils.getOneOrder(app.callFunction, order._id)
    if (!thisOrder.success) {
      app.showModal('提示', '订单刷新失败!')
      return
    }
    console.log(thisOrder)
    order = thisOrder.data
    //分析是否符合退款条件 已支付 且 未发货和未取货 状态可退款
    if (order.orderState !== 0) {
      app.showModal('当前订单不可取消,已支付状态!')
      throw 'ERROR -- 当前订单不可取消,已支付状态!'
    }
    const confirm = await wx.showModal({
      title: '提示',
      content: '确定要取消订单吗?',
      showCancel: true
    })
    if (confirm.cancel) throw 'ERROR user cancel operate'//取消操作

    //执行反下单
    const res = await app.callFunction({
      name: 'mall_order_refund',
      data: {
        order: order,
        oprater: '客户'
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '取消订单失败!请刷新重试,多次失败请联系客服!')
      throw 'ERROR -- 取消订单失败!请刷新重试,多次失败请联系客服!'
    }
    //修改本地数据
    this.data.orderList.forEach(item => {
      if (item._id === order._id) {
        item.orderState = 5
      }
    })
    this.filterOrders(this.data.activeTab)
    app.showModal('提示', '操作成功!')
  },
  //退货
  async returnGoods(e) {
    console.log(e)
    let order = this.data.filteredOrderList[e.mark.index]
    //退款前 应先刷新订单状态
    const thisOrder = await mall_utils.getOneOrder(app.callFunction, order._id)
    if (!thisOrder.success) {
      app.showModal('提示', '订单刷新失败!')
      return
    }
    console.log(thisOrder)
    order = thisOrder.data
    //分析是否符合退款条件 已支付 且 未发货和未取货 状态可退款
    if (order.orderState !== 1) {
      app.showModal('当前状态(已发货/已取货)下不支持退货,请在收到货后申请售后')
      throw 'ERROR -- 当前状态(已发货/已取货)下不支持退货,请在收到货后申请售后'
    }
    const confirm = await wx.showModal({
      title: '提示',
      content: '确定要退款并取消订单吗?',
      showCancel: true
    })
    if (confirm.cancel) throw 'ERROR user cancel operate'//取消操作

    //执行反下单
    const res = await app.callFunction({
      name: 'mall_order_refund',
      data: {
        order: order,
        oprater: '客户'
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '退款失败!请刷新重试,多次失败请联系客服!')
      throw 'ERROR -- 退款失败!请刷新重试,多次失败请联系客服!'
    }
    //修改本地数据
    this.data.orderList.forEach(item => {
      if (item._id === order._id) {
        item.orderState = 5
      }
    })
    this.filterOrders(this.data.activeTab)
    const refoundRes = await zx.refund(app.callFunction, order.orderAmount / 100, order.orderAmount / 100, order.orderNum, 'Refund' + order.orderNum, mall_utils.sub_mchid)
    console.log(refoundRes)
    if (refoundRes.data.result_code !== 'SUCCESS') {
      app.showModal('提示', '退款失败,请稍后重试.')
      return
    }
    app.showModal('提示', '退款成功,如未到账请联系客服!')
    return
  },
  async checkRefund(e) {
    console.log(e)
    const order = e.currentTarget.dataset.order

    const refundOrder = order?.refund || []
    for (let item of refundOrder) {
      console.log(item)
      //检测订单退款情况
      const res = await zx.refundquery(app.callFunction, item.refundOrderNum, order.sub_mch_id)
      if (res.data.result_code !== "SUCCESS") {
        const res = await wx.showModal({
          title: '提示',
          content: '该笔退款未完成!请选择继续操作',
          cancelText: '取消',
          confirmText: '退款'
        })
        if (res.cancel) continue
      } else if (res.data.result_code === "SUCCESS") {
        await wx.showModal({
          title: '提示',
          content: '该笔订单退款成功!',
        })
        continue
      }
      const refoundRes = await zx.refund(app.callFunction, order.orderAmount / 100, item.amount / 100, order.orderNum, item.refundOrderNum, order.sub_mch_id,order.appid)
      console.log(refoundRes)
      if (refoundRes.data.result_code !== 'SUCCESS') {
        await wx.showModal({
          title: '提示',
          content: refoundRes.data.err_code_des,
        })
        continue
      }
      await wx.showModal({
        title: '提示',
        content: '退款成功,如未到账请联系客服!',
      })
    }

  },
  pageLoading(show) {
    if (show) {
      this.setData({
        pageLoading: true
      })
    } else {
      this.setData({
        pageLoading: false
      })
    }
  },
  async getOrderList(skip, limit, userOpenid) {
    this.pageLoading(true)
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: skip,
        limit: limit,
        collection: 'user_mall_order',
        query: {
          userOpenid: userOpenid,
        },
        orderBy: "placeTime|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取商品信息错误!')
      throw 'ERROR --- 获取商品信息错误!'
    }
    this.data.orderList.push(...res.data.data)
    console.log(this.data.orderList)
    this.setData({
      total: res.count.total,
      orderList: this.data.orderList
    })
    this.pageLoading(false)
    this.filterOrders(this.data.activeTab, '')
  },
  // 切换标签
  onTabChange(event) {
    const { index } = event.detail;
    this.setData({ activeTab: index });
    this.filterOrders(index, this.data.searchValue);
  },

  // 搜索输入
  onSearchInput(event) {
    console.log(event)
    this.setData({ searchValue: event.detail });
    this.filterOrders(this.data.activeTab, event.detail);
  },

  // 搜索取消
  onSearchCancel() {
    console.log('取消搜索')
    this.setData({ searchValue: '' });
    this.filterOrders(this.data.activeTab, '');
  },

  // 过滤订单
  filterOrders(tabIndex, searchText) {
    console.log(searchText)
    const { orderList, tabs } = this.data;
    const status = tabs[tabIndex].status;
    let filtered = orderList.filter(order => {
      // 根据标签筛选
      if (status === 'all') {//全部
        // 不筛选
      } else if (status === '0') {//待支付
        if (order.orderState !== 0) return false;
      } else if (status === '1') {//待发货
        if (order.orderState !== 1) return false;
      } else if (status === '2') {//待收货
        if (order.orderState !== 2) return false;
      } else if (status === '3') {//已完成
        if (order.orderState !== 3) return false;
      } else if (status === 'after_sale') {//售后中
        if (order.orderState !== 4 && order.orderState !== 5) return false;
      }

      // 根据搜索文本筛选
      if (searchText) {
        const hasMatch = order.goodsList.some(goods => {
          if (goods.goodsName.includes(searchText) || goods?.goodsSort?.includes(searchText) || goods?.goodsColor?.includes(searchText)) {
            return true
          }
        })
        console.log(hasMatch)
        if (!hasMatch) return false;
      }
      return true;
    });
    this.setData({ filteredOrderList: filtered });
    //如果筛选出来的订单数量  少于5条  则直接加载更多
    if (filtered.length < 5) {
      this.loadMore()
    }
  },
  //返货发货
  async aftersaleTransit(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: './aftersalesTransit/aftersalesTransit',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('giveData', that.data.filteredOrderList[e.mark.index])
      }
    })
  },
  //查看物流往来信息
  lookExpressInfo(e) {
    console.log(e)
    wx.navigateTo({
      url: `./../../mallManage/expressInfo/expressInfo?orderId=${this.data.filteredOrderList[e.mark.index]._id}&client=1`,
    })
  },
  //查看退货进度
  lookApplyReturnStatus(e) {
    console.log(e)

  },
  // 跳转到订单详情
  goToOrderDetail(event) {
    const { order } = event.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orderDetail/orderDetail?orderNum=${order.orderNum}`,
    });
  },

  // 支付订单
  async payOrder(e) {
    const order = this.data.filteredOrderList[e.mark.index]
    //先查询支付状态
    const payRes = await zx.inquirePayState(app.callFunction, order.orderNum, mall_utils.sub_mchid)
    console.log(payRes)
    if (payRes.data.trade_state === 'SUCCESS') {
      app.showModal('提示', '该笔订单已经支付完成!')
      //到下面修改 数据库信息
    } else { //未支付完成  执行支付操作
      //更改该订单的 订单号
      const newOrderNum = zx.createOrderNum(new Date(), 'official_mall')
      order.orderNum = newOrderNum
      //新订单号同步到服务器
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'user_mall_order',
          query: {
            _id: order._id
          },
          upData: {
            orderNum: order.orderNum
          }
        }
      })
      if (!res.success) {
        app.showModal('提示', '创建新支付订单失败!')
        return
      }
      //支付
      const payRes = await app.new_pay(
        order.orderAmount,
        '店铺购物',
        mall_utils.sub_mchid,
        order.orderNum,
        order.userOpenid
      )
      if (!payRes) {
        app.showModal('支付失败!请在购物记录处进行重新付款,超时未付款订单将会被取消.')
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
    if (!res.success) {
      app.showModal('提示', '修改支付状态为已支付失败.请稍后尝试.')
      return
    }
    order.orderState = 1
    this.setData({
      [`filteredOrderList[${e.mark.index}]`]: order
    })
  },
  //查看售后详情
  aftersaleInfo(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: './aftersaleInfo/aftersaleInfo',
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.filteredOrderList[e.mark.index])
      },
    })
  },
  // 确认收货
  async confirmReceipt(e) {
    console.log(e)
    const order = this.data.filteredOrderList[e.mark.index]
    //修改服务器信息
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'user_mall_order',
        query: {
          _id: order._id
        },
        upData: {
          orderState: 3,//订单完成状态
          applyReturnStatus: 0//申请售后状态改为0
        }
      }
    })
    if (!res.success) {
      app.showModal('提示', '确认收货失败!请稍后再试.')
      throw 'error - confirm updata error.'
    }
    //修改本地数据
    this.data.orderList.forEach(item => {
      if (item._id === order._id) {
        item.orderState = 3
        item.applyReturnStatus = 0
      }
    })
    this.filterOrders(this.data.activeTab)
    app.showModal('提示', '确认收货成功!')
  },

  // 申请售后
  applyAfterSale(e) {
    console.log(e)
    const that = this
    const order = this.data.filteredOrderList[e.mark.index]
    //转跳至售后页面
    wx.navigateTo({
      url: './aftersales/aftersales',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
          for (let i = 0; i < that.data.orderList.length; i++) {
            if (that.data.orderList[i].orderNum === data.orderNum) {
              that.data.orderList[i] = data;
              break; // 直接中断
            }
          }
          that.filterOrders(that.data.activeTab)
        },
      },
      success: function (res) {
        res.eventChannel.emit('giveData', order)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    //获取本人订单
    this.getOrderList(this.data.skip, this.data.limit, appData.merchant_info._openid)

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
  loadMore() {
    //获取本人订单
    //分析剩余数量是否够一次加载的
    if (this.data.total <= this.data.orderList.length) return

    let limit = this.data.total - this.data.orderList.length >= this.data.limit ? this.data.limit : this.data.total - this.data.orderList.length

    this.data.skip = this.data.orderList.length
    this.getOrderList(this.data.skip, limit, appData.merchant_info._openid)
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('页面上拉触底事件的处理函数')
    this.loadMore()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})