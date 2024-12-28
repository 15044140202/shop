// pages/operate/manager/manager.js
const utils = require('../../../utils/light');
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    table_data: [],
    price: 1
  },
  //桌台续费函数
  async payTableCost(e) {
    console.log(e)
    const tableData = this.data.table_data;
    const nowTime = new Date().getTime();
    const tableIndexArray = [];
    if (e.mark.index === 'all') { //续费全部期限不足一个月的 桌台
      for (let index = 0; index < tableData.length; index++) {
        const element = tableData[index];
        const thisEndTime = new Date(element.useEndTime).getTime();
        if (thisEndTime - thisEndTime <= 30 * 24 * 60 * 60 * 1000) { //判断桌台费剩余少于1个月
          tableIndexArray.push({
            tableIndex: index,
            useEndTime: app.getNowTime(new Date(thisEndTime >= nowTime ? thisEndTime + 365 * 24 * 60 * 60 * 1000 : nowTime + 365 * 24 * 60 * 60 * 1000))
          })
        }
      }
    } else { //续费指定桌台
      const thisEndTime = new Date(tableData[parseInt(e.mark.index)].useEndTime).getTime();
      tableIndexArray.push({
        tableIndex: parseInt(e.mark.index),
        useEndTime: app.getNowTime(new Date(thisEndTime >= nowTime ? thisEndTime + 365 * 24 * 60 * 60 * 1000 : nowTime + 365 * 24 * 60 * 60 * 1000))
      })
    }
    console.log(tableIndexArray)
    //生成订单
    const orderNum = app.createOrderNum(new Date(nowTime), 'tableYearCost')
    const amount = this.data.price * tableIndexArray.length; //订单金额
    //支付
    const payRes = await app.pay(amount,'桌台年费',appData.my_sub_mchid,orderNum);
    console.log(payRes)
    if (payRes === 'error') {
      return;
    }
    //支付成功后   修改商家桌台数据  向商家数据里面 添加充值记录
    const re = await app.callFunction({
      name: 'payMerchantTableCost',
      data: {
        shopFlag: appData.shopInfo.shopFlag,
        tableDataArray: tableIndexArray,
        orderNum: orderNum,
        amount: amount,
        payTime: app.getNowTime(new Date(nowTime))
      }
    })
    if (re === 'ok') {//数据写入成功
      app.showModal('提示','续费成功!请重新进入本页面查看数据!')
      return;
    }else{//数据写入错误
      app.showToast('提示','续费失败!稍后如支付未到账,请联系客服人员!')
      return;
    }
  },
  //添加桌台函数
  async addNewTable() {
    const newTable = {
      chargingFlag: '',
      tableName: '预览桌台',
      tableNum: this.data.table_data.length + 1,
      orderForm: '',
      useEndTime: app.getNowTime()
    };
    const res = await app.callFunction({
      name: 'addArrayDatabase_fg',
      data: {
        collection: 'shopAccount',
        shopFlag: appData.shopInfo.shopFlag,
        objName: `shop.tableSum`,
        data: newTable
      }
    });
    if (res === 'ok') {
      app.showToast('添加成功', 'success');
      this.data.table_data.push(newTable)
      this.setData({
        table_data: this.data.table_data
      })
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.emit('updata', this.data.table_data)
    } else {
      app.showToast('添加失败!', 'error')
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel()
    const that = this;
    eventChannel.on('giveData', function (data) {
      that.setData({
        table_data: data
      })
      console.log(that.data.table_data)
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
    return appData.globalShareInfo;
  }
})