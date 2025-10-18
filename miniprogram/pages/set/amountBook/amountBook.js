// pages/set/amountBook/amountBook.js
const app = getApp()
const appData = app.globalData
Page({
  /**
   * 页面的初始数据
   */
  data: {
    allOrder: []
  },
  //转到统计页面
  statistic(e){
    console.log(e)
    wx.navigateTo({
      url: `./statistic/statistic?month=${e.mark.month}`,
    })
    


  },
  // 处理成带月份分隔的数组 
  processData(rawData) {
    //先清除日期数组
    rawData = rawData.filter(item => item.type !== 'month')
    console.log({ '清除日期:': rawData })

    let lastMonth = null
    return rawData.reduce((arr, item) => {
      //console.log(item)
      const currentMonth = item.date.substr(5, 2)
      if (currentMonth !== lastMonth) {
        arr.push({
          type: 'month',
          month: currentMonth,
          year: item.date.substr(0, 4)
        })
        lastMonth = currentMonth
      }
      item.amount = (item.amount / 100).toFixed(2)
      item.date = item.date.substr(0, 10)
      arr.push({ ...item, type: 'record' })
      return arr
    }, [])
  },
  async loadData(skip = 0) {
    const res = await app.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"shop_amount_book\").where({
            shopId:\"${appData.shop_account._id}\",
          }).orderBy(\"date\", \"desc\").limit(1000).skip(${skip}).get()`
      }
    })
    console.log(res)
    const reversedTotals = [];
    let currentTotal = 0;
    // 倒序遍历原数组 
    for (let i = res.data.length - 1; i >= 0; i--) {
      const order = JSON.parse(res.data[i]);
      currentTotal += order.amount;
      reversedTotals.unshift({ ...order, totalAmount: (currentTotal / 100).toFixed(2) });
    }
    console.log(reversedTotals)
    return reversedTotals
  },
  previewImage(e) {
    console.log(e)
    wx.previewImage({
      urls: [this.data.allOrder[e.mark.index].receip]
    })
  },
  showEditor() {
    const that = this
    wx.navigateTo({
      url: './editor/editor',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        acceptDataFromOpenedPage: function (data) {
          console.log(data)
          //以前的数据先 amount*100
          that.data.allOrder = that.data.allOrder.reduce((arr, item) => {
            item.amount *= 100
            arr.push(item)
            return arr
          }, [])
          that.data.allOrder.unshift(data)
          that.data.allOrder = that.processData(that.data.allOrder)
          console.log(that.data.allOrder)
          const reversedTotals = [];
          let currentTotal = 0;
          // 倒序遍历原数组 
          for (let i = that.data.allOrder.length - 1; i >= 0; i--) {
            const order = that.data.allOrder[i];
            if (order.type === 'record') {
              currentTotal += Number(order.amount);
              console.log('总:' + currentTotal)
              reversedTotals.unshift({ ...order, totalAmount: (currentTotal).toFixed(2) })
            }
          }
          that.setData({
            allOrder: reversedTotals
          })
        },
      },
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this
    this.loadData(0).then(res => {
      const allData = that.processData(res)
      that.setData({
        allOrder: allData
      })
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