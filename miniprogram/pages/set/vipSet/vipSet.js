// pages/set/vipSet/vipSet.js
const appData = getApp().globalData;
const app = getApp();
const db = wx.cloud.database();
const utils = require('../../../utils/light');
import Dialog from '../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    vipInfo: [],
    charging: [],
    videoShow:false,
    videoUrl:'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/video/%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E4%BC%9A%E5%91%98%E7%BA%A7%E5%88%AB.mp4?sign=0cbc5413359b96f4597e5ef71e666da5&t=1721455226'
  },
  video(){
    this.setData({
      videoShow:true
    })
  },
  goto(e) {
    console.log(e)
    const that = this;
    wx.navigateTo({
      url: `./vipInfoSet/vipInfoSet?index=${e.mark.index}`,
      events: {
        returnData: function (params) {
          if (params.data === 'ok') {
            that.setData({
              vipInfo: that.data.vipInfo
            })
          }
          console.log(params)
        },
      },
      success: function (res) {
        res.eventChannel.emit('giveData', {
          data: that.data.vipInfo
        })
      }
    })

  },
  delete(e) {
    if (e.mark.index === 0) {
      Dialog.alert({
        title: `提示!!!`,
        message: '系统默认(青铜会员)不可删除!',
      }).then(() => {
        // on confirm
      })
    } else {
      Dialog.confirm({
          title: `确认删除${this.data.vipInfo[e.mark.index].name}?`,
          message: '删除此级别后此级别会员将在下次登录客户端时根据自身积分重新定位自己的会员级别!',
        })
        .then(() => {
          this.deleteVipLevl(e.mark.index)
          // on confirm
        })
        .catch(() => {
          // on cancel
        });
    }
  },
  async deleteVipLevl(i) {
    var newData = [];
    for (let index = 0; index < this.data.vipInfo.length; index++) { //遍历 全部数据 除了想删除的数据外赋值 给新对象
      const element = this.data.vipInfo[index];
      index === i ? console.log('删除:' + index) : newData.push(element)
    }
    const res = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection:'vipInfo',
        flagName:'shopFlag',
        flag:appData.shopInfo.shopFlag,
        objName:'vipInfo',
        data:newData
      }
    })
    if (res === 'ok') {
      app.showToast('删除成功!', 'success')
      this.setData({
        vipInfo: newData
      })
    } else {
      app.showToast('删除失败!', 'error')
    }

  },
  async newVipLevel() {
    let newVip = JSON.parse(JSON.stringify(this.data.vipInfo[0]));
    newVip.name = '未定义'
    newVip.vipSum = 0;
    const res = await app.callFunction({
      name: 'addArrayDatabase_fg',
      data: {
        collection: 'vipInfo',
        shopFlag: appData.shopInfo.shopFlag,
        objName: 'vipInfo',
        data: newVip
      }
    })
    if (res === 'ok') {
      this.setData({
        vipInfo: await this.getVipInfo(appData.shopInfo.shopFlag)
      })
    } else {
      app.showToast('添加失败!', 'error')
    }
  },
  async getVipInfo(shopFlag) {
    const res = await app.callFunction({
      name: 'getVipInfo',
      data: {
        shopFlag: shopFlag,
        getVipSum: true,
      }
    })
    console.log(res)
    if (res.vipInfo.length > 0) {
      console.log(res.vipInfo)
      return res.vipInfo
    } else {
      app.showToast('获取vipInfo失败!', 'error')
      console.log(res)
      return []
    }
  },
  falgChangeName(flag) {
    const chaging = this.data.chaging;
    for (let index = 0; index < chaging.length; index++) {
      const element = chaging[index];
      if (element.flag === flag) {
        return element.name
      }
    }
  },
  getChargingFlag() {
    const chaging = this.data.chaging;
    const flag = [];
    for (let index = 0; index < chaging.length; index++) {
      const element = chaging[index];
      flag.push(element.flag);
    }
    return flag;
  },
  settleCharing() {
    const vipInfo = this.data.vipInfo;
    const charging = this.data.charging;
    var change = false;

    for (let vipInfoi = 0; vipInfoi < vipInfo.length; vipInfoi++) { //此循环 是检测 vip数据里面 是否有 已经被删除的  计费规则
      var newArray = []
      const vipInfoElement = vipInfo[vipInfoi];
      for (let chargingDiscounti = 0; chargingDiscounti < vipInfoElement.chargingDiscount.length; chargingDiscounti++) {
        const chargingDiscountElement = vipInfoElement.chargingDiscount[chargingDiscounti]; //每个vip数据 里面的绑定的 每个计费规则
        for (let chargingi = 0; chargingi < charging.length; chargingi++) {
          const flag = charging[chargingi].flag; //每个计费规则的 flag
          if (flag === chargingDiscountElement.flag) {
            //成立  则此计费规则存在  向新数组里面添加此项
            newArray.push(chargingDiscountElement)
            break
          } else if (chargingi === charging.length - 1) { //舍弃此项  计费规则  标记数据有修改 返回真 更新数据库
            change = true
          }
        }
      }
      vipInfo[vipInfoi].chargingDiscount = newArray //修改 遍历过的数据
    }
    for (let index = 0; index < vipInfo.length; index++) { //此循环 是检测 VIP数据里面是否 包含全部的 计费规则
      const chargingDiscount = vipInfo[index].chargingDiscount; //每个会员级别的  计费规则折扣
      for (let chargingI = 0; chargingI < charging.length; chargingI++) { //循环检测  vip数据中是否有现有计费规则
        const element = charging[chargingI];
        if (chargingDiscount.length === 0) { //vip 数据中 没有任何计费规则的情况
          vipInfo[index].chargingDiscount.push({
            name: element.name,
            flag: element.flag,
            discount: vipInfo[index].defaultDiscount
          });
          change = true;
        } else { //如果vip 数据中有计费规则数据  则遍历一遍 看是否有此计费汇总       
          for (let cdi = 0; cdi < vipInfo[index].chargingDiscount.length; cdi++) {
            const cdelement = vipInfo[index].chargingDiscount[cdi];
            if (cdelement.flag === element.flag) { //次计费规则存在  跳出此循环
              break
            } else if (cdi === vipInfo[index].chargingDiscount.length - 1) { //此计费规则不存在  添加
              vipInfo[index].chargingDiscount.push({
                name: element.name,
                flag: element.flag,
                discount: vipInfo[index].defaultDiscount
              });
              change = true;
            }
          }
        }
      }
    }
    return change;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading('加载中...', true)
    const res = await app.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'charging',
        record: 'charging',
        shopFlag: appData.shopInfo.shopFlag
      }
    });
    this.data.charging = res;
    console.log(this.data.charging);
    this.settleCharing();
    console.log(this.data.vipInfo);
    this.setData({
      charging: this.data.charging,
      vipInfo: await this.getVipInfo(appData.shopInfo.shopFlag)
    })
    //再次检测 会员信息里面是否存在 全部的 charging 如果确定 后期添加了 新的计费规则 返回true
    if (this.settleCharing() === true) { //修改过数据 向服务器发送修改后的数据
      const r = await app.callFunction({
        name: 'amendDatabase_fg',
        data: {
          collection: 'vipInfo',
          flagName: 'shopFlag',
          flag: appData.shopInfo.shopFlag,
          objName: 'vipInfo',
          data: this.data.vipInfo
        }
      })
      console.log(r)
      this.setData({
        vipInfo: this.data.vipInfo
      })
    }
    wx.hideLoading()
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

  }
})