// pages/set/vipManage/vipDetail/amountChange/amountChange.js
const app = getApp()
const appData = app.globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    amountChange:[]
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel();
    const that = this ;
    eventChannel.on('giveData',async function(data) {
      console.log(data)
      that.setData({
        userOpenid:data.userOpenid,
        shopId:data.shopId
      })
      await that.getChange()
    })
  },
  async getChange(){
    const res = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'vip_amount_change',
        query:{
          shopId:this.data.shopId,
          userOpenid:this.data.userOpenid
        }
      }
    })
    console.log(res)
    const rr = res.data.reduce((acc,item)=>{
      if (typeof item.time === 'number') {
        item.time = app.getNowTime(new Date(item.time))
      }
      acc.push(item)
      return acc
    },[])
    this.setData({
      amountChange:rr.reverse()
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

  }
})