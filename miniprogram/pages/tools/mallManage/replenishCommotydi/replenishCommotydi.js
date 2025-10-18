// pages/set/commotidySet/commotidyNameSet/addNewCommotidy/addNewCommotidy.js
const zx = require('../../../../utils/zx.js');
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_commotidy: [],
    newCommotidy: {
      shopId: '',
      commotydiName: '',
      brand: '',//品牌
      color: [{
        color: "默认颜色",
        sum: 0,
        merchantPrice: 0,
        outPrice: 0,
        inPrice: 0,
      },],
      headPic: '',
      picArr: [],
      sort: '',
      unit: '',
      lowSum: 0,
      totalSellSum: 0,//总销量
      sellState: 0,//上架状态 0未上架 1已上架
      source: 0,//0:商户自购,1:官方商城
    },
    units: ['个', '只', '瓶', '桶', '盒', '套', '包', '根'],
    unitsSelect: 0,
    class: ['球杆', '巧克粉', '皮头', '手套', '杆包', '配件', '其他'],//商品种类 sort :0:球杆,1:巧克粉,2:皮头,3:手套,4:杆包,5:配件,6:其他
    classSelect: 0,


    addCommotidy:[],
    sum:0,//补货总金额
    inventory:false,//是否显示补货详单
    mallType: 'shop'//商城类型 官方/店铺  official/shop
  },
  delete(e) {
    console.log(e)
    this.data.addCommotidy.splice(e.mark.index,1)
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    this.getSum()
  },
  addCommotidy(e) {
    console.log(e)
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      if (element.color === this.data.newCommotidy.color[e.mark.index].color) { //已经添加过的商品
        this.setData({
          [`addCommotidy[${index}].sum`]: this.data.addCommotidy[index].sum + 1
        })
        this.getSum()
        return;
      }
    }
    this.data.addCommotidy.push({
      commotydiName: this.data.newCommotidy.commotydiName,//商品名称
      color:this.data.newCommotidy.color[e.mark.index].color,
      colorOBJ:e.mark.index,
      brand: this.data.newCommotidy.brand,//品牌
      unit:this.data.newCommotidy.unit,//单位
      inPrice:this.data.newCommotidy.color[e.mark.index].inPrice,//进货价
      sum: 1
    })
    this.setData({
      addCommotidy: this.data.addCommotidy
    })
    this.getSum()
    console.log(this.data.addCommotidy)
  },
  getSum() {
    var sum = 0
    for (let index = 0; index < this.data.addCommotidy.length; index++) {
      const element = this.data.addCommotidy[index];
      sum = sum + parseFloat(element.inPrice) * parseInt(element.sum)
    }
    console.log(sum)
    this.setData({
      sum: sum
    })
  },
  tap(e){
    console.log(e)

  },
  hidden(){
    this.data.inventory === true ? this.setData({
      inventory: false
    }) : this.setData({
      inventory: true
    })
  },
  input(e) {
    console.log(e)
    if (!e.detail.value) {
      return
    }
    if (e.mark.name === 'inPrice') {
      this.setData({
        [`newCommotidy.color.${e.mark.index}.${e.mark.name}`]: parseFloat((parseFloat(e.detail.value)).toFixed(2)) * 100
      })

      for (let index = 0; index < this.data.addCommotidy.length; index++) {
        const element = this.data.addCommotidy[index];
        if (element.color === this.data.newCommotidy.color[e.mark.index].color) {
          element.inPrice = this.data.newCommotidy.color[e.mark.index].inPrice
        }
      }
    }else if(e.mark.item === 'amendSum'){
      this.data.addCommotidy[e.mark.index].sum = parseInt(e.detail.value)
    }
    this.getSum()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.setData({
      index: options.index,
      mallType: options.mallType//商城类型 官方/店铺  official/shop
    })
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveData', function (data) {
      that.setData({
        shop_commotidy: data.data
      })
      if (parseInt(options.index) !== -1) {
        const newCommotidy = JSON.parse(JSON.stringify(that.data.shop_commotidy[parseInt(options.index)]))
        that.setData({
          newCommotidy: newCommotidy
        })
      }
    })
  },
  async save(){//保存进货单
    const now = new Date()
    const userInfo = this.getUserInfo()
    //构建进货单信息
    const purchaseOrderInfo = {
      orderNum: zx.createOrderNum(now,'purchase'),
      sum:this.data.sum,
      commotydi:this.data.addCommotidy,
      commotydi_id:this.data.newCommotidy._id,
      shopId:this.data.newCommotidy.shopId,
      time:now.getTime(),
      status:userInfo.status,
      personName:userInfo.personName,
      personTetephone:userInfo.personTelephone
    }
    console.log(purchaseOrderInfo)
    const res = await app.callFunction({
      name:'mall_purchase',
      data:{
        order:purchaseOrderInfo
      }
    })
    console.log(res)
    this.amendLocalData(purchaseOrderInfo.commotydi)
    if (res.success) {
      app.showToast('修改成功!', 'success')
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('updata', this.data.shop_commotidy);
      wx.navigateBack();
    } else {
      app.showToast('数据提交失败!', 'error')
      return
    }
  },
  //修改本地 商品数量
  amendLocalData(commotidiList){
    for (let index = 0; index < commotidiList.length; index++) {
      const element = commotidiList[index];
      this.data.shop_commotidy[this.data.index].color[element.colorOBJ].sum += element.sum
    }
  },
  getUserInfo(){
    const shopMember = appData.shop_member
    const shop_account = appData.shop_account
    const myOpenid = appData.merchant_info._openid
    if (myOpenid === shop_account._openid) {
      return{
        status:'boss',
        personName:'老板',
        personTelephone:shop_account.shopInfo.telephone
      }
    }else{
      const userInfo = shopMember.find(item=> item.memberOpenid === myOpenid)
      if (!userInfo) {
        app.showModal('提示','身份信息核对失败!')
        throw 'ERROR --- 身份未确定!'
      }
      return{
        status:userInfo.position,
        personName:userInfo.userName,
        personTelephone:userInfo.telephone
      }
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
    return appData.globalShareInfo;
  }
})