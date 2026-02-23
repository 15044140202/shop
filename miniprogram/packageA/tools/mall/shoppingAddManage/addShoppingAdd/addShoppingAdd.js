// pages/tools/mall/shoppingAddManage/addShoppingAdd/addShoppingAdd.js
const app = getApp()
const appData = app.globalData;
const mall_utils = require('../../mall_utils')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shoppingAdd: [],
    shoppingAddSelected:-1,
    editData:{
      defaultAdd:false
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('gaveData', res => {
      that.setData({
        shoppingAdd:res.shoppingAdd,
        shoppingAddSelected:res.index
      })
      if(res.index > -1){
        that.setData({
          editData:that.data.shoppingAdd[that.data.shoppingAddSelected]
        })
      }
    })
  },
  // 选择地区
  chooseRegion() {
    wx.chooseLocation({
      success: (res) => {
        console.log(res)
        const address = res.address;
        this.setData({
          ['editData.address']: address,
          ['editData.detail']: res.name || ''
        });
      }
    });
  },
  // 保存地址
  async saveAddress(e) {
    console.log(e)
    const formData = e.detail.value;
    const { name, phone , detail , defaultAdd } = formData;
    const address = this.data.editData.address
    if (!name || !phone || !address || !detail) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    const newAddress = {
      name,
      phone,
      address,
      detail,
      defaultAdd,
      userOpenid:appData.merchant_info._openid
    };


    if (this.data.shoppingAddSelected === -1) {
      // 如果是新增且设置为默认，取消其他默认
      if (defaultAdd) {
        await mall_utils.cancelDefaultAdd(this.data.shoppingAdd)
      }
      this.data.shoppingAdd.push(newAddress);
    } else {
      // 如果是编辑且设置为默认，取消其他默认
      await mall_utils.cancelDefaultAdd(this.data.shoppingAdd)
      Object.assign(this.data.shoppingAdd[this.data.shoppingAddSelected],newAddress)
    }
    //保存新增或者 编辑的地址
    await this.saveAdd()
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('upData',that.data.shoppingAdd)
    wx.navigateBack();
  },
  //保存或者编辑 的地址
  async saveAdd(){
    const shoppingAddSelected = this.data.shoppingAddSelected
    if(shoppingAddSelected === -1){//新增收货地址
      const res = await app.callFunction({
        name:'addRecord',
        data:{
          collection:'shopping_add',
          data:this.data.shoppingAdd[this.data.shoppingAdd.length - 1]
        }
      })

      if(!res.success){
        app.showModal('提示','新增收货地址失败!')
        return
      }
      this.data.shoppingAdd[this.data.shoppingAdd.length - 1]._id = res.data._id
      app.showToast('新增成功!','success')
      return
    }else{//修改
      const shoppingAdd = this.data.shoppingAdd[this.data.shoppingAddSelected]
      const _id = shoppingAdd._id
      delete shoppingAdd._id
      const res = await app.callFunction({
        name:'upDate',
        data:{
          collection:'shopping_add',
          query:{
            _id:_id
          },
          upData:shoppingAdd
        }
      })
      if(!res.success){
        app.showModal('提示','新增收货地址失败!')
        return
      }
      shoppingAdd._id = _id
      app.showToast('新增成功!','success')
      return
    }
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