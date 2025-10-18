// pages/set/sysSte/waiter/girlSet/girlSet.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_member: [],
    genderOptions: ['男', '女']
  },
  //输入信息
  input(e){
    console.log(e)
    this.setData({
      [`shop_member[${e.mark.index}].${e.mark.item}`]: e.detail.value
    })
    this.data.shop_member[e.mark.index].isAmened = true
  },
  // 名称输入变化
  onNameChange: function (e) {
    console.log(e)
    const name = e.detail.value
    this.setData({
      [`shop_member[${e.mark.index}].nickname`]: name
    })
    this.data.shop_member[e.mark.index].isAmened = true
  },
  // 单价输入变化
  onPriceChange: function (e) {
    console.log(e)
    const price = Math.round(parseFloat(parseFloat(e.detail.value).toFixed(2)) * 100)
    console.log(price)
    this.setData({
      [`shop_member[${e.mark.index}].price`]: price
    })
    this.data.shop_member[e.mark.index].isAmened = true
  },
  // 性别选择变化
  onGenderChange: function (e) {
    console.log(e)
    const gender = this.data.genderOptions[e.detail.value]
    this.setData({
      [`shop_member[${e.mark.index}].gender`]: gender
    })
    this.data.shop_member[e.mark.index].isAmened = true
  },
  // 提交修改
  onSubmit: async function () {
    console.log('保存')
    console.log(this.data.shop_member)
    const submitDataArr = this.data.shop_member.reduce((acc,item)=>{
      if (item.isAmened) {
        const info =JSON.parse(JSON.stringify(item)) 
        delete info.isAmened
        acc.push(info)
      }
      return acc
    },[])
    if (submitDataArr.length < 1) {
      app.showToast('无更改数据!')
      return
    }
    console.log(submitDataArr)
    const task = []
    submitDataArr.forEach(item=>{
      const _id = item._id
      const info =JSON.parse(JSON.stringify(item)) 
      delete info._id
      task.push(
        app.callFunction({
          name:'upDate',
          data:{
            collection:'shop_member',
            query:{
              _id:_id
            },
            upData:info
          }
        })
      )
    })
    const res = await Promise.all(task)
    console.log(res)
    app.showToast('更新成功!','success')
    return
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 这里应该通过API获取助教详情，简化为从列表页获取
    const pages = getCurrentPages()
    const listPage = pages[pages.length - 2]
    console.log(listPage)
    this.setData({
      shop_member: listPage.data.shop_member
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