// pages/tools/orderList/orderList.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  async loadOrderList() {
    const res = await app.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"shop_order\").where({
            shopId:\"${appData.shop_account._id}\"
          }).orderBy(\"time\", \"desc\").limit(1000).skip(0).get()`
      }
    })
    console.log(res)
    const orders = res.data.reduce((acc,item)=>{
      const order = JSON.parse(item)
      order.time = app.getNowTime(new Date(order.time))
      acc.push(order)
      return acc
    },[])
    this.setData({
      orders:orders
    })
    console.log(this.data.orders)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadOrderList()
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