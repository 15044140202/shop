// pages/set/amountBook/statistic/statistic.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    class: [],
    classIndex: 0,
    month: '',
    disPlayOrder: [],
    disOrderType: '全部',
  },
  typeChange() {
    this.setData({
      disOrderType: this.data.disOrderType === '全部' ? '收入' : this.data.disOrderType === '收入' ? '支出' : '全部'
    })
    this.orderFilter(this.data.month,this.data.class[this.data.classIndex])
  },
  async orderFilter(month, className) {
    const allOrder = this.data.allOrder
    console.log(allOrder)
    //过滤月份
    let disPlayOrder = allOrder.filter((item) => {
      if (Object.keys(item).includes('date')) {
        const itemMonth = item.date.split("/")[1]
        if (itemMonth === month) {
          return true
        }
      }
      return false
    })
    console.log(disPlayOrder)
    //过滤用户 
    if (className !== '全部') {
      disPlayOrder = disPlayOrder.filter((item) => {
        if (item?.operater === className) {
          return true
        }
        return false
      })
    }
    console.log(disPlayOrder)
    //过滤类型
    const type = this.data.disOrderType
    if (type !== "全部") {
      disPlayOrder = disPlayOrder.filter((item) => {
        if (type === "支出" && item.orderType === 'expense') {
          return true
        }
        if (type === "收入" &&item.orderType === "income") {
          return true
        }
        return false
      })
    }
    this.computerAmount(disPlayOrder)
  },
  computerAmount(disPlayOrder) {
    console.log(disPlayOrder)
    const reversedTotals = [];
    let currentTotal = 0;
    // 倒序遍历原数组 
    for (let i = disPlayOrder.length - 1; i > -1; i--) {
      const order = disPlayOrder[i]
      console.log(order)
      currentTotal += Math.fround(parseFloat(order.amount)) ;
      order.totalAmount = (currentTotal).toFixed(2)
      reversedTotals.unshift(order);
    }
    console.log(reversedTotals)
    this.setData({
      disPlayOrder: reversedTotals
    })
  },
  getClase(allOrder) {
    const className = allOrder.reduce((acc, item) => {
      if (item?.operater && !acc.includes(item?.operater)) {
        acc.push(item.operater)
      }
      return acc
    }, [])
    className.unshift('全部')
    console.log(className)
    this.data.class = className
    this.setData({
      class: className
    })
  },
  onChange(e) {
    console.log(e)
    this.setData({
      classIndex: e.detail.index
    })
    this.orderFilter(this.data.month, this.data.class[e.detail.index])
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.data.month = options.month
    this.setData({
      month: options.month
    })
    const page = getCurrentPages()
    console.log(page)
    this.data.allOrder = page[1].data.allOrder
    this.getClase(this.data.allOrder)
    this.orderFilter(this.data.month, this.data.class[0])
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