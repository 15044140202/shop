// pages/operate/tableInfo/tableQr/tableQr.js
const app = getApp();
const appData = app.globalData;
import {
  Base64
} from 'js-base64';
let ctx;
let canvas;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    item: 'tableNum',

    //画布

    optNum: 0,
    saveButton: 'default',
    saveButtonDisabled: true,

    qrId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async downTableQr() {
    const item = this.data.item
    const pages = this.data.item === 'cupboardNum' ? 'pages/index/index' :this.data.item === 'miniMall' ?`pages/openTable/commotidy?tableNum=${0}&shopId=${appData.shop_account._id}` : `pages/index/index?tableNum=${this.data.optNum - 1}&shopId=${appData.shop_account._id}`
    const bgcSrc = this.data.item === 'cupboardNum' ? 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/icon/%E6%9D%86%E6%9F%9C%E6%8C%87%E5%BC%95%E8%B4%B4.png?sign=3ab9ed3c1b92ed35b2715575439783ec&t=1724167746':this.data.item === 'miniMall'?'' : 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/icon/%E7%A9%BA%E4%BA%8C%E7%BB%B4%E7%A0%81%E8%B4%B4.png?sign=de67e5b8fb55d85c761d50282302aec5&t=1723042982'

    app.showLoading('获取中...', true)
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: 0,
        limit: 1,
        collection: 'shop_table_qr',
        query: {
          using: 0
        }
      }
    })
    console.log(res)
    var picData = ''
    if (res.success) {
      if (res.data.data.length === 0) {
        app.showModal('提示', '数据库二维码数量不足,请联系客户补充!')
        return
      }
      app.showToast('获取小程序码成功!', 'success')
      // let arrayBuffer = res.data.data[0].qrData; // 你的 ArrayBuffer 数据
      // let byteArray = new Uint8Array(arrayBuffer);
      let base64String = res.data.data[0].qrData;
      this.data.qrId = res.data.data[0]._id
      picData = 'data:image/png;base64,' + base64String
    } else {
      app.showToast('获小程序码失败!', 'error');
      wx.hideLoading();
      return;
    }
    wx.hideLoading();
    const dpr = wx.getWindowInfo().pixelRatio
    console.log(dpr)
    const qr = canvas.createImage();
    qr.src = picData;
    qr.onload = () => {
      if (item === 'cupboardNum') {
        ctx.drawImage(qr, 920 * dpr, 110 * dpr, 340 * dpr, 340 * dpr)
      } else if(item === 'miniMall'){
        ctx.drawImage(qr, 80 * dpr, 50 * dpr, 340 * dpr, 340 * dpr)
      }else {
        ctx.drawImage(qr, 78 * dpr, 42 * dpr, 180 * dpr, 180 * dpr)
      }
    }
    await app.delay(500)
    if (this.data.item === 'miniMall') {//miniMall码  不下载背景图片
      ctx.fillStyle = "black";
      ctx.font = `${45 * dpr}px sans-serif`;
      ctx.fillText(`扫码购买`, 160*dpr, 450 * dpr);
      this.setData({
        saveButton: 'primary',
        saveButtonDisabled: false
      })
      return
    }
    const bg = canvas.createImage();
    bg.src = bgcSrc;
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      if (item === 'cupboardNum') {
        ctx.fillStyle = "white";
        ctx.font = "bold 700px sans-serif";
        ctx.fillText(`${this.data.optNum.padStart(2, '0')}`, 80 * dpr, 400 * dpr);
      }else {
        ctx.fillStyle = "black";
        ctx.font = "80px sans-serif";
        ctx.fillText(`${this.data.optNum} 号 台`, 100 * dpr, 325 * dpr, 200 * dpr);
      }

      this.setData({
        saveButton: 'primary',
        saveButtonDisabled: false
      })
    }
  },
  onLoad(options) {
    console.log(options);
    this.setData({
      optNum: options.optNum
    })
    if (options.item) {
      this.setData({
        item: options.item
      })
    }

    const query = wx.createSelectorQuery();
    query.select('#myCanvas')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        canvas = res[0].node;
        ctx = canvas.getContext('2d');
        // Canvas 画布的实际绘制宽高
        var renderWidth = 1050
        var renderHeight = 350
        if (this.data.item === 'cupboardNum') {
          renderWidth = 1400
          renderHeight = 1900
        }else if(this.data.item === 'miniMall'){
          renderWidth = 500
          renderHeight = 500
        }
        // 初始化画布大小
        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = renderWidth * dpr
        canvas.height = renderHeight * dpr

        ctx.beginPath();
        //填充白色矩形
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })
  },
  async saveDatabaseQrData(qrId) {
    let upData = {}
    if (this.data.item === 'miniMall') {
      upData = {
        qrData:'0',
        using: 1,
        item: 'miniMall',
        shopId: appData.shop_account._id,
        tableNum: this.data.optNum
      }
    }else{//桌台码
      upData = {
        qrData:'0',
        using: 1,
        item: 'table',
        shopId: appData.shop_account._id,
        tableNum: this.data.optNum
      }
    }
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_table_qr',
        query: {
          _id: qrId
        },
        upData
      }
    })
    return res
  },
  async saveQr() {
    const RES = await this.saveDatabaseQrData(this.data.qrId)
    if (!RES.success) {
      app.showModal('提示','保存桌台信息失败!请重试!')
      return
    }
    const width = this.data.item === 'cupboardNum' ? 1400 :this.data.item === 'miniMall' ? 500 :1050
    const height = this.data.item === 'cupboardNum' ? 1900 :this.data.item === 'miniMall' ? 500 : 350
    const res = await wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: width,
      height: height,
      destWidth: width,
      destHeight: height,
      canvas: canvas,
    })
    console.log(res);
    const r = await wx.saveImageToPhotosAlbum({
      filePath: res.tempFilePath,
    })
    console.log(r)
    if (r.errMsg === "saveImageToPhotosAlbum:ok") {
      app.showToast('保存成功!', 'success');
      wx.navigateBack({
        delta: 2
      });
    } else {
      app.showToast('保存失败!', 'error');
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() { },
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