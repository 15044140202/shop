// pages/tools/recruit/recruit.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    recruitList: []
  },
  addNewRecuit(){
    wx.navigateTo({
      url: './addNewRecuit/addNewRecuit',
    })
  },
  //录用 助教员工
  async hire(e){
    console.log(e)
    const applyInfo = this.data.recruitList[e.mark.index].applicantList[e.mark.memberIndex]
    //向店铺员工数据中添加 员工  构建数据
    const memberInfo = {
      memberOpenid:applyInfo.userOpenid,
      position:'girl',
      shopId:this.data.recruitList[e.mark.index].shopId,
      telephone:applyInfo.telephone,
      userName:applyInfo.name,
      gender:applyInfo.gender,
      state:0, //0休息, 1在岗空闲,2在岗非空闲
      version:0,//版本号, 用于顾客下单时效验
      orderNum:'',//
      orderPayState:0,//订单支付状态
      price:0,//每小时价格
      level:'初级助教'//助教级别
    }
    const res = await app.callFunction({
      name:'addRecord',
      data:{
        collection:'shop_member',
        data:memberInfo
      }
    })
    if (!res.success) {
      app.showModal('提示','上传数据错误!')
      return
    }
    app.showToast('操作成功!','success')
    return
  },
  //查看 员工朋友圈
  lookMemberMoment(e){
    console.log(e)
    const openid = this.data.recruitList[e.mark.index].applicantList[e.mark.memberIndex].userOpenid
    wx.navigateTo({
      url: `./memberMoment/memberMoment?userOpenid=${openid}`,
    })
  },
  // 切换应聘列表展开/折叠状态 
  toggleApplicantList(e) {
    const id = e.currentTarget.dataset.id;
    let recruitList = this.data.recruitList;
    recruitList = recruitList.map(item => {
      if (item.id === id) {
        item.isExpanded = !item.isExpanded;
      }
      return item;
    });
    this.setData({ recruitList });
  },
  // 切换状态（作废/生效）
  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status
    let recruitList = this.data.recruitList;
    //修改服务器信息
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'shop_recruit',
        query:{
          _id:id
        },
        upData:{
          status:status
        }
      }
    })
    if (!res.success) {
      app.showModal('提示','失败!')
      return
    }
    app.showToast('成功!',true)
    recruitList = recruitList.map(item => {
      if (item.id === id) {
        item.status = item.status === "生效" ? "作废" : "生效";
      }
      return item;
    });
    this.setData({ recruitList });
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
  async confirmMessage(message){
    const res = await wx.showModal({
      title: '确认窗口',
      content: message,
    })
    if (res.confirm) {
      return true
    }
    return false
  },
  makeCall(e){
    console.log(e)
    wx.makePhoneCall({
      phoneNumber: e.mark.phoneNum,
    })
  },
  async deleteRecruit(e){
    console.log(e)
    if (! await this.confirmMessage('确定删除该招聘信息?')) {
      return
    }
    const res = await app.callFunction({
      name:'removeRecord',
      data:{
        collection:'shop_recruit',
        query:{
          _id:this.data.recruitList[e.mark.index]._id
        }
      }
    })
    if (!res.success) {
      app.showModal('提示','删除失败!')
      return
    }
    app.showToast('删除成功!','success')
    this.getRecruitList()
  },
  async getRecruitList(){
    const res = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'shop_recruit',
        query:{
          shopId:appData.shop_account._id
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示','获取招聘信息失败!')
      return
    }
    this.setData({
      recruitList:res.data
    })
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getRecruitList()
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