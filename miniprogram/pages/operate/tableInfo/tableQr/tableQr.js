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
    //画布

    optNum: 0,
    saveButton: 'default',
    saveButtonDisabled:true

  },

  /**
   * 生命周期函数--监听页面加载
   */
  async downTableQr() {
    app.showLoading('获取中...', true)
    const res = await wx.cloud.callFunction({
      name: 'getOpenTableQRCode',
      data: {
        pages: `pages/openTable/openTable?tableNum=${this.data.optNum -1}&shopFlag=${appData.shopInfo.shopFlag}`
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
      app.showToast('获取小程序码失败!', 'error');
      wx.hideLoading();
      return;
    }
    wx.hideLoading();
    const dpr = wx.getWindowInfo().pixelRatio
    const qr = canvas.createImage();
    qr.src = picData;
    qr.onload = () => {
      ctx.drawImage(qr, 57 * dpr, 32 * dpr, 165 * dpr, 165 * dpr)
    }
    const bg = canvas.createImage();
    bg.src = 'https://636c-cloud-4g9re7jfd5333736-1325756030.tcb.qcloud.la/icon/%E7%A9%BA%E4%BA%8C%E7%BB%B4%E7%A0%81%E8%B4%B4.png?sign=26a0334d74b67fd1b500ee5cd280fa72&t=1716196080';
    bg.onload = () => {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "50px sans-serif";
      ctx.fillText(`${this.data.optNum}号台`,95 * dpr,275 * dpr,200 * dpr);
      this.setData({
        saveButton:'primary',
        saveButtonDisabled:false
      })
    }
  },
  onLoad(options) {
    console.log(options);
    this.setData({
      optNum: options.optNum
    })

  },
  async saveQr() {
    const res = await wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: 700,
      height: 300,
      destWidth: 700,
      destHeight: 300,
      canvas: canvas,
    })
    console.log(res);
    const r = await wx.saveImageToPhotosAlbum({
      filePath: res.tempFilePath,
    })
    console.log(r)
    if (r.errMsg === "saveImageToPhotosAlbum:ok") {
      app.showToast('保存成功!','success');
      wx.navigateBack({
        delta: 2
      });
    }else{
      app.showToast('保存失败!','error');
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
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
        const renderWidth = 700
        const renderHeight = 300
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