// pages/set/groupBuying/groupBuying.js
const app = getApp()
const appData = app.globalData
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shop_group_buying:{},
    groupSelectIndex:-1,

    addWindowShow:false,
    addType:'',
    addName:'',
    addPrice:0,
    addTimeLong:0,
    addchangingIndex:-1
  },
  tap(e){
    console.log(e)
    if (['addMt','addDy','addKs'].includes(e.mark.item)) {//添加团购
      this.setData({
        addWindowShow:true,
        addType:e.mark.item,
        groupSelectIndex:-1
      })
    }
  },
  input(e){
    console.log(e)
    if (e.mark.item === 'name') {//输入名称
      this.setData({
        addName:e.detail.value
      })
    }else if (e.mark.item === 'price'){//输入价格
      const value = e.detail.value
      if (value.includes('.')) {
        if (value.split(".").length > 1 && value.split(".")[1] !== '' && value.split(".")[1] !== '0') {
          console.log(parseFloat(value))
          let amount = parseFloat(value)
          this.setData({
            addPrice: amount
          })
        }
      } else {
        let amount = parseFloat(value)
        this.setData({
          addPrice: amount
        })
      }
    }else if (e.mark.item === 'timeLong'){//输入时长
      const value = e.detail.value
      if (value.includes('.')) {
        if (value.split(".").length > 1 && value.split(".")[1] !== '' && value.split(".")[1] !== '0') {
          console.log(parseFloat(value))
          let amount = parseFloat(value)
          this.setData({
            addTimeLong: amount
          })
        }
      } else {
        let amount = parseFloat(value)
        this.setData({
          addTimeLong: amount
        })
      }
    }
  },
  setChargingName(){
    const shop_group_buying = this.data.shop_group_buying
    let shop_gb = []
    if (shop_group_buying?.length > 0) {//有数据 遍历计费规则名称
      shop_gb = shop_group_buying.reduce((acc,item) =>{
        if (item.bindChargingName){ 
          acc.push(item)
          return acc
        }
        const cgIndex = this.data.shop_charging.findIndex(e=> e._id === item.bindChargingId )
        if (cgIndex > -1) {
          acc.push({...item,bindChargingName:this.data.shop_charging[cgIndex].name})
        }else{
          acc.push(item)
        }
        return acc
      },[])
      this.setData({
        shop_group_buying:shop_gb
      })
    }
  },
  async delete(e){
    console.log(e)
    const res = await app.callFunction({
      name:'removeRecord',
      data:{
        collection:'shop_group_buying',
        query:{
          _id:this.data.shop_group_buying[e.mark.index]._id
        }
      }
    })
    if(!res.success) {
      app.showModal('提示','删除失败!')
      return
    }
    this.data.shop_group_buying.splice(e.mark.index,1)
    this.setData({
      shop_group_buying:this.data.shop_group_buying
    })
    appData.shop_group_buying = this.data.shop_group_buying
    app.showToast('删除成功','success')
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.data.shop_charging = appData.shop_charging
    const that = this
    //获取套餐设置
    const shop_group_buying = (await app.getShopGroupBuying())?.data || []
    console.log(shop_group_buying)
    this.setData({
      shop_group_buying:shop_group_buying,
      shop_charging:this.data.shop_charging
    })
    this.setChargingName()
  },
  onchange(e){
    console.log(e)
    this.setData({
      addchangingIndex:parseInt(e.detail.value)
    })
  },
  onConfirm(e){//保存
       //数据检测
       if (!this.data.addName) {
        app.showModal('提示','团购名称不许为空!')
        return
      }else if(this.data.addPrice <= 0){
        app.showModal('提示','价格必须大于等于0!')
        return
      }else if(this.data.addTimeLong < 0){
        app.showModal('提示','时长必须大于0!')
        return
      }else if(this.data.addchangingIndex < 0){
        app.showModal('提示','必须绑定计费规则!')
        return
      }
    const newGroupBuying = {
      name:this.data.addName,
      price:this.data.addPrice,
      timeLong:this.data.addTimeLong,
      bindChargingId:this.data.shop_charging[this.data.addchangingIndex]._id,
      shopId:appData.shop_account._id,
      groupBuyType:this.data.addType === 'addMt' ? 'mtCoupon' : this.data.addType === 'addDy' ? 'dyCoupon' : 'ksCoupon'
    }
    console.log(newGroupBuying)
    if (this.data.groupSelectIndex > -1) {
      this.upDataGroupBuying(newGroupBuying,this.data.shop_group_buying[this.data.groupSelectIndex]._id)
    }else{
      this.addNewGroupBuying(newGroupBuying)
    }
  },
  async addNewGroupBuying(newGroupBuying){
    const res = await app.callFunction({
      name:'addRecord',
      data:{
        collection:'shop_group_buying',
        data:newGroupBuying
      }
    })
    if (!res.success) {
      app.showModal('错误!','保存失败!')
      return
    }
    this.data.shop_group_buying.push(newGroupBuying)
    this.setData({
      shop_group_buying:this.data.shop_group_buying
    })
    appData.shop_group_buying = this.data.shop_group_buying
    this.setChargingName()
    app.showToast('保存成功!',true)
  },
  async upDataGroupBuying(groupBuying,_id){
    const res = await app.callFunction({
      name:'addRecord',
      data:{
        collection:'shop_group_buying',
        query:{
          _id:_id
        },
        upData:groupBuying
      }
    })
    if (!res.success) {
      app.showModal('错误!','保存失败!')
      return
    }
    this.setData({
      [`shop_group_buying[${this.data.groupSelectIndex}]`]:Object.assign(this.data.shop_group_buying[this.data.groupSelectIndex],groupBuying) 
    })
    appData.shop_group_buying = this.data.shop_group_buying
    this.setChargingName()
    app.showToast('保存成功!',true)
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