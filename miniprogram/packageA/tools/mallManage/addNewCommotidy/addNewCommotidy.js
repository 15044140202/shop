// pages/set/commotidySet/commotidyNameSet/addNewCommotidy/addNewCommotidy.js
const zx = require('../../../../utils/zx.js');
const { getShoppingAdd } = require('../../mall/mall_utils.js');
const app = getApp();
const appData = app.globalData;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    shop_commotidy: [],
    templateIndex : 0,
    newCommotidy: {
      shopId: '',
      commotydiName: '',
      brand: '',//品牌,
      shoppingTemplateId:'',
      color: {
        'color1': {
          color: '默认颜色',
          sum: 0,
          merchantPrice: 0,
          outPrice: 0,
          originalPrice:0,
          inPrice: 0,
        },
      },
      headPic: '',
      picArr: [],
      sort: '',
      unit: '',
      lowSum: 0,
      totalSellSum: 0,//总销量
      sellState: 0,//上架状态 0未上架 1已上架
      source: 0,//0:商户自购,1:官方商城
      tag:[],//产品标签
    },
    units: ['个', '只', '瓶', '桶', '盒', '套', '包', '根','张','块'],
    unitsSelect: 0,
    class: ['自助设备','球桌','球杆','台呢','皮口','桌球子', '巧克粉','皮头','其他'],//商品种类 sort 1'自助设备',2'球桌',3'球杆',4'台呢',5'皮口',6'桌球子', 7'巧克粉',8'皮头',9'其他'
    tags:[
      {
        "text": "无标签",
        "type": "hot"  // 拼多多秒杀样式
      },
      {
        "text": "热销爆款",
        "type": "hot"  // 拼多多秒杀样式
      },
      {
        "text": "疯狂底价",
        "type": "discount"  // 百亿补贴样式
      },
      {
        "text": "耐用推荐",
        "type": "brand"  // 品牌样式
      },
      {
        "text": "限时特惠",
        "type": "limit"  // 限时抢购样式
      },
      {
        "text": "新品上市",
        "type": "new"  // 新品样式
      }
    ],
    classSelect: 0,
    mallType: 'shop',

    shoppingTemplate:[],//商城运费模版


    dataAmended:false,//数据被修改过 或者 没被修改过
  },
  addColor(e) {
    console.log(e)
    const keys = Object.keys(this.data.newCommotidy.color)
    let colorName
    for (let index = 1; index < 100; index++) {
      colorName = `color${index}`
      if (!keys.includes(colorName) ) {
        break
      }
    }
    console.log(colorName)
    this.data.newCommotidy.color[colorName] = {
      color: "默认颜色",
      sum: 0,
      merchantPrice: 0,
      outPrice: 0,
      inPrice: 0,
      weight:0,//重量
    }
    this.setData({
      newCommotidy: this.data.newCommotidy
    })
  },
  deleteColor(e) {
    console.log(e)
    if (e.mark.index === 'color1') {
      app.showModal('提示', '至少要保留一个颜色种类,第一个无法删除!')
      return
    }
    delete this.data.newCommotidy.color[e.mark.index]
    this.setData({
      newCommotidy: this.data.newCommotidy
    })
  },
  async Image(e) {
    if (e.mark.name === '') {
      wx.showToast({
        title: '请先填写名称',
        icon: 'error'
      })
    } else {
      const res = await zx.updataImage(appData.shop_account._id, e.mark.name)
      this.data.dataAmended = true
      this.setData({
        ['newCommotidy.headPic']: res
      })
      console.log(this.data.newCommotidy.headPic)
    }
  },
  async deleteImage(e){
    console.log(e)
    const res = await wx.showModal({
      title: '确认',
      content: `确认要删除第${e.mark.index + 1}个图片吗?`,
    })
    if(res.cancel) return //取消操作
    const deleteRes = await zx.deleteFile([this.data.newCommotidy.picArr[e.mark.index]])
    console.log(deleteRes)
    if(deleteRes?.errMsg !== 'cloud.deleteFile:ok'){
      app.showModal('提示','删除失败!')
      return
    }
    this.data.dataAmended = true
    this.data.newCommotidy.picArr.splice(e.mark.index,1)
    this.setData({
      newCommotidy:this.data.newCommotidy
    })
  },
  async addImage(e) {
    if (e.mark.name === '') {
      wx.showToast({
        title: '请先填写名称',
        icon: 'error'
      })
    } else {
      const res = await zx.updataImage(appData.shop_account._id, e.mark.name + zx.getRandomString(5))
      console.log(res)
      if(Array.isArray(res)){
        this.data.newCommotidy.picArr.push(...res)
      }else{
        this.data.newCommotidy.picArr.push(res)
      }
      this.data.dataAmended = true
      this.setData({
        ['newCommotidy.picArr']: this.data.newCommotidy.picArr
      })
      console.log(this.data.newCommotidy.picArr)
    }
  },
  lookImage(e){
    console.log(e)
    wx.previewImage({
      urls:this.data.newCommotidy.picArr,
      current:e.mark.index
    })
  },
  async loadDownAllImage(){
    const iamgeArray = [this.data.newCommotidy.headPic]
    iamgeArray.push(...this.data.newCommotidy.picArr) 
    const res = iamgeArray.reduce((acc,item)=>{
      acc.push(wx.cloud.downloadFile({
        fileID:item
      }))
      return acc
    },[])
    const tempFilePathArr = await Promise.all(res)
    for (let index = 0; index < tempFilePathArr.length; index++) {
      const element = tempFilePathArr[index].tempFilePath;
      await wx.saveImageToPhotosAlbum({
        filePath:element
      })
    }
  },
  async save() {
    const shopId = this.data.shopId
    //判断 是都有未填写信息
    if (!this.data.newCommotidy.commotydiName) {
      app.showToast('请输入名称', 'error')
      return
    } else if (!this.data.newCommotidy.unit) {
      app.showToast('请选择单位', 'error')
      return
    } else if (!this.data.newCommotidy.brand) {
      app.showToast('请输入品牌', 'error')
      return
    } else if (!this.data.newCommotidy.sort) {
      app.showToast('请输入类别', 'error')
      return
    } else if (!this.data.newCommotidy.lowSum) {
      app.showToast('请输入最低数量', 'error')
      return
    }
    for (const key  in this.data.newCommotidy.color) {
      const item = this.data.newCommotidy.color[key]; // 获取对象属性值
      if((!item.outPrice || !item.inPrice) && this.data.newCommotidy.brand !== '运费'){
        app.showModal('提示', '请输入进货价/售卖价格')
        return
      }    
    }

    if (this.data.index === '-1') {//新增
      for (let index = 0; index < this.data.shop_commotidy.length; index++) {
        const element = this.data.shop_commotidy[index];
        if (element.commotydiName === this.data.newCommotidy.name) {//名称重复
          wx.showToast({
            title: '名称重复!',
            icon: 'error'
          })
          return;
        }
      }
      //向服务器  提交新增数据
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'shop_mall',
          data: {
            ...this.data.newCommotidy,
            shopId: shopId,
            time:new Date().getTime()
          }
        }
      })
      if (res.success) {
        app.showToast('修改成功!', 'success')
        this.data.shop_commotidy.push({
          ...this.data.newCommotidy,
          shopId: shopId,
          _id: res.data._id
        })
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('updataToMallManage', this.data.shop_commotidy);
      } else {
        app.showToast('数据提交失败!', 'error')
        return
      }
    } else {//修改
      //向服务器  提交修改数据
      delete this.data.newCommotidy._id
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'shop_mall',
          query: {
            _id: this.data.shop_commotidy[this.data.index]._id
          },
          upData: this.data.newCommotidy
        }
      })
      if (res.success) {
        app.showToast('修改成功!', 'success')
        Object.assign(this.data.shop_commotidy[this.data.index], this.data.newCommotidy)
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.emit('updata', this.data.shop_commotidy);
      } else {
        app.showToast('数据提交失败!', 'error')
        return
      }
    }
  },
  input(e) {
    console.log(e)
    if (!e.detail.value) {
      return
    }
    if (e.mark.name === 'sum' || e.mark.name === 'lowSum') {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: parseInt(e.detail.value)
      })
    } else if (e.mark.name === 'outPrice' || e.mark.name === 'inPrice' || e.mark.name === 'merchantPrice' || e.mark.name === 'originalPrice') {
      this.setData({
        [`newCommotidy.color.${e.mark.index}.${e.mark.name}`]: parseFloat((parseFloat(e.detail.value)).toFixed(2)) * 100
      })
    } else if (e.mark.name === 'color') {
      this.setData({
        [`newCommotidy.color.${e.mark.index}.color`]: e.detail.value
      })
    } else {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: e.detail.value
      })
    }
    this.data.dataAmended = true
    console.log(this.data.newCommotidy[e.mark.name])
  },
  onchange(e) {
    console.log(e)
    if (e.mark.name === 'sort') {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: this.data.class[e.detail.value]
      })
      console.log(this.data.newCommotidy[e.mark.name])
    }else if(e.mark.name === 'template'){
      this.setData({
        [`newCommotidy.shoppingTemplate.name`]: this.data.shoppingTemplate[e.detail.value].name,
        [`newCommotidy.shoppingTemplate._id`]: this.data.shoppingTemplate[e.detail.value]._id,
        templateIndex:e.detail.value
      })
      console.log(this.data.newCommotidy)
    }else if(e.mark.name === 'tag'){//产品标签
      if (e.detail.value == 0) {//取消标签
        this.setData({
          [`newCommotidy.tag`]: []
        })
        return
      }
      this.data.newCommotidy.tag[0] = this.data.tags[e.detail.value]
      this.setData({
        [`newCommotidy.tag`]: this.data.newCommotidy.tag,
        tagseleced:parseInt(e.detail.value) 
      })
      console.log(this.data.newCommotidy)
    } else {
      this.setData({
        [`newCommotidy.${e.mark.name}`]: this.data.units[e.detail.value]
      })
      console.log(this.data.newCommotidy[e.mark.name])
    }
    this.data.dataAmended = true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options)
    this.setData({
      index: options.index,
      mallType: options.mallType,//商城类型 官方/店铺  official/shop
      shopId:options.mallType === 'shop' ? appData.shop_account._id : '11111111111111111111'
    })
    const eventChannel = this.getOpenerEventChannel();
    const that = this;
    eventChannel.on('giveAddNewCommotydiData', function (data) {
      that.setData({
        shop_commotidy: data.data
      })
      if (parseInt(options.index) !== -1) {
        const newCommotidy = JSON.parse(JSON.stringify(that.data.shop_commotidy[parseInt(options.index)]))
        if (!('tag' in newCommotidy)) {
          newCommotidy.tag=[]
        }
        that.setData({
          newCommotidy: newCommotidy
        })
      }
    })

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },
  async getShoppingTemplate(){
    const res = await app.callFunction({
      name:'getData_where',
      data:{
        collection:'mall_shopping_template',
        query:{
          shopId:this.data.mallType === 'official' ? '11111111111111111111' : appData.shop_account._id
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示','获取运费模版失败!')
      return []
    }
    this.setData({
      shoppingTemplate:res.data
    })
    return res.data
  },
  /**
   * 生命周期函数--监听页面显示
   */
  async onShow() {
    const templateName =  this.data.mallType === 'official' ? 'officialShoppingTemplate' :'shopShoppingTemplate'
    if (!appData[templateName] ) {
      const template = await this.getShoppingTemplate()
      appData[templateName] = template
      this.data.shoppingTemplate = template
    }else{
      this.data.shoppingTemplate = appData[templateName]
    }

    this.setData({
      shoppingTemplate:this.data.shoppingTemplate
    })
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
    console.log('监听页面卸载')
    if(this.data.dataAmended){
      this.save()
    }
    
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