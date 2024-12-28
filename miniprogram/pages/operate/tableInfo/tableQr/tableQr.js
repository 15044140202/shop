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
    saveButtonDisabled: true

  },

  /**
   * 生命周期函数--监听页面加载
   */
  async downTableQr() {
    const item = this.data.item
    const pages = this.data.item === 'cupboardNum' ? 'pages/index/index' : `pages/index/index?tableNum=${this.data.optNum -1}&shopFlag=${appData.shopInfo.shopFlag}`
    const bgcSrc = this.data.item === 'cupboardNum' ? 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/icon/%E6%9D%86%E6%9F%9C%E6%8C%87%E5%BC%95%E8%B4%B4.png?sign=3ab9ed3c1b92ed35b2715575439783ec&t=1724167746' : 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/icon/%E7%A9%BA%E4%BA%8C%E7%BB%B4%E7%A0%81%E8%B4%B4.png?sign=de67e5b8fb55d85c761d50282302aec5&t=1723042982'

    app.showLoading('获取中...', true)
    const res = await wx.cloud.callFunction({
      name: 'getOpenTableQRCode',
      data: {
        pages: pages
      }
    })
    console.log(res)
    var picData = ''
    if (res.result.errMsg === 'openapi.wxacode.get:ok') {
      app.showToast('获取小程序码成功!', 'success')
      let arrayBuffer = res.result.buffer; // 你的 ArrayBuffer 数据
      let byteArray = new Uint8Array(arrayBuffer);
      let base64String = Base64.fromUint8Array(byteArray);
      picData = 'data:image/png;base64,' + base64String
    } else {
      app.showToast('获小程序码失败!', 'error');
      wx.hideLoading();
      return;
    }
    wx.hideLoading();
    const dpr = wx.getWindowInfo().pixelRatio
    const qr = canvas.createImage();
    qr.src = picData;
    qr.onload = () => {
      if (item === 'cupboardNum') {
        ctx.drawImage(qr,920 * dpr, 110 * dpr, 340* dpr, 340 * dpr)
      } else {
        ctx.drawImage(qr, 78 * dpr, 42 * dpr, 180 * dpr, 180 * dpr)
      }
    }
    await app.delay(500)
    const bg = canvas.createImage();
    bg.src = bgcSrc;
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      if (item === 'cupboardNum') {
        ctx.fillStyle = "white";
        ctx.font = "bold 700px sans-serif";
        ctx.fillText(`${this.data.optNum.padStart(2,'0')}`, 80 * dpr, 400 * dpr);
      } else {
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
  async saveQr() {
    const width = this.data.item === 'cupboardNum' ? 1400 : 1050
    const height = this.data.item === 'cupboardNum' ? 1900 : 350
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
  onReady() {},
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