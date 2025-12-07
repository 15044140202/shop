// pages/set/vipManage/vipManage.js
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    vipList: [],
    vipHeadImage: [],

    skit: 0,
    limit: 100,
  },
  onCancel(e) {
    console.log(e)
  },
  async onSearch(e) {
    app.showLoading('加载中...', true)
    console.log(e.mark.info)
    const res = await this.getOneVipInfo(appData.shop_account._id, e.mark.info)
    if (res.length === 0) { //没有此会员
      wx.hideLoading();
      app.showToast('无此会员', 'error');
      return;
    } else {
      this.setData({
        vipList: res
      })
      await this.getImage()
      wx.hideLoading();
    }
  },
  // 输入框输入事件 
  onInput(e) {
    this.setData({
      searchValue: e.detail.value,
    });
  },
  /**
   * @description 深度搜索会员信息, 搜索此电话号码的用户  根据用户openid搜索会员
   * @param {Text} telNum 会员电话号码
   */
  async deepSearch(telNum,shopId){
    const userInfoRes = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'user_info',
        query:{['userInfo.telephone']:telNum}
      }
    })
    console.log(userInfoRes)
    if (!userInfoRes.success) {
      app.showModal('无此会员')
      throw 'error 无此会员'
    }

    const openidArr = userInfoRes.data.map(item => item._openid)
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'vip_list',
        query: {
          shopId: shopId,
        },
        _in:{
          record:'userOpenid',
          value:openidArr
        }
      }
    })
    if (res.success) {
      return res.data
    } else {
      app.showModal('提示', 'error')
      return []
    }
  },
  async getOneVipInfo(shopId, telephone) {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'vip_list',
        query: {
          shopId: shopId,
          telephone: telephone,
        }
      }
    })
    if (res.success) {
      if (res.data.length) {
        return res.data
      }
      //深度搜索
      return await this.deepSearch(telephone,shopId)
    } else {
      app.showModal('提示', 'error')
      return []
    }
  },
  goto(e) {
    const that = this;
    wx.navigateTo({
      url: `./vipDetail/vipDetail?index=${e.mark.index}&returnData=${true}`,
      events: {
        upData: function (params) {
          console.log(params)
          that.setData({
            vipList: params
          })
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.vipList)
      }
    })
  },
  async getdata(skip = 0) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        collection: 'vip_list',
        query: {
          shopId: appData.shop_account._id
        },
        skip: skip,
        limit: 100,
        orderBy: 'time|asc'
      }
    })
    console.log(res)
    if (!res.success) {
      app.showToast('错误', '获取信息错误!')
    }

    this.data.vipList.push(...res.data.data)
    this.setData({
      count: res.count,
      vipList: this.data.vipList
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //预下载 default 图片
    await app.getHeadImage('cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png')
    await this.getdata()
    //循环 下载会员头像
    await this.getImage()
  },
  async getImage() {
    this.data.vipHeadImage.length = 0
    const task = []
    for (let index = 0; index < this.data.vipList.length; index++) {
      const element = this.data.vipList[index];
      task.push(app.getHeadImage(element.headImage === '' ? 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/没有图片.png' : element.headImage))
    }
    this.setData({
      vipHeadImage: await Promise.all(task)
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
  async onReachBottom() {
    if (this.data.count === this.data.vipList.length) {
      wx.showToast({
        title: '没有更多数据了!',
        icon: 'error'
      })
    } else {
      wx.showLoading({
        title: '数据加载中!'
      });
      await this.getdata(this.data.vipList.length);
      //下载没有下载的vip头像
      //循环 下载会员头像
      await this.getImage()
      console.log(this.data.vipList);
      wx.hideLoading();
    }
  }
})