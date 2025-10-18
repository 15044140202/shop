// pages/deviceManage/deviceManage.js
const app = getApp()
const appData = app.globalData
const barcode = require('wxbarcode')
Page({
  data: {
    shopSmartDisplay: [],
    filteredDevices: [],
    searchValue: '',
    selectedDevice: null,
    showDeviceDetail: false,
    onlineCount: 0,
    offlineCount: 0,
    // 新增状态
    showAddMenu: false,
    //店铺桌台信息
    shop_table : appData.shop_table
  },
  async bindtablechange(e){
    console.log(e)
    const tableNum = this.data.shop_table[e.detail.value].tableNum
    //变更 绑定桌台 
    if (tableNum != this.data.selectedDevice.tableNum) {
      const res = await app.callFunction({
        name:'upDate',
        data:{
          collection:'shop_smart_display',
          query:{
            _id:this.data.selectedDevice._id
          },
          upData:{
            tableNum:tableNum
          }
        }
      })
      console.log(res)
      if (!res.success) {
        app.showModal('保存失败!')
        return
      }
      this.data.shopSmartDisplay.forEach(item=>{
        if (item._id === this.data.selectedDevice._id) {
          item.tableNum = tableNum
        }
      })
      this.filterDevice(2)
      this.setData({
        showDeviceDetail:false
      })
      return
    }
  },
  // 显示/隐藏添加菜单
  showAddMenu() {
    this.setData({
      showAddMenu: !this.data.showAddMenu
    })
  },

  // 扫码添加（原有方法保持不变）
  async onScanAdd() {
    this.setData({ showAddMenu: false }) // 关闭菜单
    const deviceTypeArr = ['吧台智慧屏', '桌台智慧屏', '公共智慧屏', '智慧广告机']
    const res = await wx.scanCode({
      scanType: 'qrCode'
    })
    console.log(res)
    const deviceId = res.result
    //选择设备码
    const deviceTypeIndex = await wx.showActionSheet({
      itemList: deviceTypeArr,
    })
    console.log(deviceTypeIndex)
    const deviceType = deviceTypeArr[deviceTypeIndex.tapIndex]
    console.log(deviceType)
    //保存添加信息到数据库
    const addData = {
      deviceMac: deviceId,
      lastUsedTime: 175652354854,
      name: deviceType,
      shopId: appData.shop_account._id,
      online: false,
      tableNum: null
    }
    const addRes = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_smart_display',
        data: addData
      }
    })
    console.log(addRes)
    if (!addRes.success) {
      app.showModal('保存失败!')
      return
    }
    //刷本地数据
    this.data.shopSmartDisplay.push({ _id: addRes.data._id, ...addData })
    this.filterDevice(2)
  },
  async tap(e) {
    console.log(e)
    if (e.mark.item === 'filterDevice') {
      this.filterDevice(e.mark.onlineState)
    }
  },
  /**
   * @description //获取本店智慧屏数据
   */
  async getShopSmartDisplay() {
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_smart_display',
        query: {
          shopId: appData.shop_account._id
        }
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('数据加载失败!')
      return
    }
    const nowTimeStamp = new Date().getTime()
    this.setData({
      shopSmartDisplay: res.data.reduce((acc,item)=>{
        item.online = item.lastUsedTime + 10 * 60 * 1000 > nowTimeStamp
        acc.push(item)
        return acc
      },[])
    })
    this.filterDevice(2)
  },
  getQrCodeSize(){
    const windowInfo = this.data.windowInfo
    console.log(windowInfo)
    if (windowInfo) {
      const pixelRatio = windowInfo.pixelRatio
      const width = windowInfo.windowWidth
      return (width * 750) / width *0.7
    }else{
      return 400
    }
  },
  onLoad() {
    //获取服务器数据
    this.getShopSmartDisplay()
    //获取windowInfo
    const windowInfo = wx.getWindowInfo()
    console.log(windowInfo)
    this.setData({
      windowInfo:windowInfo
    })
  },

  // 搜索设备
  onSearch(e) {
    const value = e.detail.trim().toLowerCase()
    const filtered = this.data.shopSmartDisplay.filter(device =>
      device.name.toLowerCase().includes(value) ||
      device.shopId.toLowerCase().includes(value) ||
      device.deviceMac.toLowerCase().includes(value)
    )
    this.setData({
      searchValue: value,
      filteredDevices: filtered
    })
  },

  // 点击设备
  onDeviceClick(e) {
    const device = e.currentTarget.dataset.device
    this.setData({
      selectedDevice: device,
    })
    const deviceInfoCode = {
      timeStamp :new Date().getTime(),
      deviceMac:this.data.selectedDevice.deviceMac,
      _id:this.data.selectedDevice._id
    }
    const qrSize = this.getQrCodeSize()
    console.log('size:' + qrSize)
    barcode.qrcode('barCode', JSON.stringify(deviceInfoCode), qrSize, qrSize);
    this.setData({
      showDeviceDetail: true
    })
  },

  // 关闭详情弹窗
  onCloseDetail() {
    this.setData({
      showDeviceDetail: false
    })
  },

  // 删除设备
  async onDeleteDevice() {
    if (!this.data.selectedDevice || !this.data.selectedDevice._id) return

    const confirm = await wx.showModal({
      title: '确认删除',
      content: `确定要删除设备 "${this.data.selectedDevice.name}" 吗？`,
      confirmColor: '#0094ff',
    })
    if (confirm.cancel) {
      throw 'error --- user cancel oprate'
    }
    const deleteRes = await app.callFunction({
      name: 'removeRecord',
      data: {
        collection: 'shop_smart_display',
        query: {
          _id: this.data.selectedDevice._id
        }
      }
    })
    if (!deleteRes.success) {
      app.showModal('删除失败!')
      return
    }
    //处理本地数据
    this.data.shopSmartDisplay.splice(this.data.shopSmartDisplay.findIndex(item => item._id === this.data.selectedDevice._id), 1)
    this.data.selectedDevice = {}
    this.filterDevice(2)
    this.setData({
      showDeviceDetail: false
    })
  },

  /**
   * @description //根据设备在线情况 筛选设备
   * @param {number} onlineState  0不在线  1在线 2全部
   */
  filterDevice(onlineState) {
    this.setData({
      filteredDevices: this.data.shopSmartDisplay.filter(item => {
        if (onlineState === 2) {
          return true
        } else if (onlineState === 0 && !item.online) {
          return true
        } else if (onlineState === 1 && item.online) {
          return true
        }
        return false
      }),
      offlineCount: this.data.shopSmartDisplay.filter(item => !item.online).length,
      onlineCount: this.data.shopSmartDisplay.filter(item => item.online).length
    })
    this.setData({
      shopSmartDisplay:this.data.shopSmartDisplay || []
    })


  },
  // 格式化时间戳
  formatTime(timestamp) {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  }
})