const app = getApp()
const appData = app.globalData

Page({
  data: {
    appData: appData,
    shopId: '',
    shoppingTemplate: [],
    showPopup: false,
    isEdit: false,
    currentTemplate: {
      name: '',
      type: 'fixed',
      isDefault: false,
      firstFee: '',
      firstAmount: '',
      additionalFee: '',
      additionalAmount: '',
      fixedFee: ''
    },
    editIndex: -1
  },

  onLoad(options) {
    console.log(options)
  },

  async getMallShoppingTemplate() {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'mall_shopping_template',
        query: {
          shopId: this.data.shopId
        }
      }
    })

    if (!res.success) {
      app.showModal('提示', '获取运费模版信息错误!')
      throw 'ERROR ---获取运费模版信息错误'
    }

    this.setData({
      shoppingTemplate: res.data
    })
  },

  getTemplateDesc(item) {
    if (item.type === 'fixed') {
      return `固定运费: ${item.fixedFee}元`
    } else {
      const unit = item.type === 'byWeight' ? 'kg' : '件'
      return `首${item.type === 'byWeight' ? '重' : '件'} ${item.firstAmount}${unit} ${item.firstFee}元, 续${item.type === 'byWeight' ? '重' : '件'} ${item.additionalAmount}${unit} ${item.additionalFee}元`
    }
  },

  showAddPopup() {
    this.setData({
      showPopup: true,
      isEdit: false,
      currentTemplate: {
        name: '',
        type: 'fixed',
        isDefault: false,
        firstFee: '',
        firstAmount: '',
        additionalFee: '',
        additionalAmount: '',
        fixedFee: ''
      }
    })
  },

  editTemplate(e) {
    const index = e.currentTarget.dataset.index
    const template = this.data.shoppingTemplate[index]

    this.setData({
      showPopup: true,
      isEdit: true,
      currentTemplate: JSON.parse(JSON.stringify(template)),
      editIndex: index
    })
  },

  hidePopup() {
    this.setData({
      showPopup: false
    })
  },

  onFieldChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail

    this.setData({
      [`currentTemplate.${field}`]: value
    })
  },

  onDefaultChange(e) {
    this.setData({
      'currentTemplate.isDefault': e.detail
    })
  },

  onTypeChange(e) {
    this.setData({
      'currentTemplate.type': e.detail
    })

  },

  async saveTemplate() {
    const template = this.data.currentTemplate

    // 验证
    if (!template.name) {
      wx.showToast({
        title: '请输入模板名称',
        icon: 'none'
      })
      return
    }

    if (template.type === 'fixed') {
      if (!template.fixedFee || isNaN(template.fixedFee)) {
        wx.showToast({
          title: '请输入有效的固定运费',
          icon: 'none'
        })
        return
      }
    } else {
      if (!template.firstFee || isNaN(template.firstFee) ||
        !template.firstAmount || isNaN(template.firstAmount) ||
        !template.additionalFee || isNaN(template.additionalFee) ||
        !template.additionalAmount || isNaN(template.additionalAmount)) {
        wx.showToast({
          title: '请输入有效的运费规则',
          icon: 'none'
        })
        return
      }
    }
    if (this.data.isEdit) {//更新
      console.log('更新运费模版')
      const index = this.data.shoppingTemplate.findIndex(item => item._id === template._id)
      if (index === -1) {
        app.showModal('更新失败,本地数据没有找到要更新的对象')
        return
      }
      if (template.isDefault) {//更新这个是 默认
        for (let i = 0; i < this.data.shoppingTemplate.length; i++) {
          const element = this.data.shoppingTemplate[i];
          if (element.isDefault && i !== index) {//这个是默认且 不是要更新的数据  则取消其默认
            const res = await app.callFunction({
              name: 'upDate',
              data: {
                collection: 'mall_shopping_template',
                query: {
                  _id: element._id
                },
                upData: {
                  isDefault: false
                }
              }
            })
            if (!res.success) {
              app.showModal('提示', '取消其他默认更新数据失败!')
              return
            }
            this.data.shoppingTemplate[i].isDefault = false
          }
        }
        console.log({ '取消搜索默认': this.data.shoppingTemplate })
      } else {//更新这个不是默认
        if (this.data.shoppingTemplate[index].isDefault) {//更新这个数据 以前是默认 重新随机安排一个默认
          for (let i = 0; i < this.data.shoppingTemplate.length; i++) {
            if (i !== index) {
              //上传默认信息
              const res = await app.callFunction({
                name: 'upDate',
                data: {
                  collection: 'mall_shopping_template',
                  query: {
                    _id: this.data.shoppingTemplate[i]._id
                  },
                  upData: {
                    isDefault: true
                  }
                }

              })
              if (!res.success) {
                app.showModal('提示', '修改默认运费信息错误!')
              }
              this.setData({
                [`shoppingTemplate.${i}.isDefault`]: true
              })
              break
            }
          }
        }//如果更新这个数据  以前也不是默认 则不需要更改任何默认信息
      }
      //更新数据
      const _id = template._id
      console.log(_id)
      delete template._id
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'mall_shopping_template',
          query: {
            _id: _id
          },
          upData: template
        }

      })
      if (!res.success) {
        app.showModal('提示', '更新数据失败!')
        return
      }
      this.data.shoppingTemplate[index] = { ...template, _id: _id }
      this.setData({
        shoppingTemplate: this.data.shoppingTemplate,
        showPopup:false,
      })
    } else {//新增
      console.log('新增运费模版')
      //判断新增的是否是 默认
      if (template.isDefault) {//新增的是默认
        //取消以前 所有默认
        for (let i = 0; i < this.data.shoppingTemplate.length; i++) {
          const element = this.data.shoppingTemplate[i];
          if (element.isDefault) {//这个是默认且 不是要更新的数据  则取消其默认
            const res = await app.callFunction({
              name: 'upDate',
              data: {
                collection: 'mall_shopping_template',
                query: {
                  _id: element._id
                },
                upData: {
                  isDefault: false
                }
              }

            })
            if (!res.success) {
              app.showModal('提示', '取消其他默认更新数据失败!')
              return
            }
            this.data.shoppingTemplate[i].isDefault = false
          }
        }
        console.log({ '取消搜索默认': this.data.shoppingTemplate })
      }//新增这个不是默认  则不用改动默认信息
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'mall_shopping_template',
          data:{
            shopId:this.data.shopId,
            ...template
          }
        }
      })
      console.log(res)
      if (!res.success) {
        app.showModal('提示','新增运费模版失败!')
        return
      }
      template._id = res.data._id
      this.data.shoppingTemplate.push(template)
      this.setData({
        shoppingTemplate:this.data.shoppingTemplate,
        showPopup:false
      })
    }
  },
  onShow() {
    // 判断shopId是否正确
    const shopId = appData.malltype === 'official' ? '11111111111111111111' : appData.shop_account._id
    if (this.data.shopId !== shopId) {
      this.setData({
        shopId: shopId
      })
    }
    this.getMallShoppingTemplate()
  }
})