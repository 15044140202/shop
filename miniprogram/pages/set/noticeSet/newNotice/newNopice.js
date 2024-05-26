// pages/set/noticeSet/newNotice/newNopice.js
const utils = require('../../../../utils/light');
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    //上传需要的数据    9项目
    flag: '',
    titel: '',
    content: '',
    startTime: '',
    endTime: '',
    lookSum: 0,
    state: true,
    autoPop: true,
    author: appData.status,

    show: false,
  },
  async addNotice(p) {
    //此处有两个分支  当flag有值的时候  为修改原有数据   当flag为空的时候 为新增数据
    if (p.flag === '') { //新增数据**********************
      console.log('新添加公告!')
      var newP = p;
      newP.flag = await utils.getRandomString(20)
      const res = await app.callFunction({
        name: 'addArrayDatabase_fg',
        data: {
          collection: 'notice',
          shopFlag: appData.shopInfo.shopFlag,
          objName: 'notice',
          data: newP
        }
      })
      if (res === 'ok') {
        console.log('添加成功!')
        return true
      } else {
        console.log('添加失败!')
        return false
      }

    } else { //修改数据**********************
      console.log('修改公告!')
      console.log(p)
      const res = await app.callFunction({
        name: 'amendArrayDatabase_fg',
        data: {
          collection: 'notice',
          record: 'notice',
          arrayFlag: 'flag',
          data: p
        }

      })

      console.log({
        "添加:": '结果',
        res
      })

      if (res === 'ok') {
        console.log('添加成功!')
        //添加成功!
        return true
      } else {
        console.log('添加失败!')
        return false
      }
    }
  },


  onDisplay() {
    this.setData({
      show: true
    });
  },
  onClose() {
    this.setData({
      show: false
    });
  },
  formatDate(date) {
    date = new Date(date);
    return `${date.toLocaleDateString()}`;
  },
  onConfirm(event) {
    this.setData({
      show: false,
      endTime: this.formatDate(event.detail),
    });
    console.log(this.data.endTime)
  },

  titelData(e) {
    this.setData({
      titel: e.detail.value
    })
  },
  contentData(e) {
    console.log(e.detail.value)
    this.setData({
      content: e.detail.value
    })
  },
  stateSwitch() {
    if (this.data.state === true) {
      this.setData({
        state: false
      })
    } else {
      this.setData({
        state: true
      })
    }
  },
  autoPopSwitch() {
    if (this.data.autoPop === true) {
      this.setData({
        autoPop: false
      })
    } else {
      this.setData({
        autoPop: true
      })
    }
  },
  async saveData() {
    wx.showToast({
      title: '保存中!',
      icon: 'loading',
      duration: 3000,
      mask: true
    })
    const res = await this.addNotice({
      flag: this.data.flag,
      openid: appData.shopInfo._openid,
      titel: this.data.titel,
      content: this.data.content,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      lookSum: this.data.lookSum,
      author: this.data.author,
      state: this.data.state,
      autoPop: this.data.autoPop
    })
    if (res === true) {
      wx.showToast({
        title: '添加成功!',
        icon: 'loading',
        duration: 1000,
        mask: true
      })
      wx.navigateTo({
        url: '../noticeSet',
      })
    } else {
      wx.showToast({
        title: '添加失败!',
        icon: 'loading',
        duration: 1000,
        mask: true
      })
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);
    if (options.data === '1') { //此情况 是在notice 页面点击已有公告连接进来的
      const eventChannel = this.getOpenerEventChannel();
      const that = this;
      eventChannel.on('giveData', function (res) {
        console.log(res)
        that.setData({
          flag: res.flag,
          author: res.author,
          titel: res.titel,
          content: res.content,
          startTime: res.startTime,
          endTime: res.endTime,
          lookSum: res.lookSum,
          state: res.state,
          autoPop: res.autoPop,
        })
      })

    } else { //如果不是 修改链接进来的  要获取现在时间 给开始时间赋初始值
      //获取现在时间  为startTime  赋值
      const now = new Date()
      this.setData({
        startTime: now.toLocaleDateString(),
        endTime: now.toLocaleDateString()
      })
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