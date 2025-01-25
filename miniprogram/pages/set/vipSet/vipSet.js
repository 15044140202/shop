// pages/set/vipSet/vipSet.js
const appData = getApp().globalData;
const app = getApp();
import Dialog from '../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shop_vip_set: [],
    shop_charging: [],
    videoShow: false,
    videoUrl: 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/video/%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E4%BC%9A%E5%91%98%E7%BA%A7%E5%88%AB.mp4?sign=0cbc5413359b96f4597e5ef71e666da5&t=1721455226'
  },
  video() {
    this.setData({
      videoShow: true
    })
  },
  goto(e) {
    console.log(e)
    const that = this;
    wx.navigateTo({
      url: `./vipInfoSet/vipInfoSet?index=${e.mark.index}`,
      events: {
        returnData: function (params) {
          that.setData({
            [`shop_vip_set.vipSet`]: params
          })
          console.log(params)
        },
      },
      success: function (res) {
        res.eventChannel.emit('giveData', {
          data: that.data.shop_vip_set.vipSet
        })
      }
    })

  },
  delete(e) {
    if (e.mark.index === 0) {
      Dialog.alert({
        title: `提示!!!`,
        message: '系统默认(非会员)不可删除!',
      }).then(() => {
        // on confirm
      })
    } else {
      Dialog.confirm({
        title: `确认删除${this.data.shop_vip_set.vipSet[e.mark.index].name}?`,
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
    this.data.shop_vip_set.vipSet.splice(i,1)
    this.setData({
      shop_vip_set:this.data.shop_vip_set
    })
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_vip_set',
        query:{
          shopId:appData.shop_account._id
        },
        upData:{
          vipSet:this.data.shop_vip_set.vipSet
        }
      }
    })
    if (res.success) {
      app.showToast('删除成功!', 'success')
    } else {
      app.showToast('删除失败!', 'error')
    }

  },
  async newVipLevel() {
    let newVip =JSON.parse(JSON.stringify(this.data.shop_vip_set.vipSet[0])) ;
    newVip.name = '未定义'
    newVip.vipSum = 0;
    const res = await app.callFunction({
      name: 'record_push',
      data: {
        collection: 'shop_vip_set',
        query:{
          shopId:appData.shop_account._id
        },
        record:'vipSet',
        data:newVip
      }
    })
    if (res.success) {
      this.data.shop_vip_set.vipSet.push(newVip)
      this.setData({
        shop_vip_set: this.data.shop_vip_set
      })
    } else {
      app.showToast('添加失败!', 'error')
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
    const vipInfo = this.data.shop_vip_set.vipSet;
    const charging = this.data.shop_charging;
    var change = false;

    for (let vipInfoi = 0; vipInfoi < vipInfo.length; vipInfoi++) { //此循环 是检测 vip数据里面 是否有 已经被删除的  计费规则
      var newArray = []
      const vipInfoElement = vipInfo[vipInfoi];
      for (let chargingDiscounti = 0; chargingDiscounti < vipInfoElement.chargingDiscount.length; chargingDiscounti++) {
        const chargingDiscountElement = vipInfoElement.chargingDiscount[chargingDiscounti]; //每个vip数据 里面的绑定的 每个计费规则
        for (let chargingi = 0; chargingi < charging.length; chargingi++) {
          const chargingId = charging[chargingi]._id; //每个计费规则的 flag
          if (chargingId === chargingDiscountElement.chagingId) {
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
            chargingId: element._id,
            discount: 10
          });
          change = true;
        } else { //如果vip 数据中有计费规则数据  则遍历一遍 看是否有此计费汇总       
          for (let cdi = 0; cdi < vipInfo[index].chargingDiscount.length; cdi++) {
            const cdelement = vipInfo[index].chargingDiscount[cdi];
            if (cdelement.chargingId === element._id) { //次计费规则存在  跳出此循环
              break
            } else if (cdi === vipInfo[index].chargingDiscount.length - 1) { //此计费规则不存在  添加
              vipInfo[index].chargingDiscount.push({
                name: element.name,
                chargingId: element._id,
                discount: 10
              });
              change = true;
            }
          }
        }
      }
    }
    console.log(this.data.shop_vip_set)
    return change;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    app.showLoading('加载中...', true)
    this.setData({
      shop_charging: appData.shop_charging,
      shop_vip_set: appData.shop_vip_set
    })
    console.log(this.data.shop_charging);
    //再次检测 会员信息里面是否存在 全部的 charging 如果确定 后期添加了 新的计费规则 返回true
    if (this.settleCharing() === true) { //修改过数据 向服务器发送修改后的数据
      const newData = this.data.shop_vip_set
      const _id = newData._id
      delete newData._id
      const r = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'shop_vip_set',
          query: {
            _id: _id
          },
          upData: newData
        }
      })
      console.log(r)
      if (!r.success) {
        appData.showModal('错误', '保存会员设置信息错误!')
        return
      }
      appData.shop_vip_set = this.data.shop_vip_set
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