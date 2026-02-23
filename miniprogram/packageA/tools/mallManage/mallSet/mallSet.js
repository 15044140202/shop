const app = getApp()
const appData = app.globalData

Page({
  data: {
    appData: appData,
    tabbaractive: 3,


    managerArr: {},
    shopMember: appData.shop_member,
    memberSelected: -1,

    templateCount: 3,
    showAddPopup: false,
    roleOptions: [
      { text: '管理员', value: 'manager' },
      { text: '客服人员', value: 'customerService' },
      { text: '物流人员', value: 'logistics' },
      { text: '售后人员', value: 'afterSale' }
    ],
    roleInfo: {},
    selectedRole: {}
  },

  onLoad(options) {
    this.data.mallType = options.mallType
    this.dialog = this.selectComponent('#van-dialog')
    this.setData({
      managerArr: options.mallType === 'shop' ? appData.shopMallManager : appData.officialMallManager
    })
  },
  onShow(e){
    console.log('onShow')
    this.setData({
      managerArr: appData.malltype === 'shop' ? appData.shopMallManager : appData.officialMallManager
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('监听页面卸载')
    const managerArr = appData.malltype === 'shop' ? appData.shopMallManager : appData.officialMallManager
    if (this.data.managerArr !== managerArr) {
      if (appData.malltype === 'shop') {
        appData.shopMallManager = this.data.managerArr
      } else {
        appData.officialMallManager = this.data.managerArr
      }
    }
  },

  // 导航到不同管理页面
  navigateToMerberManage(e) {
    console.log(e)
    wx.navigateTo({
      url: `./admin/admin?item=${e.mark.item}`
    })
  },

  // 添加人员相关方法
  showAddDialog() {
    this.setData({
      showAddPopup: true,
      selectedRole: {},
      name: '',
      phone: ''
    })
  },

  closeAddPopup() {
    this.setData({ showAddPopup: false })
  },

  onRoleChange(e) {
    console.log(e)
    const index = e.detail.value
    if (e.mark.item === 'member') {
      this.setData({
        roleInfo: this.data.shopMember[index]
      })
    } else if (e.mark.item === 'status') {
      this.setData({
        selectedRole: this.data.roleOptions[index]
      })
    }

  },
  tabbarOnChange(e){
    console.log(e)
    wx.navigateBack()
  },
  goShippingTemplate(e){
    console.log(e)
    wx.navigateTo({
      url: './shoppingTemplate/shoppingTemplate',
    })
  },
  async confirmAdd() {
    console.log('确定添加员工')
    const { selectedRole, roleInfo } = this.data
    if (!selectedRole.value) {
      wx.showToast({
        title: '请选择角色',
        icon: 'none'
      })
      return
    }

    if (Object.keys(roleInfo).length <= 0) {
      wx.showToast({
        title: '请选择添加的员工',
        icon: 'none'
      })
      return
    }

    const res = await wx.showModal({
      title: '确认添加',
      content: `确定要添加${roleInfo.userName}为${selectedRole.text}吗？`,
    })
    if (res.cancel) {
      app.showToast('取消操作', 'error')
    }
    // 这里应该是调用API添加人员的逻辑
    const upDataRes = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_mall_manager',
        query: {
          shopId: this.data.managerArr.shopId
        },
        _push: {
          [selectedRole.value]: { name: roleInfo.userName, phone: roleInfo.telephone, userOpenid: roleInfo.memberOpenid }
        }
      }
    })
    // 更新对应角色的计数
    this.data.managerArr[selectedRole.value].push({
      name: roleInfo.userName, 
      phone: roleInfo.telephone, 
      userOpenid: roleInfo.memberOpenid
    })
    this.setData({
      managerArr: this.data.managerArr,
      showAddPopup: false
    })
    app.showModal('提示', '添加成功!')
  }
})