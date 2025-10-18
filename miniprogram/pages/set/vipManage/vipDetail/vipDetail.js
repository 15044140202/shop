// pages/set/vipManage/vipDetaill/vipDetail.js
const appData = getApp().globalData;
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipList: [],
    index: '',
    show: false,
    vipHeadImage: [],

    reason: '',
    amount: '',

    returnData: true,

    buttonText: '返回'
  },
  async addLog(memberName, amount, vipInfo) {
    const addData = {
      level: 'info',
      message: '赠送优惠券',
      amount: amount,
      shopId: appData.shop_account._id,
      operater: memberName,
      vipInfo: vipInfo,
      timestamp: new Date().getTime(),
      source: `送券`
    }
    return await app.callFunction({
      name: 'addRecord',
      data: {
        collection:'server_logs',
        data:addData
      }
    })
  },
  async giveCoupon() {
    if (! await app.power('operate', '赠送优惠券')) {
      app.showModal('提示', '没有权限')
      return
    }
    var amount = 0;
    const res = await wx.showModal({
      title: '输入金额',
      content: '',
      editable: true,
      placeholderText: '请输入整数金额'
    })
    if (res.cancel) {
      return
    }
    amount = parseInt(res.content);
    if (amount <= 0 || amount >= 200) {
      await wx.showModal({
        title: '提示',
        content: '输入不合法! 请输入 1 ~ 200 的整数!',
      })
      return;
    }
    const cancellation = new Date().getTime() + 30 * 24 * 60 * 60 * 1000
    const task = []
    task.push(
      app.callFunction({
        name: 'record_push',
        data: {
          collection: 'vip_list',
          query: {
            userOpenid: this.data.vipList[this.data.index].userOpenid,
            shopId: appData.shop_account._id
          },
          record: 'coupon',
          data: {
            amount: amount,
            cancellation: app.getNowTime(new Date(cancellation))
          }
        }
      })
    )
    task.push(
      this.addLog(app.getMemberName(),amount,this.data.vipList[this.data.index])
    )  
    const addRes = await Promise.all(task)
    if (addRes[0].success) {
      await wx.showModal({
        title: '提示',
        content: '送券成功!有限期30天.',
      })
      return true;
    } else {
      await wx.showModal({
        title: '提示',
        content: '送券失败!',
      })
      return false;
    }
  },
  lookAmountChange() {
    const that = this;
    wx.navigateTo({
      url: './amountChange/amountChange',
      events: {

      },
      success: function (res) {
        res.eventChannel.emit('giveData', { shopId: that.data.vipList[that.data.index].shopId, userOpenid: that.data.vipList[that.data.index].userOpenid })
      }
    })
  },
  call(e) {
    wx.makePhoneCall({
      phoneNumber: this.data.vipList[e.mark.index].telephone,
    })
  },
  async save() {
    if (!await app.power('set', '修改会员敏感信息')) {
      app.noPowerMessage()
      return
    }
    if (this.data.buttonText === '返回') {
      wx.navigateBack();
    } else {
      app.showLoading('保存中...', true)
      const res = await app.callFunction({
        name: 'vip_amount_change',
        data: {
          shopId: appData.shop_account._id,
          userOpenid: this.data.vipList[this.data.index].userOpenid,
          oldAmount: this.data.vipList[this.data.index].amount - this.data.amount,
          value: this.data.amount,
          reason: this.data.reason,
          status: appData.status,
          time: app.getNowTime()
        }
      })
      console.log(res);
      if (res.success) {
        app.showModal('提示', '修改成功!')
      } else {
        app.showModal('提示', '修改失败! 请重新进入小程序重试!')
        return
      }
      wx.hideLoading();
      wx.navigateBack();
    }

  },
  amountChange() {
    this.setData({
      show: this.data.show === true ? false : true
    })
  },
  onConfirm() {
    if (isNaN(parseInt(this.data.amount))) {
      app.showToast('金额只能数字', 'error');
      return;
    }
    if (this.data.amount === '') {
      wx.showToast({
        title: '金额不能为空!',
        icon: 'error'
      })
    } else if (this.data.reason === '') {
      wx.showToast({
        title: '理由不能为空!',
        icon: 'error'
      })
    } else {
      this.data.vipList[this.data.index].amount = parseInt(this.data.vipList[this.data.index].amount) + parseInt(this.data.amount)
      this.setData({
        [`vipList[${this.data.index}].amount`]: this.data.vipList[this.data.index].amount,
        buttonText: '保存'
      })
    }
    this.setData({
      show: false
    })

    if (this.data.returnData === true) { //会员管理界面 需要返回会员数据   其他页面调用的  则不需要返回数据
      const eventChannel = this.getOpenerEventChannel();
      const that = this;
      eventChannel.emit('upData', that.data.vipList)
    }
  },
  onClose() {

  },
  input(e) {
    console.log(e)
    this.data[e.mark.name] = e.detail.value
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options);
    this.setData({
      index: options.index,
      returnData: options.returnData === "false" ? false : true
    });
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    // 监听acceptDataFromOpenerPage事件，获取上一页面通过eventChannel传送到当前页面的数据
    eventChannel.on('giveData', async function (data) {
      console.log(data)
      that.data.vipList = data.reduce((acc, item) => {
        if (typeof (item.startTime) === 'number') {
          const now = new Date(item.startTime)
          console.log(item.startTime)
          console.log(now)
          item.startTime = app.getNowTime(now)
        }
        acc.push(item)
        return acc
      }, [])
      that.setData({
        vipList: that.data.vipList
      })
      //下载头像临时文件
      that.getImage()
    });
    // this.loadData()//倒数据  用完删除
  },
  async loadData() {
    // const oldData = []
    // for (let index = 0; index < 29; index++) {
    //   const res = await app.callFunction({
    //     name: 'fetchData',
    //     data: {
    //       collection: 'userInfo',
    //       skip: index * 100,
    //       limit: 100,
    //       query: {
    //       }
    //     }
    //   })
    //   oldData.push(...res.data.data)
    // }
    // console.log(oldData)
    // const task = []
    // for (let index = 0; index < oldData.length; index++) {
    //   const element = oldData[index];
    //   const newUserInfo = {
    //     _openid: element._openid,
    //     userInfo: {
    //       birthday: element.userInfo.birthday,
    //       gender: element.userInfo.gender,
    //       headImage: element.userInfo.headImage,
    //       name: element.userInfo.name,
    //       telephone: element.userInfo.telephone
    //     },
    //     lastShopId: element.userInfo.lastShop ? element.userInfo.lastShop : '',
    //     usedShopId: element.userInfo.shopInfo,
    //     taskId: element.userInfo.taskId ? element.userInfo.taskId : '',
    //   }
    //   task.push(
    //     app.callFunction({
    //       name:'addRecord',
    //       data:{
    //         collection:'user_info',
    //         data:newUserInfo
    //       }
    //     })
    //   )
    //   task.push(
    //     app.callFunction({
    //       name:'upDate',
    //       data:{
    //         collection:'vip_list',
    //         query:{
    //           userOpenid:newUserInfo._openid
    //         },
    //         upData:{
    //           telephone:newUserInfo.userInfo.telephone
    //         }
    //       }
    //     })
    //   )
    //   if (index !== 0  && index % 50 === 0) {
    //     const RES = await Promise.all(task)
    //     console.log(RES)
    //     task.length = 0
    //   }
    // }
    // if (task.length > 0) {
    //   const RES = await Promise.all(task)
    //   console.log(RES)
    //   task.length = 0
    // }
  },
  async getImage() {
    this.data.vipHeadImage.length = 0
    for (let index = 0; index < this.data.vipList.length; index++) {
      const element = this.data.vipList[index];
      if (this.data.index == index) {//所选用户下载头像
        this.data.vipHeadImage.push(await app.getHeadImage(element.headImage === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : element.headImage))
      } else {//非所选用户 不下载头像
        this.data.vipHeadImage.push('')
      }
    }
    this.setData({
      vipHeadImage: this.data.vipHeadImage
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

  }
})