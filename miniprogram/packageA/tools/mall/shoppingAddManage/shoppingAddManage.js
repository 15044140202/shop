// pages/tools/mall/shoppingAddManage/shoppingAddManage.js
const app = getApp()
const appData = app.globalData
const mall_js = require('../mall_utils')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shoppingAdd: [],
    shoppingAddSelected: 0,

    selected: false
  },
  // 删除地址
  async deleteAddress(e) {
    const index = e.currentTarget.dataset.index;
    const that = this;

    const res = await wx.showModal({
      title: '提示',
      content: '确定要删除这个地址吗？',
    });
    if (!res.confirm) {//取消返回
      return
    }
    const shoppingAdd = that.data.shoppingAdd;
    const RES = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'shopping_add',
        query: {
          _id: shoppingAdd[index]._id
        }
      }
    })
    if (!RES.success) {
      app.showModal('提示', '删除失败!')
      return
    }
    shoppingAdd.splice(index, 1);
    // 如果删除的是默认地址且还有其他地址，设置第一个为默认
    if (that.data.shoppingAdd[index].defaultAdd && shoppingAdd.length > 0) {
      //设置默认地址
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'shopping_add',
          qyery: {
            _id: shoppingAdd[0]._id
          },
          upData: {
            defaultAdd: true
          }
        }
      })
      shoppingAdd[0].defaultAdd = true;
    } else {
      shoppingAdd.splice(index, 1);
    }

    that.setData({
      shoppingAdd
    });

    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });

  },

  // 修改地址
  editAddress(e) {
    console.log(e)
    const that = this
    wx.navigateTo({
      url: './addShoppingAdd/addShoppingAdd',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
          that.setData({
            shoppingAdd: data
          })
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('gaveData', {
          shoppingAdd: that.data.shoppingAdd,
          index: e.currentTarget.dataset.index
        })
      }
    });
  },
  selectAdd(e) {
    this.data.selected = true
    console.log(e)
    const index = e.currentTarget.dataset.index
    const that = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('upData', {
      shoppingAdd: that.data.shoppingAdd,
      shoppingAddSelected: index
    })
    wx.navigateBack()
  },
  // 新增地址
  addNewAddress() {
    const that = this
    wx.navigateTo({
      url: './addShoppingAdd/addShoppingAdd',
      events: {
        // 为指定事件添加一个监听器，获取被打开页面传送到当前页面的数据
        upData: function (data) {
          console.log(data)
          that.setData({
            shoppingAdd: data
          })
        },
      },
      success: function (res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('gaveData', {
          shoppingAdd: that.data.shoppingAdd,
          index: -1
        })
      }
    });
  },
  // 设置默认地址
  async setDefault(e) {
    const index = e.currentTarget.dataset.index;
    const shoppingAdd = this.data.shoppingAdd;

    // 如果已经是默认地址，不做处理
    if (shoppingAdd[index].default) return;

    // 取消其他默认地址
    await mall_js.cancelDefaultAdd(shoppingAdd)
    shoppingAdd.forEach(item => {
      item.default = false;
    });

    // 设置当前为默认
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shopping_add',
        query: {
          _id: shoppingAdd[index]._id
        },
        upData: {
          defaultAdd: true
        }
      }
    })
    if (!res.success) {
      app.showModal('提示', '设置失败')
      return
    }
    shoppingAdd[index].defaultAdd = true;
    this.setData({
      shoppingAdd
    });

    wx.showToast({
      title: '设置默认成功',
      icon: 'success'
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    const taht = this
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('gaveData', data => {
      taht.setData({
        shoppingAdd: data.shoppingAdd,
        shoppingAddSelected: data.shoppingAddSelected
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
    if (!this.data.selected) {
      //如果点击返回  则返回默认地址 为选择地址
      console.log('监听页面卸载')
      const index = this.data.shoppingAdd.findIndex(item => item.defaultAdd)
      const that = this
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('upData', {
        shoppingAdd: that.data.shoppingAdd,
        shoppingAddSelected: index
      })
    }
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