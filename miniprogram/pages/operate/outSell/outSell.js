// pages/set/commotidySet/commotidyPurchaseSet/commotidyPurchaseSet.js
const appData = getApp().globalData;
const app = getApp();
import Dialog from '@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    active: 0,
    addCommotidy: [],
    inventoryHidden: false,
    sum: 0,

    hidden: true
  },
  async payCommotidyCost() {
    const now = new Date();
    const orderNum = app.createOrderNum(now, 'W')
    //此处加入支付 代码  支付成功  修改库存 与出库记录   否则 返回
    //显示选择支付方式选择界面
    var payMode = 'cash';
    try {
      await Dialog.confirm({
        title: '选择支付方式',
        message: `${this.data.sum/100}元\n现金收取请直接收取\n微信支付需扫客人首付款码.`,
        confirmButtonText: '微信支付',
        cancelButtonText: '现金支付'
      });
      //点击确认键   微信支付
      payMode = 'wx'
      const cardId = await wx.scanCode({
        onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
      });
      console.log('调用微信支付!:' + cardId.result)
      const payCode = await app.cardPay((this.data.sum).toString(), `商品费`, appData.shopInfo.proceedsAccount, orderNum, cardId.result, 'wxad610929898d4371')
      console.log({
        '调用结果:': payCode
      })
      if (payCode === undefined) { //支付返回错误
        app.showToast('支付失败!', 'error')
        return;
      }
      const payRes = await this.awaitOrderResult(orderNum);
      if (!payRes) { //支付失败
        app.showToast('支付失败!', 'error')
        return;
      }
      payMode = '微信';
    } catch { //点击取消按钮  现金支付
      if (payMode === 'wx') { //判断是否为 微信支付模式 在扫描界面退出导致的 误进此选项
        return; //误进入
      }
      console.log('选择现金支付!');
      payMode = 'cash';

    }
    if (payMode === 'cash') {
      //现金支付 直接开台 收取方式为现金
      Dialog.alert({
        message: `请收取顾客现金${this.data.sum/100}元`,
      }).then(() => {
        // on close
      });
    }
    console.log('支付完成!')
    //***************支付 代码  待补充 */

    this.deletZero();
    if (this.data.addCommotidy.length != 0) {
      for (let index = 0; index < this.data.addCommotidy.length; index++) {
        const element = this.data.addCommotidy[index];
        //先处理本地商品数据
        this.data.commotidy[element.class].commotidy[element.index].sum = parseInt(this.data.commotidy[element.class].commotidy[element.index].sum) - parseInt(element.sum)
      }
      console.log(this.data.commotidy)
      //修改商品库存数量
      const res = await app.callFunction({
        name: 'subtractCommotidySum',
        data: {
          shopFlag: appData.shopInfo.shopFlag,
          commotidyInfo: this.data.addCommotidy
        }
      })
      if (res === 'ok') {
        wx.showToast({
          title: '提交成功!',
          icon: 'success'
        })
        //生成售卖商品清单
        var commotidyList = []
        for (let index = 0; index < this.data.addCommotidy.length; index++) {
          const element = this.data.addCommotidy[index];
          commotidyList.push({
            name: this.data.commotidy[element.class].commotidy[element.index].name,
            sum: element.sum,
            price: this.data.commotidy[element.class].commotidy[element.index].sellCost
          })
        }
        //发送商品单
        const now = new Date();
        const date = app.getNowDate(now);
        const data = {
          sellPerson: appData.status,
          orderName: '商品单',
          time: app.getNowTime(now),
          payMode: payMode,
          orderNum: orderNum,
          integral: "0",
          commotidyList: commotidyList,
          commotidyCost: this.data.sum / 100
        }
        console.log(data)
        const r = await app.callFunction({
          name: 'addOrder',
          data: {
            shopFlag: appData.shopInfo.shopFlag,
            date: date,
            data: data
          }
        })
        if (r === 'ok') {
          console.log('修改记录保存成功!');
          app.showToast('提交成功!', 'success');
        } else {
          app.showToast('提交失败!', 'error');
        }
        this.setData({
          commotidy: this.data.commotidy,
          addCommotidy: [],
          sum: 0
        })
        return;
      } else {
        app.showToast('提交失败!', 'error')
      }

    } else {
      app.showToast('没有商品!', 'error')
      return;
    }
  },
  deletZero() {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (element.sum == '0') { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
  },
  delete(e) {
    var newdata = [];
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (e.mark.index == index) { //删除项
      } else {
        newdata.push(element)
      }
    }
    this.setData({
      addCommotidy: newdata
    })
    this.getSum()
  },
  addCommotidy(e) {
    console.log(e)
    //首先检测这个商品是否已添加到添加列表了
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (e.mark.class === element.class && e.mark.index === element.index) { //已被添加的商品
        this.setData({
          [`addCommotidy[${index}].sum`]: this.data.addCommotidy[index].sum + 1
        })
        this.getSum()
        return;
      }
    }
    //添加新商品
    this.data.addCommotidy.push({
      class: e.mark.class,
      index: e.mark.index,
      sum: 1
    })
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    this.getSum()
    console.log(this.data.addCommotidy)
  },
  input(e) {
    if (e.detail.value === '') {
      this.data.addCommotidy[e.mark.index].sum = 0
    } else {
      this.setData({
        [`addCommotidy[${e.mark.index}].sum`]: parseInt(e.detail.value)
      })
    }
    this.getSum()
    console.log(this.data.addCommotidy[e.mark.index].sum)
  },
  getSum() {
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum + parseFloat(this.data.commotidy[element.class].commotidy[element.index].sellCost) * parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum: sum * 100
    })
  },

  hidden() {
    this.data.inventory === true ? this.setData({
      inventory: false
    }) : this.setData({
      inventory: true
    })
  },
  async getCommotidy() {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'commotidy',
        record: 'commotidy',
        shopFlag: appData.shopInfo.shopFlag
      }
    })
    console.log(res)
    if (Array.isArray(res)) {
      return res;
    } else {
      return [];
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading("数据加载中...", true)
    const res = await this.getCommotidy();
    if (res.length > 0) {
      this.setData({
        commotidy: res,
        hidden: false
      })
    } else {
      app.showToast('无商品数据!', 'error')
    }
    wx.hideLoading();
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