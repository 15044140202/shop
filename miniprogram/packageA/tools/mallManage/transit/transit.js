// pages/tools/mallManage/transit/transit.js
const app = getApp()
const appData = app.globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: {},
    selectedGoods: [], // 选中的商品索引数组
    goodsMaxQuantities: [],//每种商品的最大可选择的数量
    goodsQuantities: {}, // 各商品发货数量 {index: quantity}
    shippedGoods: {}, // 已发货的商品数量 {index: shippedQuantity}
    expressCompany: '', // 快递公司
    expressNumber: '', // 快递单号
    remarks: '', // 发货备注
    expressOrders: [], // 该订单的所有物流单

    returnGoods: 0,//返货发货  0发货 1发货返货
    isAllSelected: false//是否全选
  },
  //更改 选择的商品数量
  handleGoodsSelectSumChange(e) {
    console.log(e)
    const max = this.getMaxGoodsSum(e.mark.index)
    //判断最大数量
    if (e.detail > max) {
      app.showModal('提示', '已达到最大发货数量')
      return
    }
    this.data.selectedGoods[e.mark.index] = e.detail
    this.setData({
      selectedGoods: this.data.selectedGoods
    })
  },
  // 选择商品
  handleGoodsSelect(event) {
    console.log(event)
    //判断选择的商品中 有无此下标的商品
    if (this.data.selectedGoods[event.mark.index]) {
      this.data.selectedGoods[event.mark.index] = 0
    } else {
      //此处应判断 是有未发的商品
      const maxSum = this.getMaxGoodsSum(event.mark.index)
      if (maxSum < 1) {
        app.showModal('提示', '该商品已全部发货.')
      }
      this.data.selectedGoods[event.mark.index] = maxSum
    }
    this.setData({
      selectedGoods: this.data.selectedGoods
    })
  },
  //获取指定商品可最大的发货数量
  getMaxGoodsSum(orderGoodsListIndex) {
    let max = this.data.order.goodsList[orderGoodsListIndex].goodsQuantity
    //减去已发货数量
    const goodsId = this.data.order.goodsList[orderGoodsListIndex].goodsId
    const goodsColorObjName = this.data.order.goodsList[orderGoodsListIndex].goodsColorObjName
    this.data.expressOrders.forEach(item => {
      const good = item.goodsList.find(finded => {
        if (finded.goodsId === goodsId && finded.goodsColorObjName === goodsColorObjName) {
          return true
        }
      })
      if (good) {
        if (!item.type) {//发货
          max -= good.goodsQuantity
        } else {//返货
          max += good.goodsQuantity
        }

      }
    })
    return max
  },
  // 快递公司输入
  onExpressCompanyChange(event) {
    this.setData({
      expressCompany: event.detail
    });
  },

  // 快递单号输入
  onExpressNumberChange(event) {
    this.setData({
      expressNumber: event.detail
    });
  },
  // 备注输入
  onRemarksChange(event) {
    this.setData({
      remarks: event.detail
    });
  },
  async getExpressNum() {
    //扫描单号
    const sacnRes = await wx.scanCode({
      scanType: ['barCode', 'pdf417']
    })
    console.log(sacnRes.result)
    this.setData({
      expressNumber: sacnRes.result
    })
  },
  // 提交发货
  async handleSubmit() {
    const { order, selectedGoods, expressCompany, expressNumber } = this.data;

    // 验证数据
    const total = selectedGoods.reduce((acc, item) => {
      acc += item
      return acc
    }, 0)
    if (total === 0) {
      app.showModal('提示', '请选择要发货的商品')
      return;
    }

    if (!expressNumber) {
      app.showModal('提示', '请输入快递单号')
      return;
    }
    // 获取选中的商品信息
    const shippingGoods = selectedGoods.map((item, index) => {
      if (item > 0) {
        const goods = order.goodsList[index];
        console.log(index)
        return {
          goodsId: goods.goodsId,
          goodsName: goods.goodsName,
          goodsHeadPic: goods.goodsHeadPic,
          goodsColor: goods.goodsColor,
          goodsColorObjName: goods.goodsColorObjName,
          goodsQuantity: item,
        };
      }
    });
    console.log(shippingGoods)
    // 生成发货时间
    const now = new Date();
    const timeStr = app.getNowTime(now)
    const expressOrder = {
      orderId: order._id,
      type: 0, // 0表示发货 1表示返货
      time: now.getTime(),
      timeStr: timeStr,
      expressCompany: expressCompany,
      expressNum: expressNumber,
      goodsList: shippingGoods,
      remarks: this.data.remarks
    }
    const orderState = this.allOrPortion() //要分析是不分发货 还是 全部发货

    const res = await app.callFunction({
      name: 'mall_transit',
      data: {
        order_id: order._id,
        orderState: orderState,
        expressData: expressOrder,
        operater: '客服'
      }
    })
    if (!res.success) {
      app.showModal('提示', '发货信息上传失败!')
      wx.navigateBack()
      return
    }
    //物流订单上传成功
    order.orderState = orderState
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('upData', order)
    wx.navigateBack()
  },
  //获取是全部发货  还是部分发货
  allOrPortion() {
    const orderGoodsList = this.data.order.goodsList

    for (let index = 0; index < orderGoodsList.length; index++) {
      const orderGoods = orderGoodsList[index];
      //商品总数
      const totalSum = orderGoods.goodsQuantity
      //已发货的数量
      const shippedSum = this.data.expressOrders.reduce((acc, item) => {
        const sum = item.goodsList.reduce((acc1, item1) => {
          if (item1._id === orderGoods._id && item1.goodsColorObjName === orderGoods.goodsColorObjName) {
            if (!item.type) {//发货
              acc1 += item1.goodsQuantity
            } else {//返货
              acc1 -= item1.goodsQuantity
            }
          }
          return acc1
        }, 0)
        acc += sum
        return acc
      }, 0)
      //本次发货数量
      const thisSum = this.data.selectedGoods[index] ? this.data.selectedGoods[index] : 0
      //这个商品 剩余未发货数量
      const residueSum = totalSum - shippedSum - thisSum
      console.log('剩余未发货数量:' + residueSum)
      if (residueSum > 0) return 20 //部分发货
    }
    console.log('已全部发货!')
    return 2 //全部发货
  },
  // 加载物流单数据
  async loadExpressOrders(orderId) {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'user_mall_order_express',
        query: {
          orderId: orderId
        }
      }
    })
    console.log(res)
    if (!res.success) {//加载错误
      await wx.showModal({
        title: '错误',
        content: '加载发货信息时出错',
      })
      wx.navigateBack()
    }
    this.setData({
      expressOrders: res.data
    })
  },

  // 计算已发货的商品数量
  calculateShippedGoods() {
    const { order, expressOrders } = this.data;
    const shippedGoods = {};//已发货数量

    // 累加所有物流单中的商品数量
    expressOrders.forEach(expressItem => {
      expressItem.goodsList.forEach(item => {
        console.log(item)
        if (!( `${item.goodsId}` in shippedGoods)) {
          shippedGoods[`${item.goodsId}`] ={}
        } 
        if (!expressItem.type) {//0发货  1返货
          shippedGoods[`${item.goodsId}`][`${item.goodsColorObjName}`] = item.goodsQuantity
        }else{//返货
          shippedGoods[`${item.goodsId}`][`${item.goodsColorObjName}`] = -item.goodsQuantity
        }
      })

    });

    this.setData({ shippedGoods });
  },
  // 全选按钮处理
  handleSelectAll() {
    console.log('全选')
    const that = this
    if (this.data.isAllSelected) {
      this.data.selectedGoods.forEach((item, index) => {
        that.data.selectedGoods[index] = 0
      })
      this.setData({
        selectedGoods: this.data.selectedGoods,
        isAllSelected: false
      })
    } else {
      const { order, shippedGoods } = this.data;
      const selectedGoods = [];
      order.goodsList.forEach((item, index) => {
        const max = that.getMaxGoodsSum(index)
        selectedGoods[index] = max
      })
      this.setData({
        selectedGoods: selectedGoods,
        isAllSelected: true
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.data.returnGoods = options?.returnGoods || 0 //返货发货  0发货 1发货返货
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('giveData', async data => {
      console.log(data)
      that.setData({
        order: data
      })
      // 加载该订单的所有物流单
      await that.loadExpressOrders(data._id);
      // 计算已发货的商品数量
      that.calculateShippedGoods();
      //计算左右商品的 最大可发货数量
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