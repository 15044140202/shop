// pages/set/shortMassageSend/vipSelect/vipSelect.js
const app = getApp()
const appData = app.globalData
Page({
  /**
   * 页面的初始数据
   */
  data: {
    filteredMembers: [], // 筛选后的会员列表 
    checkedMembers: [], // 已选会员列表 
    filterIntegralValue: null, // 积分筛选值 
    filterLastTimeValue: null, // 最后消费时间筛选值 
    filterAmountValue: null, // 余额筛选值 

    currentPageData: [], // 当前页数据 
    currentPage: 1, // 当前页码 
    pageSize: 50, // 每页条数 
    totalPages: 1, // 总页数 
  },
  // 切换筛选条件显示 
  toggleFilter() {
    this.setData({ isFilterVisible: !this.data.isFilterVisible });
  },
  // 积分筛选 
  filterIntegral(e) {
    console.log(e)
    const value = e.detail.value ? Number(e.detail.value) : null;
    this.setData({ filterIntegralValue: value });
  },

  // 最后消费时间筛选 
  filterLastTime(e) {
    const value = e.detail.value;
    this.setData({ filterLastTimeValue: value });
  },

  // 余额筛选 
  filterAmount(e) {
    const value = e.detail.value ? Number(e.detail.value) : null;
    this.setData({ filterAmountValue: value });
  },
  // 全选操作 
  handleSelectAll(e) {
    console.log(e)
    const isAllSelected = e.detail.value.includes('all');
    this.data.filteredMembers = this.data.filteredMembers.map(item => ({
      ...item,
      checked: isAllSelected,
    }));
    console.log(this.data.filteredMembers)
    this.loadPageData()
  },
  // 多选处理 
  handleCheckboxChange(e) {
    console.log(e)
    const checkIndexArr = e.detail.value;
    const pageSize = this.data.pageSize
    const currentPage = this.data.currentPage - 1
    this.data.currentPageData.forEach((item,index)=>{
      const currentIndex = currentPage * pageSize + index
      if (checkIndexArr.includes( currentIndex.toString())) {
        this.data.filteredMembers[currentIndex].checked = true
      }else{
        this.data.filteredMembers[currentIndex].checked = false
      }
    })
    console.log(this.data.filteredMembers)
    this.loadPageData()
  },
  // 应用筛选条件 
  applyFilters() {
    const { vipArray, filterIntegralValue, filterLastTimeValue, filterAmountValue } = this.data;
    let filteredMembers = vipArray;
    console.log(filteredMembers)
    if (filterIntegralValue !== null) {
      filteredMembers = filteredMembers.filter(item => item.integral >= filterIntegralValue);
    }
    console.log(filteredMembers)
    if (filterLastTimeValue) {
      filteredMembers = filteredMembers.filter(item => item.lastTime >= filterLastTimeValue);
    }

    if (filterAmountValue !== null) {
      filteredMembers = filteredMembers.filter(item => item.amount >= filterAmountValue);
    }
    this.data.filteredMembers = filteredMembers
    console.log(filteredMembers)
    this.data.filteredMembers = this.data.filteredMembers.map(item => ({
      ...item,
      checked: false
    }))
    // 模拟加载数据 
    this.setData({
      totalPages: Math.ceil(filteredMembers.length / this.data.pageSize),
      currentPage: 1,
      isAllSelected: false
    });
    this.loadPageData()
  },
  //获取店铺全部会员信息
  async getAllVip() {
    const allvip = []
    const limit = 1000
    let total = 99999
    let i = 0
    while (total > 0) {
      const res = await app.call({
        path: '/api/database',
        method: 'POST',
        data: {
          url: '/tcb/databasequery',
          query: `db.collection(\"vip_list\").where({
              shopId:\"${appData.shop_account._id}\"
            }).limit(${limit}).skip(${i}).get()`
        }
      })
      console.log(res)
      allvip.push(...res.data)
      total = res.pager.Total - i - 1000
      i += 1000
    }
    console.log(allvip)
    const newAllvip = allvip.reduce((acc, item) => {
      acc.push(JSON.parse(item))
      return acc
    }, [])
    console.log(newAllvip)
    this.data.vipArray = newAllvip
  },
  filter() {
    this.applyFilters()
    this.setData({
      isFilterVisible: false
    })
  },
  resetFilter() {
    this.setData({
      filterAmountValue: null,
      filterIntegralValue: null,
      filterLastTimeValue: null
    })
    this.applyFilters()
    this.setData({
      isFilterVisible: false
    })
  },
  getSelectTelephoneArr() {
    return this.data.filteredMembers.reduce((acc, item) => {
      if (item.telephone && item.checked) {
        acc.push('+86'+ item.telephone)
      }
      return acc
    }, [])
  },
  confirm() {//确定选择
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('someEvent', this.getSelectTelephoneArr())
    wx.navigateBack()
  },
  // 上一页 
  loadPrevPage() {
    if (this.data.currentPage > 1) {
      this.setData({ currentPage: this.data.currentPage - 1 }, () => {
        this.loadPageData();
      });
    }
  },
  // 下一页 
  loadNextPage() {
    if (this.data.currentPage < this.data.totalPages) {
      this.setData({ currentPage: this.data.currentPage + 1 }, () => {
        this.loadPageData();
      });
    }
  },
  // 加载当前页数据 
  async loadPageData() {
    app.showLoading('加载中...', true)
    const { filteredMembers, currentPage, pageSize } = this.data;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const task = []
    this.data.currentPageData = filteredMembers.slice(start, end)
    this.data.currentPageData.map((item) => {
      if (!item?.headImage?.includes('https')) {
        if (item?.headImage === undefined) {
          task.push(app.getHeadImage('1', false))
        } else {
          task.push(app.getHeadImage(item.headImage, false))
        }
      } else {
        task.push(item.headImage)
      }
    })
    if (task.length) {
      const headImageArr = await Promise.all(task)
      this.data.currentPageData = this.data.currentPageData.map((item, index) => {
        item.headImage = headImageArr[index]
        return item
      })
    }
    console.log(this.data.currentPageData)
    this.setData({
      currentPageData: this.data.currentPageData
    })
    await wx.hideLoading()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const that = this
    this.getAllVip().then(res => {
      // 初始化时显示所有会员 
      that.data.filteredMembers = that.data.vipArray
      // 模拟加载数据 
      that.setData({
        totalPages: Math.ceil(that.data.filteredMembers.length / that.data.pageSize),
        currentPage: 1
      });
      that.loadPageData();
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