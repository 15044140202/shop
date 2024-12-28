// pages/set/sysSte/deviceManage/cupboard/cupboard.js
const app = getApp();
const appData = app.globalData;
const openDoor = require('../../../../../utils/blueLock/dbOpenDoor.js')

function flagToSysId(flag) {
  let num = parseInt(flag.match(/[0-9A-Fa-f]/g).join(''), 16);
  console.log(num)
  const intNum = parseInt(num)
  console.log(intNum)
  return parseInt(intNum.toString().slice(0, 4))
}
openDoor.cfg.sysID = flagToSysId(appData.shopInfo.shopFlag); //设置开锁模块的 系统id
Page({
  /**
   * 页面的初始数据
   */
  data: {
    device: appData.device,
    lockSetShow: false,
    useRuleSetShow: false,
    lockSelect: 0,

    dataChangeEd: false,

    system: ''
  },
  onClose() {
    wx.closeBluetoothAdapter()
  },
  downPic(){
    wx.navigateTo({
      url: `../../../../operate/tableInfo/tableQr/tableQr?optNum=${this.data.lockSelect + 1}&item=cupboardNum`,
    })
    return;
  },
  async tap(e) {
    console.log(e)
    if ('index' in e.mark) {
      this.setData({
        lockSelect: e.mark.index
      })
    }
    if (e.mark.item === "openDoor") { //开门
      if (!this.data.device.cupboard[e.mark.index].lockCode && !this.data.device.cupboard[e.mark.index].androidLockCode) { //未绑定柜门锁
        this.setData({
          lockSetShow: true
        })
        return;
      }
      console.log('执行开锁');
      app.showLoading('开锁中...', true)
      openDoor.cfg.lockID = e.mark.index + 1; //选择密码锁序号
      const deviceId = this.data.system === 'iOS' ? '' : this.data.device.cupboard[e.mark.index].androidLockCode
      const openRes = await openDoor.openLock(deviceId);
      wx.hideLoading();
      if (openRes !== 'error') {
        if (this.data.system === 'iOS' && !this.data.device.cupboard[e.mark.index].lockCode) {
          //保存 ios 设备ID
          await this.saveDeviceId('iOS', e.mark.index, openRes)
        } else {
          if (!this.data.device.cupboard[e.mark.index].androidLockCode) {
            //保存安卓 设备ID
            await this.saveDeviceId('android', e.mark.index, openRes)
          }
        }
        app.showToast('开锁成功!', 'success')
      } else {
        app.showToast('开锁失败!', 'error')
      }
      return;
    } else if (e.mark.item === "initialize") { //初始化 绑定
      if (this.data.device.cupboard[e.mark.index].lockCode === '' && (this.data.device.cupboard[e.mark.index].androidLockCode === '' || this.data.device.cupboard[e.mark.index].androidLockCode === undefined)) { //绑定密码锁
        const res = await wx.showModal({
          title: '提示',
          content: '请先按3下9键之后按#键,听到提示音后点击确定,开始绑定.点击取消返回!',
        })
        if (res.cancel) {
          return;
        }
        app.showLoading('蓝牙搜索中...', true)
        openDoor.cfg.lockID = e.mark.index + 1;
        console.log(openDoor.cfg)
        const deviceId = await openDoor.addDevice()
        wx.hideLoading();
        console.log(deviceId)
        if (deviceId !== 'error') {
          await this.bindLock(this.data.system, deviceId, e.mark.index)
        } else {
          app.showToast('添加失败', 'error')
        }
        return;
      } else { //解绑密码锁 同时恢复出厂设置
        const res = await wx.showModal({
          title: '提示',
          content: '请确定在锁附近操作,操作成功蓝牙锁恢复出厂设置,该柜子解除与该锁的绑定!取消返回,确定继续!',
        })
        if (res.cancel) {
          return;
        }
        console.log('进行恢复出厂设置!')
        app.showLoading('蓝牙搜索中...', true)
        openDoor.cfg.lockID = e.mark.index + 1
        const deviceId = this.data.system === 'iOS' ? '' : this.data.device.cupboard[e.mark.index].androidLockCode
        const unbindRes = await openDoor.unbindLock(deviceId)
        wx.hideLoading();
        if (unbindRes === 'error') { //恢复出厂设置失败!
          await wx.showModal({
            title: '提示',
            content: '恢复出厂设置失败!请确保在锁附近,并锁有电状态!',
          })
          const select = await wx.showModal({
            title: '提示',
            content: '密码锁恢复出厂设置失败,是否要清空绑定数据?清空后只能手动恢复出厂设置!\n点击确认清空\n点击取消不清空',
          })
          if (select.confirm) {
            await this.unbindLock(e.mark.index)
          }
          return;
        }
        await this.unbindLock(e.mark.index)
        return;
      }
    } else if (e.mark.item === "setShow") { //显示设置界面
      this.setData({
        lockSetShow: true
      })
      return;
    } else if (e.mark.item === 'setPassword') { //设置密码
      const res = await wx.showModal({
        title: '请输入密码',
        content: '设置150天有效期密码',
        editable: true,
        placeholderText: '6位数字'
      })
      if (res.confirm) {
        if (res.content.length !== 6 || !(/^[0-9]+$/.test(res.content))) {
          app.showToast('输入不合法', 'error');
          return;
        }
      } else {
        return;
      }
      const endtime = new Date(new Date().getTime() + 150 * 24 * 60 * 60 * 1000)
      app.showLoading('蓝牙搜索中...', true)
      openDoor.cfg.lockID = e.mark.index + 1
      const deviceId = this.data.system === 'iOS' ? '' : this.data.device.cupboard[e.mark.index].androidLockCode
      const setPasswordRes = await openDoor.setLockPassword(deviceId, res.content, app.getNowTime(endtime))
      wx.hideLoading();
      if (setPasswordRes !== 'error') {
        if (this.data.system === 'iOS' && !this.data.device.cupboard[e.mark.index].lockCode) {
          //保存 ios 设备ID
          await this.saveDeviceId('iOS', e.mark.index, setPasswordRes)
        } else {
          if (!this.data.device.cupboard[e.mark.index].androidLockCode) {
            //保存安卓 设备ID
            await this.saveDeviceId('android', e.mark.index, setPasswordRes)
          }
        }
        app.showToast('设置成功!', 'success')
      }
    } else if (e.mark.item === 'clearAll') { //清除所有密码
      const res = await wx.showModal({
        title: '警告',
        content: '是否清除所有密码 ? 确认继续.',
        editable: true,
        placeholderText: '6位数字/150天有效期'
      })
      if (res.cancel) {
        return;
      }
      app.showLoading('蓝牙搜索中...', true)
      openDoor.cfg.lockID = e.mark.index + 1;
      const deviceId = this.data.system === 'iOS' ? '' : this.data.device.cupboard[e.mark.index].androidLockCode
      const setPasswordRes = await openDoor.clearLockPassword(deviceId)
      wx.hideLoading();
      if (setPasswordRes !== 'error') {
        if (this.data.system === 'iOS' && !this.data.device.cupboard[e.mark.index].lockCode) {
          //保存 ios 设备ID
          await this.saveDeviceId('iOS', e.mark.index, setPasswordRes)
        } else {
          if (!this.data.device.cupboard[e.mark.index].androidLockCode) {
            //保存安卓 设备ID
            await this.saveDeviceId('android', e.mark.index, setPasswordRes)
          }
        }
        app.showToast('清除成功!', 'success')
      }
    } else if (e.mark.item === 'clearUser') {
      const res = await wx.showModal({
        title: '警告',
        content: '清除后使用者将无法开锁!请确认使用者不再继续使用.\n清除后请进行清除所有密码操作,防止密码泄露 ! 确认继续!',
      })
      if (res.cancel) {
        return;
      }
      await this.clearUser(e.mark.index)
    }
  },
  async saveDeviceId(system, myCupboardIndex, deviceId) {
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: system === 'iOS' ? `shop.device.cupboard.${myCupboardIndex}.lockCode` : `shop.device.cupboard.${myCupboardIndex}.androidLockCode`,
        data: deviceId
      }
    })
    console.log(res)
    if (system === 'iOS') {
      appData.device.cupboard[cupboardIndex].lockCode = deviceId;
      this.setData({
        [`device.cupboard[${cupboardIndex}].lockCode`]: deviceId
      })
    } else {
      if (appData.device.cupboard[cupboardIndex].androidLockCode) {
        appData.device.cupboard[cupboardIndex].androidLockCode = deviceId;
      } else {
        appData.device.cupboard[cupboardIndex] = {
          ...appData.device.cupboard[cupboardIndex],
          androidLockCode: deviceId
        }
      }
      this.setData({
        [`device.cupboard[${cupboardIndex}].androidLockCode`]: deviceId
      })
    }
    return
  },
  async clearUser(cupboardIndex) {
    const res = await app.callFunction({
      name: 'databaseRecord_set',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        record: `shop.device.cupboard.${cupboardIndex}.userInfo`,
        value: {}
      }
    })
    if (res === 'ok') {
      app.showToast('清除成功!', 'success');
      appData.device.cupboard[cupboardIndex].userInfo = {};
      this.setData({
        [`device.cupboard[${cupboardIndex}].userInfo`]: {}
      })
    } else {
      app.showToast('清除失败!', 'error');
    }
  },
  async unbindLock(cupboardIndex) {
    const res = await app.callFunction({
      name: 'databaseRecord_set',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        record: `shop.device.cupboard.${cupboardIndex}.lockCode`,
        value: ''
      }
    })
    const r = await app.callFunction({
      name: 'databaseRecord_set',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        record: `shop.device.cupboard.${cupboardIndex}.androidLockCode`,
        value: ''
      }
    })
    if (res === 'ok') {
      app.showToast('解绑成功!', 'success');
      appData.device.cupboard[cupboardIndex].lockCode = '';
      appData.device.cupboard[cupboardIndex] = {
        ...appData.device.cupboard[cupboardIndex],
        androidLockCode: ''
      }
      this.setData({
        [`device.cupboard[${cupboardIndex}].lockCode`]: '',
        [`device.cupboard[${cupboardIndex}].androidLockCode`]: ''
      })
    } else {
      app.showToast('解绑失败!', 'error');
    }
  },
  async bindLock(system, deviceId, cupboardIndex) {
    const obj = system === 'iOS' ? `shop.device.cupboard.${cupboardIndex}.lockCode` : `shop.device.cupboard.${cupboardIndex}.androidLockCode`
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: obj,
        data: deviceId
      }
    })
    if (res === 'ok') {
      app.showToast('绑定成功!', 'success');
      if (system === 'iOS') {
        appData.device.cupboard[cupboardIndex].lockCode = deviceId;
        this.setData({
          [`device.cupboard[${cupboardIndex}].lockCode`]: deviceId
        })
      } else {
        if (appData.device.cupboard[cupboardIndex].androidLockCode) {
          appData.device.cupboard[cupboardIndex].androidLockCode = deviceId;
        } else {
          appData.device.cupboard[cupboardIndex] = {
            ...appData.device.cupboard[cupboardIndex],
            androidLockCode: deviceId
          }
        }
        this.setData({
          [`device.cupboard[${cupboardIndex}].androidLockCode`]: deviceId
        })
      }
    } else {
      app.showToast('绑定失败!', 'error');
    }
  },
  video() {
    console.log('点击教程视频')
  },
  async addCupboard() {
    const nowTime = app.getNowTime().slice(0, 10);
    const cupboardData = {
      userInfo: {},
      lockCode: '',
      lastTime: nowTime,
      locakPassWord: ''
    }
    const res = await app.callFunction({
      name: 'databaseRecord_push',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        record: 'shop.device.cupboard',
        value: cupboardData
      }
    })
    if (res === 'ok') {
      this.data.device.cupboard.push(cupboardData)
      this.setData({
        device: this.data.device
      })
      app.showToast('添加成功!', 'success')
      return;
    } else {
      app.showToast('添加失败', 'error');
      return;
    }
  },
  async save() {
    if (this.data.dataChangeEd === true) {
      const res = await app.callFunction({
        name: 'amendDatabase_fg',
        data: {
          collection: 'shopAccount',
          flagName: 'shopFlag',
          flag: appData.shopInfo.shopFlag,
          objName: 'shop.device.cupboardUseRule',
          data: this.data.device.cupboardUseRule
        }
      })
      if (res === 'ok') {
        app.showToast('保存成功!', 'success')
        this.setData({
          dataChangeEd: false
        })
      }
    }
  },
  input(e) {
    this.setData({
      [`device.cupboardUseRule[${e.mark.index}].${e.mark.item}`]: parseInt(e.detail.value),
      dataChangeEd: true
    })

  },
  setting() {
    this.setData({
      useRuleSetShow: true
    })
  },
  getOsType() {
    const res = wx.getDeviceInfo();
    const system = res.system.slice(0, 3)

    return system === 'iOS' ? 'iOS' : 'android';
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.setData({
      system: this.getOsType()
    })
    if ('cupboardUseRule' in appData.device) { //有使用规则

    } else { //未设置使用规则 进行设置
      const cupboardUseRule = [{
        integral: 0,
        price: 0
      }, {
        integral: 0,
        price: 0
      }, {
        integral: 0,
        price: 0
      }]
      const res = await app.callFunction({
        name: 'amendDatabase_fg',
        data: {
          collection: 'shopAccount',
          flagName: 'shopFlag',
          flag: appData.shopInfo.shopFlag,
          objName: 'shop.device.cupboardUseRule',
          data: cupboardUseRule
        }
      })
      if (res === 'ok') {
        this.setData({
          device: {
            ...this.data.device,
            cupboardUseRule
          }
        })
        appData.device = {
          ...this.data.device,
          cupboardUseRule
        }
      } else {

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
    this.setData({
      device: appData.device
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