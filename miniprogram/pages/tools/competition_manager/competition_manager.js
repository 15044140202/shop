// pages/tools/competition_manager/competition_manager.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    competitionList: [],
    skit: 0,
    limit: 100,
    count: 0,
  },
  goto(e) {
    console.log(e)
    if (e.mark.item === 'newCompetition') {
      wx.navigateTo({
        url: './newCompetition/newCompetiton',
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  async getShopCompetition(shopId,skip = 0) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        collection: 'competition',
        query: {
          shopId: shopId,
          orderType: 'competition'
        },
        skip: skip,
        limit: 100,
        orderBy: 'start_time|desc'
      }
    })
    console.log(res)
    if (!res.success) {
      app.showToast('错误', '获取选手信息错误!')
    }

    this.data.competitionList.push(...res.data.data)
    this.setData({
      count: res.count.total,
      competitionList: this.data.competitionList
    })
  },

  // 跳转到详情页面
  navigateToDetail: function (e) {
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({
      url: `./competitionDetail/competitionDetail?index=${index}`
    });
  },


  // 显示删除确认对话框
  showDeleteConfirm: function (e) {
    const competition = e.currentTarget.dataset.competition;
    const index = e.currentTarget.dataset.index;

    wx.showModal({
      title: '确认删除',
      content: `确定要删除比赛"${competition.competitionName}"吗？此操作不可恢复。`,
      confirmColor: '#FF4757',
      success: (res) => {
        if (res.confirm) {
          this.deleteCompetition(index);
        }
      }
    });
  },
  openMap(e) {
    const location = this.data.competitionList[e.mark.index].location
    console.log(location)
    // 调用地图导航
    wx.openLocation({
      latitude: location.latitude, // 目标纬度
      longitude: location.longitude, // 目标经度
      scale: 18, // 地图缩放级别，默认18
      success: () => {
        console.log('成功调起地图');
      },
      fail: (err) => {
        console.error('调起地图失败', err);
      }
    });
  },
  // 删除比赛
  deleteCompetition: async function (index) {
    const competitions = this.data.competitionList;
    const confirm = await wx.showModal({
      title: '确认窗口',
      content: '确认要删除 此次赛事吗? 有成员报名的赛事请处理好需要退还的报名费,删除后所有数据将不可查询!',
    })
    if (confirm.cancel) {
      throw 'error  取消操作!'
    }
    //删除数据库数据
    const res = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'competition',
        query: {
          _id: this.data.competitionList[index]._id
        }
      }
    })
    if (!res.success) {
      app.showModal('删除数据失败!')
      throw 'error 删除数据失败!'
    }
    app.showModal('删除数据成功!')
    competitions.splice(index, 1);
    this.setData({
      competitionList: competitions
    });

  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    //获取店铺赛事信息
    console.log(appData)
    this.data.competitionList.length = 0
    this.getShopCompetition(appData.shop_account._id,0)

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
    if (this.data.count === this.data.competitionList.length) {
      wx.showToast({
        title: '没有更多数据了!',
        icon: 'error'
      })
    } else {
      wx.showLoading({
        title: '数据加载中!'
      });
      await this.getShopCompetition(appData.shop_account._id,this.data.competitionList.length);
      wx.hideLoading();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})