// pages/utils/utils.js
let app = getApp()
let appData = app.globalData
Page({
  /**
   * 页面的初始数据
   */
  data: {
    //假期 oEIwT7eJH_l_99F5uqDcxWm8vwEw
    officialMallManagerOpenid: [],
    isofficialMallManager: false,
    shopMallManagerOpenid: [],
    isShopMallManager: false,
  },
  async goto(e) {
    console.log(e)
    var itemType = 'set';
    var itemName = '';
    switch (e.mark.item) {
      case 'vipManage':
        itemName = '会员档案设置';
        break;
      case 'shortMassageSend':
        itemName = '短信设置及群发';
        break;
      case 'amountBook':
        itemName = '店铺小账本';
        break;
      case 'tableManage':
        itemName = '计费规则及桌台档案'
        break
      case 'orderList':
        itemName = '缴费记录'
        break
      case 'shop_power':
        itemType = 'systemSet'
        itemName = '灯控器设置'
        break
      case 'recuit':
        itemName = '店铺招聘'
        break
    }
    if (!itemName) { //不鉴别权限的项目

    } else {
      console.log({ [itemType]: itemName })
      if (!await app.power(itemType, itemName)) {
        app.showToast('没有权限', 'error');
        return;
      }
    }
    let url
    if (['amountBook', 'shortMassageSend', 'vipManage'].includes(e.mark.item)) {//账本  短信 会员管理
      url = `../set/${e.mark.item}/${e.mark.item}`
    } else if (['tableManage'].includes(e.mark.item)) {//桌台管理
      url = `../operate/manager/manager`
    } else if (['orderList'].includes(e.mark.item)) {//缴费记录
      url = `./orderList/orderList`
    } else if (e.mark.item === 'shop_power') {//电源管理
      url = '../set/sysSte/deviceManage/lightCtrl/lightCtrl'
    } else if (e.mark.item === 'recuit') {//招聘
      url = './recruit/recruit'
    } else if (e.mark.item === 'mall') {//店铺商城
      appData.malltype = 'shop'
      url = './mallManage/mallManage?mallType=shop'
    } else if (e.mark.item === 'officialMall') {//官方商城
      if (e.mark.mallType === 'mall') {//官方商城
        url = './mall/mall?mallType=official'
      } else {//官方商城管理
        appData.malltype = 'official'
        url = './mallManage/mallManage?mallType=official'
      }
    } else if(e.mark.item === 'firendCircle_manager'){//球友圈管理
      url = './firendCircle_manager/firendCircle_manager'
    }
    wx.navigateTo({
      url: url,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取商城管理员

  },
  async getMallManager() {
    const res = app.callFunction({
      name: 'getOrInsertData',
      data: {
        collection: 'shop_mall_manager',
        query: {
          shopId: '11111111111111111111'
        },
        dataToInsert: {
          shopId: '11111111111111111111',
          manager: [],
          customerService: [],
          logistics: [],
          afterSale: []
        }
      }
    })
    const res1 = app.callFunction({
      name: 'getOrInsertData',
      data: {
        collection: 'shop_mall_manager',
        query: {
          shopId: appData.shop_account._id
        },
        dataToInsert: {
          shopId: appData.shop_account._id,
          manager: [],
          customerService: [],
          logistics: [],
          afterSale: []
        }
      }
    })
    const task = [res, res1]
    const prmires = await Promise.all(task)
    console.log(prmires)
    if (!prmires[0].success || !prmires[1].success) {
      app.showModal('提示!', '获取商城管理员权限失败')
      return
    }
    //官方商城
    const manager1 = prmires[0].data[0] ?? {}
    if ('manager' in manager1) {
      manager1.manager.push({ name: '管理员', userOpenid: 'oEIwT7UsIyN5FPHry3F6jUBXAm1A' })
    } else {
      manager1.manager = [{ name: '管理员', userOpenid: 'oEIwT7UsIyN5FPHry3F6jUBXAm1A' }]
    }
    //官方商城信息整理
    appData.officialMallManager = manager1
    for (const key in manager1) {
      if (!Array.isArray(manager1[key])) continue
      manager1[key].forEach(item => {
        this.data.officialMallManagerOpenid.push(item.userOpenid)
      })
    }
    if (this.data.officialMallManagerOpenid.includes(appData.merchant_info._openid)) {//官方商城
      this.setData({
        isofficialMallManager: true
      })
    }

    //店铺商城
    const manager = prmires[1].data[0] ?? {}
    console.log(manager)
    if ('manager' in manager) {
      manager.manager.push({ name: '老板', userOpenid: appData.shop_account._openid })
    } else {
      manager.manager = [{ name: '老板', userOpenid: appData.shop_account._openid }]
    }
    appData.shopMallManager = manager
    for (const key in manager) {
      if (!Array.isArray(manager[key])) continue
      manager[key].forEach(item => {
        this.data.shopMallManagerOpenid.push(item.userOpenid)
      })
    }
    //记录里面没有老板的  openid 的话 则添加
    if (!this.data.shopMallManagerOpenid.includes(appData.shop_account._openid)) {
      this.data.shopMallManagerOpenid.push(appData.shop_account._openid)//店铺商城
    }

    const shopMallManagerOpenid = this.data.shopMallManagerOpenid
    const myOpenid = appData.merchant_info._openid
    console.log(shopMallManagerOpenid.includes(myOpenid))
    //店铺商城
    this.setData({
      isShopMallManager: shopMallManagerOpenid.includes(myOpenid)
    })

    return
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
    console.log('onShow')
    appData = app.globalData
    this.data.officialMallManagerOpenid = []
    this.data.shopMallManagerOpenid = []
    this.getMallManager()
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