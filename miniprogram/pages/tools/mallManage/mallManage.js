// pages/tools/mall/mall.js
const app = getApp()
const appData = app.globalData
import Dialog from '@vant/weapp/dialog/dialog';
const mall_utils = require('../mall/mall_utils')
const zx = require('../../../utils/zx')
const _drowPriceOrder = require('./drowPriceOrder')
//商品种类 sort :0:球杆,1:巧克粉,2:皮头,3:手套,4:杆包,5:配件,6:其他
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
    //公用数据
    mallType: 'shop',//商城类型 官方/店铺  official/shop
    ismaneger: false,
    tabbaractive: 0,

    //商品列表数据
    commotydiList: [],//本店展示商品
    disPlayCommotydiList: [],//展示的商品
    goodsSkip: 0,
    goodsLimit: 100,
    goodsTotal: 0,
    goodsactive: 0,
    class: [],
    searchText: '',//商品列表搜索内容

    //销售记录数据
    searchOrderText: '',
    themeColor: '#0094ff',//按钮颜色
    salesRecordList: [],
    recordSkit: 0,
    recordLimit: 100,
    recordTotal: 0,
    tabs: [
      { title: '全部', status: 'all' },
      { title: '未支付', status: '0' },
      { title: '待发货', status: '1' },
      { title: '待收货', status: '2' },
      { title: '售后订单', status: 'after_sale' },
      { title: '已完成', status: '3' },
    ],
    recordActive: 0,
    filteredOrderList: []
  },
  tabbarOnChange(e) {
    console.log(e)
    if (e.detail === 0) {//商品列表
      this.setData({
        tabbaractive: e.detail
      })
    } else if (e.detail === 1) {//加载销售记录 数据
      //先清空现有销售记录
      this.data.salesRecordList = []
      this.getSalesRecord(this.data.recordSkit, this.data.recordLimit)
      this.setData({
        tabbaractive: e.detail
      })
    } else if (e.detail === 2) {//营业统计
      //判断权限
      if (!this.getMallPower(['manager'])) {
        app.showModal('提示', '只有管理员能查看报表!')
        return
      }
      wx.navigateTo({
        url: './mallStatement/mallStatement',
      })
    } else if (e.detail === 3) {//商城设置
      //判断权限
      if (!this.getMallPower(['manager'])) {
        app.showModal('提示', '只有管理员能进行设置!')
        return
      }
      wx.navigateTo({
        url: `./mallSet/mallSet?mallType=${this.data.mallType}`,
      })
    }


  },
  /**
   * @description 判断本人是不是商城指定的 人员角色
   * @param {array} powerType ['manager','server'] 角色类型
   * @returns {boolean} 是返回true 不是返回false
   */
  getMallPower(powerType) {
    const mallManager = this.data.mallType === 'official' ? appData.officialMallManager : appData.shopMallManager
    console.log(mallManager)
    const managerOpenid = []
    for (const key in mallManager) {
      if (powerType.includes(key)) {
        mallManager[key].forEach(item => {
          managerOpenid.push(item.userOpenid)
        })
      }
    }
    if (managerOpenid.includes(appData.merchant_info._openid)) {
      return true
    } else {
      return false
    }
  },
  //过滤商品搜索选项
  filterCommotydiList(searchText) {
    const SEARCHTEXT = searchText === "***" ? "" : this.data.searchText
    const commotydiList = this.data.commotydiList
    if (SEARCHTEXT) {
      const disCommotydiList = commotydiList.filter(item => {
        if (item.commotydiName.includes(SEARCHTEXT) || item.brand?.includes(SEARCHTEXT) || item?.sort?.includes(SEARCHTEXT)) {
          return true
        }
      })
      this.setData({
        disPlayCommotydiList: disCommotydiList,
        goodsactive: 0
      })
    } else {
      this.setData({
        disPlayCommotydiList: commotydiList,
      })
    }

  },
  //查看售后申请
  lookAfterSale(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: './aftersales/aftersales',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
          that.data.commotydiList.forEach(item => {
            if (item._id === data._id) {
              item = data
            }
          })
          that.filterOrders(that.data.recordActive)
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('giveData', that.data.filteredOrderList[e.mark.index])
      }
    })
  },
  //订单发货
  async transit(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: './transit/transit',
      events: {
        upData: function (data) {
          console.log(data)
          that.data.commotydiList.forEach(item => {
            if (item._id === data._id) {
              item = data
            }
          })
          that.filterOrders(that.data.recordActive)
        }
      },
      success: res => {
        res.eventChannel.emit('giveData', that.data.filteredOrderList[e.mark.index])
      }
    })
    return
  },
  //打电话
  callPhone(e) {
    wx.makePhoneCall({
      phoneNumber: e.mark.number,
    })
  },
  //复制地址
  copyAdd(e) {
    console.log(e)
    wx.setClipboardData({
      data: `姓名:${e.mark.shoppingAdd.name} 地址:${e.mark.shoppingAdd.address} 电话:${e.mark.shoppingAdd.phone}`,
      success(res) {
        app.showToast('复制成功', 'success')
      },
      fail(err) {
        console.error('复制失败', err)
      }
    })
  },
  //修改运费
  async amendExpressFee(e) {
    console.log(e)
    const order = this.data.filteredOrderList[e.mark.index]
    const res = await wx.showModal({
      title: '添加/修改运费',
      placeholderText: '请输入修改后的运费',
      editable: true,
    })
    const expressFee = zx.extractNumbers_d(res.content) * 100
    order.expressFee = expressFee
    console.log({ '修改后的运费': expressFee })
    //获取新的订单总价
    order.orderAmount = mall_utils.getOrderTotalFee(order)

    const upDateRes = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'user_mall_order',
        query: {
          _id: order._id
        },
        upData: {
          expressFee: expressFee,
          orderAmount: order.orderAmount
        }
      }
    })
    if (!upDateRes.success) {
      app.showModal('提示', '修运费格数据失败!')
      throw 'ERROR 修改运费数据失败'
    }
    //修改本地数据
    this.data.salesRecordList.forEach(item => {
      if (item._id === order._id) {
        item.expressFee = expressFee
      }
    })
    this.filterOrders(this.data.recordActive)
    app.showToast('操作成功!', 'success')
  },
  //修改价格
  async amendOrderAmount(e) {
    console.log(e)
    const order = this.data.filteredOrderList[e.mark.index]
    console.log(order)
    const res = await wx.showModal({
      title: '修改价格',
      placeholderText: '请输入修改后的价格',
      editable: true,
    })
    const newPrice = zx.extractNumbers(res.content) * 100
    console.log({ '修改后的价格:': newPrice })
    if (newPrice < 0) throw 'error newPrice is zero'

    const upDateRes = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'user_mall_order',
        query: {
          _id: order._id
        },
        upData: {
          orderAmount: newPrice
        }
      }
    })
    if (!upDateRes.success) {
      app.showModal('提示', '修改价格数据失败!')
      throw 'ERROR 修改价格数据失败'
    }
    //修改本地数据
    this.data.salesRecordList.forEach(item => {
      if (item._id === order._id) {
        item.orderAmount = newPrice
      }
    })
    this.filterOrders(this.data.recordActive)
    app.showToast('操作成功!', 'success')
  },
  //检测退款
  async checkRefund(e) {
    console.log(e)
    const order = e.currentTarget.dataset.order
    const refundOrder = order?.refund || []
    console.log(refundOrder)
    for (let item of refundOrder) {
      console.log(item)
      //检测订单退款情况
      const res = await zx.refundquery(app.callFunction, item.refundOrderNum, order.sub_mch_id,order.appid)
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

    return
  },
  //取消订单
  async cancelOrder(e) {
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
        oprater: '客服',
        changePayState: false
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '取消订单失败!请刷新重试,多次失败请联系客服!')
      throw 'ERROR -- 取消订单失败!请刷新重试,多次失败请联系客服!'
    }
    //修改本地数据
    this.data.salesRecordList.forEach(item => {
      if (item._id === order._id) {
        item.orderState = 5
      }
    })
    this.filterOrders(this.data.recordActive)
    app.showToast('操作成功!', 'success')
  },
  // 过滤订单类型
  onChange(e) {
    console.log(e)
    if (e.mark.item === 'goods') {//商品列表tabar
      this.filterCommotydiList("***")
      this.setData({
        goodsactive: e.detail.index
      })
      return
    }
    //订单列表tabar
    this.filterOrders(e.detail.index)
    this.data.recordActive = e.detail.index
  },
  //输入搜索内容
  searchInput(e) {
    console.log(e)
    if (e.mark.item === 'serachGoods') {
      this.data.searchText = e.detail.value
    } else if (e.mark.item === 'searchOrder') {
      this.data.searchOrderText = e.detail.value
    }

  },
  //按搜索内容搜索订单
  searchOrder(e) {
    console.log(e)
    this.filterOrders(0, this.data.searchOrderText)

    this.setData({
      recordActive: 0
    })
  },
  // 过滤订单
  filterOrders(tabIndex, searchText) {
    console.log(tabIndex)
    const { salesRecordList, tabs } = this.data;
    const status = tabs[tabIndex].status;
    let filtered = salesRecordList.filter(order => {
      // 根据标签筛选
      if (status === 'all') {//全部
        // 不筛选
      } else if (status === '0') {//待支付
        if (order.orderState !== 0) return false;
      } else if (status === '1') {//待发货
        if (order.orderState !== 1 && order.orderState !== 20) return false;
      } else if (status === '2') {//待收货
        if (order.orderState !== 2) return false;
      } else if (status === '3') {//已完成
        if (order.orderState !== 3) return false;
      } else if (status === 'after_sale') {//售后中
        if (order.orderState !== 4) return false;
      }
      //筛选搜索
      if (searchText) {
        if (!order.orderNum.includes(searchText) && !order.shoppingAdd.phone.includes(searchText) && !order.shoppingAdd.name.includes(searchText) && !order.shoppingAdd.name.includes(searchText)) {
          return false
        }
      }
      return true;
    });
    this.setData({ filteredOrderList: filtered });
  },
  async getSalesRecord(recordSkit, recordLimit) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: recordSkit,
        limit: recordLimit,
        collection: 'user_mall_order',
        query: {
          shopId: this.data.shopId,
        },
        orderBy: "placeTime|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取商品信息错误!')
      throw 'ERROR --- 获取商品信息错误!'
    }
    this.data.salesRecordList.push(...res.data.data)
    //排序 申请售后 和售后中的在前面
    this.data.salesRecordList.sort((a, b) => {
      if (a.applyReturnStatus > 0 && b.applyReturnStatus <= 0) return -1;  // a 排前面
      if (a.applyReturnStatus <= 0 && b.applyReturnStatus > 0) return 1;   // b 排前面
      return 0;  // 其他情况保持原顺序
    });
    this.setData({
      recordTotal: res.count.total,
      salesRecordList: this.data.salesRecordList
    })
    this.filterOrders(0)
  },
  //商品上架/下架
  async onSell(e) {
    console.log(e)
    const sellState = this.data.commotydiList[e.mark.index].sellState === 0 ? 1 : 0
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_mall',
        query: {
          _id: this.data.commotydiList[e.mark.index]._id
        },
        upData: {
          sellState: sellState
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '操作失败!')
      return
    }
    app.showModal('提示', '操作成功!')
    this.setData({
      [`commotydiList[${e.mark.index}].sellState`]: sellState
    })
  },
  async delete(e) {
    console.log(e)
    const that = this
    wx.showModal({
      title: '确认',
      content: `确定要删除${this.data.commotydiList[e.mark.index].commotydiName}吗?删除后不可恢复!`,
      complete: (res) => {
        if (res.cancel) {
          console.log('user cancel operate')
        }

        if (res.confirm) {
          if (that.getCommotydiTotalSum(that.data.commotydiList[e.mark.index]) !== 0) {
            app.showModal('提示', '商品数量不为0不能删除,请先清空库存后再删除!')
            return
          }
          const deleteId = that.data.commotydiList[e.mark.index]._id
          that.data.commotydiList.splice(e.mark.index, 1)
          that.setData({
            [`commotydiList`]: that.data.commotydiList
          })
          console.log(that.data.commotydiList)
          that.delete_save(deleteId)
          return
        }
      }
    })
  },
  getCommotydiTotalSum(commotydi) {
    let sum = 0
    for (const key in commotydi.color) {
      console.log(commotydi.color[key])
      sum += commotydi.color[key].sum
    }
    return sum
  },
  async delete_save(deletaId) {
    const res = await app.callFunction({ //修改数据库数据
      name: 'removeRecord',
      data: {
        collection: 'shop_mall',
        query: {
          _id: deletaId
        }
      }
    })
    res.success ? wx.showToast({
      title: '删除成功!',
      icon: 'success'
    }) : wx.showToast({
      title: '删除失败!',
      icon: 'error'
    })
    this.filterCommotydiList('***')
    return;
  },
  //补货
  async replenish(e) {
    console.log(e)
    const that = this;
    const index = this.data.commotydiList.findIndex(item => item._id === this.data.disPlayCommotydiList[e.mark.index]._id)
    if (index === -1) {
      app.showModal('提示', '系统错误!')
      return
    }
    wx.navigateTo({
      url: `./replenishCommotydi/replenishCommotydi?index=${index}&mallType=${this.data.mallType}`,
      events: {
        updata: function (params) {
          that.setData({
            commotydiList: params
          })
          console.log(that.data.commotydiList)
          that.computeClass(that.data.commotydiList)
        }
      },
      success: function (params) {
        params.eventChannel.emit('giveData', {
          data: that.data.commotydiList
        })
      }
    })
  },
  addCommotidy(e) {
    console.log(e)
    if (!e.mark.index && e.mark.index !== 0) return
    let disIndex = -1
    if (e.mark.index !== -1) {
      disIndex = this.data.commotydiList.findIndex(item => item._id === this.data.disPlayCommotydiList[e.mark.index]._id)
    }
    const that = this;
    wx.navigateTo({
      url: `./addNewCommotidy/addNewCommotidy?index=${disIndex}&mallType=${this.data.mallType}`,
      events: {
        updataToMallManage: function (params) {
          that.setData({
            commotydiList: params
          })
          console.log(that.data.commotydiList)
          that.computeClass(that.data.commotydiList)
        }
      },
      success: function (params) {
        params.eventChannel.emit('giveAddNewCommotydiData', {
          data: that.data.commotydiList
        })
      }
    })
  },
  async getShopAllCommotydi(goodsSkip, goodsLimit) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: goodsSkip,
        limit: goodsLimit,
        collection: 'shop_mall',
        query: {
          shopId: this.data.shopId,
        },
        orderBy: "_id|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取商品信息错误!')
      throw 'ERROR --- 获取商品信息错误!'
    }
    this.data.commotydiList.push(...res.data.data)
    this.setData({
      goodsTotal: res.count.total,
      commotydiList: this.data.commotydiList,
      disPlayCommotydiList: this.data.commotydiList,
    })
  },
  //收人换货 返货 发货
  confirmReturnGoods(e) {
    console.log(e)
    const order = this.data.filteredOrderList[e.mark.index]
    wx.navigateTo({
      url: './transit/transit?returnGoods=1',
      events: {
        upData: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', order)
      }
    })

  },
  //确认收货退款
  async confirmRfund(e) {
    console.log(e)
    //转到售后申请界面,根据售后申请时申请退款金额退款
    this.lookAfterSale(e)
  },
  //查询快递
  queryExpress(e) {
    console.log(e)
    wx.navigateTo({
      url: `./expressInfo/expressInfo?orderId=${this.data.filteredOrderList[e.mark.index]._id}`,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    this.setData({
      mallType: options.mallType,//商城类型 官方/店铺  official/shop
      shopId: options.mallType === 'shop' ? appData.shop_account._id : '11111111111111111111'
    })
    await this.getShopAllCommotydi(this.data.goodsSkip, this.data.goodsLimit)
    this.computeClass(this.data.commotydiList)
    this.setData({
      disPlayCommotydiList: this.data.commotydiList
    })
  },
  computeClass(commotydiList) {
    const newClass = []
    for (let index = 0; index < commotydiList.length; index++) {
      const element = commotydiList[index];
      if (!newClass.includes(element.sort)) {
        newClass.push(element.sort)
      }
    }
    newClass.sort((a, b) => {
      if (a === '其他') return 1;
      if (b === '其他') return -1;
    })
    newClass.unshift('全部')
    this.setData({
      class: newClass
    })
  },
  async getOneOrder({ orderNum, placeTime, _id }) {
    let query = {}
    if (orderNum) {
      query.orderNum = orderNum
    } else if (placeTime) {
      query.placeTime = placeTime
    } else if (_id) {
      query._id = _id
    } else {
      app.showModal('提示', '无有效查询参数!')
      throw 'error --- 无有效参数!'
    }
    //获取这个订单
    const order = this.data.salesRecordList.find(item => item.placeTime === placeTime || item._id === _id || item.orderNum === orderNum )
    if (order) {
      return order
    }
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'user_mall_order',
        query: query,
      }
    })
    if (!res.success && res.data.length > 0) {
      app.showModal('提示', '查询订单信息失败!')
      throw 'error 查询订单信息失败!'
    }
    return res.data[0]
  },
  //顾客到店取货
  async deliveryGoods() {
    // 允许从相机和相册扫码
    const res = await wx.scanCode({})
    console.log(res)
    if (res.errMsg !== 'scanCode:ok' || !res.result) {
      app.showModal('提示', '未获取到正确值!')
      return
    }
    const orderPlaceTime = parseInt(res.result)
    //获取这个订单
    const order = await this.getOneOrder({placeTime:orderPlaceTime})
    console.log(order)
    if (order.orderState !== 1) {
      app.showModal('提示','该订单非未取货订单!请协助刷新订单信息查看!')
      throw 'error -- 该订单非未取货订单!请协助刷新订单信息查看!'
    }

    let goodsListText = ''
    order.goodsList.forEach(item=>{
      goodsListText += `${item.goodsName} : ${item.goodsColor} -- ${item.goodsQuantity}\n`
    })
    await Dialog.confirm({
      title:'确认窗口',
      messageAlign:'left',
      message:`订单编号后5位 : ${order.orderNum.slice(-5)}\n货物列表 : \n${goodsListText}请确认订单及商品无误后点击确认交付,取消返回!`
    })

    const upDateRes = await app.callFunction({
      name: 'upDate',
      data: {
        collection: "user_mall_order",
        query: {
          orderNum: order.orderNum
        },
        upData: {
          orderState: 3
        },
        _push: {
          log: `用户到店取货--${app.getNowTime(new Date())}--操作人:${this.getOperater()}`
        }
      }
    })
    if (!upDateRes.success) {
      //上传发货数据失败!
      app.showModal('提示', '上传发货数据失败')
      return
    }
    app.showModal('提示', '操作成功!')
    return
  },
  getOperater() {
    for (let key in appData.officialMallManager) {
      const name = appData.officialMallManager[key]?.find?.(item =>
        item.userOpenid === appData.merchant_info._openid
      )?.name;
      if (name) {
        return name;
      }
    }
    return '店员'
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    //初始化Canvas
    _drowPriceOrder.onReady()
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
  async drowPriceIrder(e) {
    console.log(e)
    //先计算需要生成图片的商品
    const picArray = this.data.commotydiList.reduce((acc, item) => {
      if (item.sort === this.data.class[this.data.goodsactive] || this.data.class[this.data.goodsactive] === '全部') {
        acc.push(item)
      }
      return acc
    }, [])
    console.log(picArray)

    app.showLoading('绘画中')
    await _drowPriceOrder.generateQuotation(picArray.splice(0, 20))
    wx.hideLoading()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    switch (this.data.tabbaractive) {
      case 0://商品列表
        //分析剩余数量是否够一次加载的
        if (this.data.goodsTotal <= this.data.commotydiList.length) return

        let limit = this.data.goodsTotal - this.data.commotydiList.length >= this.data.goodsLimit ? this.data.goodsLimit : this.data.goodsTotal - this.data.commotydiList.length
        this.data.goodsSkip = this.data.commotydiList.length
        this.getShopAllCommotydi(this.data.goodsSkip, limit)
        break;
      case 1://销售记录
        //分析剩余数量是否够一次加载的
        if (this.data.recordTotal <= this.data.salesRecordList.length) return

        let recordLimit = this.data.recordTotal - this.data.salesRecordList.length >= this.data.recordLimit ? this.data.recordLimit : this.data.recordTotal - this.data.salesRecordList.length
        this.data.recordSkip = this.data.salesRecordList.length
        this.getShopAllCommotydi(this.data.recordSkip, recordLimit)
        break;
      case 2://营业统计

        break
    }


  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})