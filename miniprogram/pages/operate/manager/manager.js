// pages/operate/manager/manager.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_account:undefined ,
    shop_table: [],
    price: appData.tableYearCost
  },
  async shortMsgTopUp() {
    const now = new Date()
    const nowTime = app.getNowTime(now)
    //生成订单
    const orderNum = app.createOrderNum(new Date(nowTime), 'shortMsgTopUp')
    const amount = 50; //订单金额
    //支付
    const payRes = await app.pay(amount, '短信获取费', appData.my_sub_mchid, orderNum);
    console.log(payRes)
    if (payRes !== 'ok') {
      return;
    }
    //支付成功  修改用户余额
    const res = await app.callFunction({
      name: 'record_inc',
      data: {
        collection: 'shop_account',
        query: {
          _id: appData.shop_account._id
        },
        record: 'shortMsgDegree',
        amount: 1000
      }
    })
    console.log(res)
    if (res.success) {
      //添加商家账单
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'shop_order',
          data: {
            orderName:'获取短信充值',
            orderNum: orderNum,
            amount: amount,
            time: now.getTime(),
            shopId: appData.shop_account._id,
            status: appData.status
          }
        }
      })
      console.log(res)
      app.showToast('提示', '充值成功!')
            appData.shop_account.shortMsgDegree += 1000
      this.setData({
        ['shop_account']: appData.shop_account
      })
      console.log(appData.shop_account.shortMsgDegree)
      return;
    } else {
      app.showModal('提示', '充值失败,稍后查看,如已成功扣费未到账请联系客服!')
      return;
    }
  },
  //桌台续费函数
  async payTableCost(e) {
    console.log(e)
    const tableData = this.data.shop_table;
    const oneMonth = 30 * 24 * 60 * 60 * 1000
    const oneYear = 365 * 24 * 60 * 60 * 1000
    const nowTime = new Date().getTime();
    const tableIndexArray = [];
    if (e.mark.index === 'all') { //续费全部期限不足一个月的 桌台
      tableData.forEach((item, index) => {
        const thisEndTime = new Date(item.useEndTime).getTime()
        if (thisEndTime - nowTime <= oneMonth) {//判断桌台费剩余少于1个月
          tableIndexArray.push({
            thisTableIndex: index,
            tableNum: item.tableNum,
            useEndTime: app.getNowTime(new Date(thisEndTime >= nowTime ? thisEndTime + oneYear : nowTime + oneYear))
          })
        }
      })
    } else { //续费指定桌台
      const thisEndTime = new Date(tableData[parseInt(e.mark.index)].useEndTime).getTime()
      const thisTableNum = tableData[parseInt(e.mark.index)].tableNum
      tableIndexArray.push({
        thisTableIndex: parseInt(e.mark.index),
        tableNum: thisTableNum,
        useEndTime: app.getNowTime(new Date(thisEndTime >= nowTime ? thisEndTime + 365 * 24 * 60 * 60 * 1000 : nowTime + 365 * 24 * 60 * 60 * 1000))
      })
    }
    console.log(tableIndexArray)
    if (tableIndexArray.length === 0) {
      app.showModal('提示', '没有需要续费的桌台!')
      return
    }
    //生成订单
    const orderNum = app.createOrderNum(new Date(nowTime), 'tableYearCost')
    const amount = this.data.price * tableIndexArray.length; //订单金额
    //支付
    const payRes = await app.pay(amount, '桌台年费', appData.my_sub_mchid, orderNum);
    console.log(payRes)
    if (!payRes || payRes === 'error') {
      app.showToast('支付失败!','error')
      return;
    }
    //下单
    const re = await app.callFunction({
      name: 'payMerchantTableCost',
      data: {
        shopId: appData.shop_account._id,
        tableDataArray: tableIndexArray,
        orderNum: orderNum,
        amount: amount,
        time: app.getNowTime(new Date(nowTime))
      }
    })
    if (re.success) {//数据写入成功
      tableIndexArray.forEach(item => {
        this.setData({
          [`shop_table[${item.thisTableIndex}].useEndTime`]: item.useEndTime
        })
      })
      app.showModal('提示', '续费成功!')
      return;
    } else {//数据写入错误
      app.showToast('提示', '续费失败!稍后如支付未到账,请联系客服人员!')
      return;
    }
  },
  //删除桌台
  async deleteTable(e) {
    console.log(e)
    const msgRes = await wx.showModal({
      title: '提示',
      content: `确认删除${this.data.shop_table.length}号桌台吗?*删除后不可恢复.*删除后剩余年费不退.*删除桌台只能从后往前删除.`
    })
    if (msgRes.cancel) return
    //执行删除
    const res = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'shop_table',
        query: {
          shopId: appData.shop_account._id,
          tableNum: this.data.shop_table.length
        }
      }
    })
    if (!res.success) {
      app.showModal('提示', '删除失败!')
    }
    app.showModal('提示', '删除成功!')
    this.data.shop_table.pop()
    this.setData({
      shop_table: this.data.shop_table
    })
  },
  //添加桌台函数
  async addNewTable() {
    const newTable = {
      shopId: appData.shop_account._id,
      ONOFF: 0,
      channel: `A${(this.data.shop_table.length + 1).toString().padStart(2, '0')}`,
      chargingId: '',
      closeTableTime: 0,
      lightName: '',
      orderForm: '',
      tableName: '预览桌台',
      tableNum: this.data.shop_table.length + 1,
      useEndTime: app.getNowTime(),
      version: 0
    };
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_table',
        data: newTable
      }
    });
    console.log(res)
    if (res.success === true) {
      app.showToast('添加成功', 'success');
      this.data.shop_table.push(newTable)
      this.setData({
        shop_table: this.data.shop_table
      })
    } else {
      app.showToast('添加失败!', 'error')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
    this.setData({
      shop_account:appData.shop_account,
      shop_table:appData.shop_table
    })
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
    return appData.globalShareInfo;
  }
})