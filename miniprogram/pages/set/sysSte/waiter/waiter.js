// pages/set/sysSte/waiter/waiter.js
const app = getApp();
const appData = getApp().globalData;
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shop_member:app.shop_member,
    shop_member_set: appData.shop_member_set
  },
  set(e) {
    console.log(e.mark.mymark)
    wx.navigateTo({
      url: `./set/set?position=${e.mark.mymark}`,
    })
  },
  async delete(e) {
    const that = this
    console.log(e)
    Dialog.alert({
      title: '确认删除',
      message: this.data.shop_member[e.mark.index]?.name,
      showCancelButton: true,
    }).then(async() => {
      await that.deleteMerchantInfo(e.mark.index)
    }).catch(() => {
      return;
    });
  },
  //删除某助教
  async deleteGril(e){
    console.log(e)
    const member = this.data.shop_member[e.mark.index]
    const modalRes = await wx.showModal({
      title: '确认',
      content: `确认要删除该员工${member.userName}吗?`,
    })
    if (modalRes.cancel) {
      throw 'error --- user cancel oprate'
    }
    const res = await app.callFunction({
      name:'removeRecord',
      data:{
        collection:'shop_member',
        query:{
          _id:member._id
        }
      }
    })
    if (!res.success) {
      app.showModal('提示','删除失败!')
      return
    }
    //修改本地数据
    this.data.shop_member.splice(e.mark.index,1)
    this.setData({
      shop_member:this.data.shop_member
    })
    app.showToast('操作成功!','success')
    return
  },
  //设置助教工作时间
  setWorkTime(e){
    console.log(e)
    app.showToast('设置工作时间,请让员工在客户端设置','none')
  },
  girlSet(e){
    wx.navigateTo({
      url: './girlSet/girlSet',
    })
  },
  async deleteMerchantInfo(i) {
    console.log('开始删除店员')
    //首先 获取 店员的 merchantInfo  的 shopFlag数组
    console.log(this.data.shop_member[i].memberOpenid)
    const res = await app.callFunction({
      name: 'delete_shop_member',
      data: {
        userOpenid: this.data.shop_member[i].memberOpenid,
        shopId: this.data.shop_member[i].shopId,
      }
    })
    console.log(res)
    if(!res.success){
      app.showModal('提示','删除失败!')
      return
    }
    app.showModal('提示','删除成功!')
    this.data.shop_member.splice(i,1)
    this.setData({
      shop_member:this.data.shop_member
    })
  },
  add(e) {
    console.log(e)
    const that = this;
    wx.navigateTo({
      url: `./newWaiter/newWaiter?position=${e.mark.mymark}`,
      events: {
        updata: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.member)
      }
    })
  },
  //获取店铺员工数据
  async getShopMember(){
    const res = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'shop_member',
        query:{
          shopId:appData.shop_account._id
        }
      }
    })
    if(!res.success) {
      app.showModal('提示','回去员工数据失败!')
      return
    }
    console.log(res)
    this.setData({
      shop_member:res.data
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取现有权限测量

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    await this.getShopMember()

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