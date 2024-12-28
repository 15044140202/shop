// pages/set/sysSte/integralSet/integralSet.js
const app = getApp();
const appData = app.globalData;
const db = wx.cloud.database();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    titel: '积分规则设置',
    integral: {
      tableCost: {
        values: false,
        everyCost: 10,
        giveValues: 1
      },
      commotidy: {
        values: false,
        everyCost: 10,
        giveValues: 1
      },
      stored: {
        values: false,
        everyCost: 1,
        giveValues: 1
      }
    },
    videoShow:false,
    videoUrl:'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/video/%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E7%A7%AF%E5%88%86.mp4?sign=93f97d93349efd18f9736c14352fd1c2&t=1721454885'
  },
  video(){
    this.setData({
      videoShow:true
    })
  },
  async save() {
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'integral',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: 'integral',
        data: this.data.integral
      }
    })
    if (res === 'ok') {
      app.showToast('保存成功!', 'success');
    } else {
      app.showToast('保存失败!', 'error');
    }
  },
  every(e) {
    this.setData({
      [`integral.${e.mark.every}.everyCost`]: parseInt(e.detail.value)
    })
    console.log(this.data.integral[e.mark.every].everyCost)
  },
  give(e) {
    console.log(e)
    this.setData({
      [`integral.${e.mark.give}.giveValues`]: parseInt(e.detail.value)
    })
  },
  change(e) {
    console.log(e.mark.select)
    this.data.integral[e.mark.select].values === true ? this.setData({
      [`integral.${e.mark.select}.values`]: false
    }) : this.setData({
      [`integral.${e.mark.select}.values`]: true
    })
  },
  //获取 积分规则 函数
  async getIntegral(shopFlag) {
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'integral',
        record: 'integral',
        shopFlag: shopFlag
      }
    });
    console.log(typeof (res))
    if ('tableCost' in res) { //新创建的空数据
      return res;
    } else {
      //创建积分模版
      console.log('创建积分模版')
      const r = await app.callFunction({
        name: 'amendDatabase_fg',
        data: {
          collection: 'integral',
          flagName: 'shopFlag',
          flag: shopFlag,
          objName: 'integral',
          data: this.data.integral
        }
      });
      return r;
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading('数据加载中...', true)
    const res = await this.getIntegral(appData.shopInfo.shopFlag)
    if (res === 'ok') { //条件成立 则 数据库中  有积分数据  否则 则是第一次初始化 没有积分数据
      
    }else{
       this.setData({
        integral: res
      })
    }
    console.log(this.data.integral);
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

  }
})