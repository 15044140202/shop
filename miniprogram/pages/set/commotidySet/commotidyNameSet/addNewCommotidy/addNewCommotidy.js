// pages/set/commotidySet/commotidyNameSet/addNewCommotidy/addNewCommotidy.js
const utils = require('../../../../../utils/light');
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    commotidy: [],
    index: 0,//上页传过来的 index
    class:0,//上页传过来的 classIndex
    newCommotidy: {
      picId:'',
      name: '',
      units: '',
      primeCost: '',
      sellCost: '',
      sum: '',
      lowSum: ''
    },
    units: ['个', '只', '瓶', '盒', '套', '包', '根'],
    unitsSelect: 0,
    Newclass: '',
    classSelect: 0
  },
  async Image(e){
    if (e.mark.name === '') {
      wx.showToast({
        title: '请先填写名称',
        icon:'error'
      })
    }else{
      const res = await utils.updataImage(appData.shopInfo._openid,e.mark.name)
      this.setData({
        ['newCommotidy.picId']:res
      })
      console.log(this.data.newCommotidy.picId)
    }
  },
  async save() {
    switch ('') {//判断 是都有未填写信息
      case this.data.newCommotidy.name:
        wx.showToast({
          title: '请输入名称!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.units:
        wx.showToast({
          title: '请选择单位!',
          icon: 'error'
        })
        return;
      case this.Newclass:
        wx.showToast({
          title: '请选择分类!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.primeCost:
        wx.showToast({
          title: '请输入进货价!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.sellCost:
        wx.showToast({
          title: '请输入售卖价!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.sum:
        wx.showToast({
          title: '请输入库存数量!',
          icon: 'error'
        })
        return;
      case this.data.newCommotidy.lowSum:
        wx.showToast({
          title: '请输入最低数量!',
          icon: 'error'
        })
        return;
    }

    if (this.data.index === '-1') {//新增
      for (let index = 0; index < this.data.commotidy.length; index++) {
        const element = this.data.commotidy[index];
        if (element.name === this.data.Newclass) {//向指定的类别里面添加商品数据
          for (let i = 0; i < this.data.commotidy[index].commotidy.length; i++) {//判断名称是否重复!
            const element = this.data.commotidy[index].commotidy[i];
            if (element.name === this.data.newCommotidy.name) {
              wx.showToast({
                title: '名称重复!',
                icon:'error'
              })
              return;
            }
          }
          this.data.commotidy[index].commotidy.push(this.data.newCommotidy);
          break;
        }else if(index === this.data.commotidy.length - 1){
          wx.showToast({
            title: '错误!没有此类别!',
            icon:'error'
          })
          return;
        }
      }
    }else{//修改
      console.log(this.data.commotidy)
    }
    //向服务器  提交修改数据
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data:{
        collection:'commotidy',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'commotidy',
        data:this.data.commotidy
      }
    })
    if (res === 'ok') {
      wx.showToast({
        title: '保存成功!',
        icon:'success'
      })
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('updata',this.data.commotidy);
      wx.navigateBack();
    }else{
      wx.showToast({
        title: '数据提交失败!',
        icon:'error'
      })
    }
  },
  input(e) {
    this.setData({
      [`newCommotidy.${e.mark.name}`]: e.detail.value
    })
    console.log(this.data.newCommotidy[e.mark.name])
  },
  onchange(e) {
    console.log(e)
    if (e.mark.name === 'class') {
      this.setData({
        Newclass: this.data.commotidy[e.detail.value].name
      })
      console.log(this.data.Newclass)
    } else {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: this.data.units[e.detail.value]
      })
      console.log(this.data.newCommotidy[e.mark.name])
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveData', function (data) {
      that.setData({
        commotidy: data.data
      })
      console.log(that.data.commotidy)
      if(options.index === '-1'){
        that.setData({
          index:'-1'
        })
      }else{
        that.setData({
          newCommotidy:that.data.commotidy[options.class].commotidy[options.index],
          class:options.class,
          index:options.index
        })
      }
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

  }
})