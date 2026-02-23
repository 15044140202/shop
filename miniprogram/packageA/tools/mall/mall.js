// pages/tools/mall/mall.js
const app = getApp();
const appData = app.globalData;
const zx = require('../../../utils/zx.js')
import Notify from '@vant/weapp/notify/notify';
// 商品标签优先级配置
const TAG_PRIORITY = {
  "新品上市": 1,
  "限时特惠": 2,
  "热销爆款": 3,
  "疯狂底价": 4,
  "耐用推荐": 5
};
Page({

  /**
   * 页面的初始数据
   */
  data: {
    //sort 1'自助设备',2'球桌',3'球杆',4'台呢',5'皮口',6'桌球子', 7'巧克粉',8'皮头',9'其他'
    categories: [
      { id: 1, name: '全部' },
      { id: 2, name: '自助设备' },
      { id: 3, name: '球桌' },
      { id: 4, name: '球杆' },
      { id: 5, name: '台呢' },
      { id: 6, name: '皮口' },
      { id: 7, name: '桌球子' },
      { id: 8, name: '巧克粉' },
      { id: 9, name: '皮头' },
      { id: 10, name: '其他' }
    ],

    mall_type: 'official',//商城类型 官方/店铺  official/shop
    commotydiList: [],//全部商品列表
    showCommotydiList: [],//展示的商品列表
    skip: 0,
    limit: 100,
    total: 99999,

    shoppingCart: []
  },
  goodsInfo(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: `./goodsInfo/goodsInfo?index=${e.mark.index}`,
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          console.log(data)
          that.setData({
            shoppingCart: data
          })
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('gaveData', {
          showCommotydiList: that.data.showCommotydiList,
          shoppingCart: that.data.shoppingCart
        })
      }
    })

  },
  //商品标签切换
  handleTabChange(e) {
    console.log(e)
    const sort = e.detail.title
    this.data.sort = sort
    let showList
    // 1. 先筛选出符合条件的商品
    if (sort === '全部') {
      showList = this.data.commotydiList
    } else {
      console.log({ 'sort': sort })
      showList = this.data.commotydiList.reduce((acc, item) => {
        if (item.sort.includes(sort) || item.commotydiName.includes(sort)) {
          acc.push(item)
        }
        return acc
      }, [])
    }

    // 2. 对筛选后的商品按标签优先级排序
    showList.sort((a, b) => {
      // 获取商品的最高优先级标签
      const getHighestPriority = (item) => {
        if (!item.tag || item.tag.length === 0) return Infinity // 没有标签的排最后
        let highest = Infinity
        item.tag.forEach(tag => {
          if (TAG_PRIORITY[tag.text] && TAG_PRIORITY[tag.text] < highest) {
            highest = TAG_PRIORITY[tag.text]
          }
        })
        return highest
      }

      const aPriority = getHighestPriority(a)
      const bPriority = getHighestPriority(b)

      // 都有标签按优先级排序，有标签的排前面
      return aPriority - bPriority
    })
    this.setData({
      showCommotydiList: showList
    })
    return
  },
  async getCommotydiList(skip, limit, shopId) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: skip,
        limit: limit,
        collection: 'shop_mall',
        query: {
          shopId: shopId,
        },
        orderBy: "time|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取商品信息错误!')
      throw 'ERROR --- 获取商品信息错误!'
    }
    this.data.commotydiList.push(...res.data.data)
    this.getLowPrice(this.data.commotydiList)
    this.setData({
      total: res.count.total,
      commotydiList: this.data.commotydiList,
    })
    this.handleTabChange(this.data.sort ? { detail: { title: this.data.sort } } : { detail: { title:'全部' } })
  },
  //获取产品所有颜色最低价格
  getLowPrice(goodsList) {
    goodsList.forEach(element => {
      let lowMerchantPrice = 999999999
      let lowOutPrice = 999999999
      for (const key in element.color) {
        const item = element.color[key]
        if (item.merchantPrice < lowMerchantPrice) lowMerchantPrice = item.merchantPrice
        if (item.outPrice < lowOutPrice) lowOutPrice = item.outPrice
      }
      element.lowMerchantPrice = lowMerchantPrice
      element.lowOutPrice = lowOutPrice
    })
  },
  //输入商品搜索内容
  input(e) {
    console.log(e)
    this.data.searchGoodsText = e.detail.value
  },
  //搜索商品
  searchGoods(e) {
    console.log(e)
    const sort = this.data.searchGoodsText
    console.log({ 'sort': sort })
    const showList = this.data.commotydiList.reduce((acc, item) => {
      if (item.sort.includes(sort) || item.commotydiName.includes(sort) || item.brand.includes(sort)) {
        acc.push(item)
      }
      return acc
    }, [])
    // 2. 对筛选后的商品按标签优先级排序
    showList.sort((a, b) => {
      // 获取商品的最高优先级标签
      const getHighestPriority = (item) => {
        if (!item.tag || item.tag.length === 0) return Infinity // 没有标签的排最后
        let highest = Infinity
        item.tag.forEach(tag => {
          if (TAG_PRIORITY[tag.text] && TAG_PRIORITY[tag.text] < highest) {
            highest = TAG_PRIORITY[tag.text]
          }
        })
        return highest
      }

      const aPriority = getHighestPriority(a)
      const bPriority = getHighestPriority(b)

      // 都有标签按优先级排序，有标签的排前面
      return aPriority - bPriority
    })
    this.setData({
      showCommotydiList: showList
    })
  },
  //我得订单
  myOrders() {
    wx.navigateTo({
      url: './myOrders/myOrders',
    })
  },
  //获取购物车信息
  async getShoppingcart() {
    const myOpenid = appData.merchant_info._openid
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shopping_cart',
        query: {
          userOpenid: myOpenid
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取购物车信息失败!')
      return
    }
    this.data.shoppingCart.push(...res.data)
    this.setData({
      shoppingCart: res.data
    })
  },
  gotoShoppingCart() {
    console.log('goto shoppingCart')
    const that = this
    wx.navigateTo({
      url: './shopping_cart/shopping_cat',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
          that.setData({
            shoppingCart: data
          })
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('gaveData', that.data.shoppingCart)
      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    this.data.mall_type = options.mallType
    if (options.mallType === 'shop') {
      this.data.shopId = appData.shopId_account._id
    } else {
      this.data.shopId = '11111111111111111111'
    }
    //获取商品列表
    this.getCommotydiList(this.data.skip, this.data.limit, this.data.shopId)
    //获取购物车信息
    this.getShoppingcart()
    Notify({ selector: '#custom-selector', duration: 5000, type: 'success', message: '商城商品信息正在完善中,如有需要商城里没有的商品请联系客服员,销售经理.' });
    app.showModal('微信提示', '商城商品信息正在完善中,如有需要商城里没有的商品请联系客服员,销售经理.')
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

    //分析剩余数量是否够一次加载的
    if (this.data.total <= this.data.commotydiList.length) return

    let limit = this.data.total - this.data.commotydiList.length >= this.data.limit ? this.data.limit : this.data.total - this.data.commotydiList.length
    this.data.goodsSkip = this.data.commotydiList.length

    this.getCommotydiList(this.data.goodsSkip, limit, this.data.shopId)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})