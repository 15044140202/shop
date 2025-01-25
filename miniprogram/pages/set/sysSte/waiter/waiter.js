// pages/set/sysSte/waiter/waiter.js
const app = getApp();
const appData = getApp().globalData;
import Dialog from '../../../../miniprogram_npm/@vant/weapp/dialog/dialog';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    member: appData.shop_member_set
  },
  set(e) {
    console.log(e.mark.mymark)
    wx.navigateTo({
      url: `./set/set?position=${e.mark.mymark}`,
    })
  },
  async delete(e) {
    console.log(e)
    Dialog.alert({
      title: '确认删除',
      message: this.data.member[e.mark.index].name,
      showCancelButton: true,
    }).then(() => {
      this.delete_1(e.mark.index);
    }).catch(() => {
      return;
    });
  },
  async delete_1(i) {
    console.log('执行删除MerchantInfo')
    const res = await this.deleteMerchantInfo(i)
    console.log(res)
    if (res === 'ok') {
      console.log('执行删除shopMember')
      const r = await this.deleteShopMember(i)
      if (r === 'ok') {
        app.showToast('删除成功!', 'success')
        const newData = [];
        for (let index = 0; index < this.data.member.length; index++) {
          const element = this.data.member[index];
          if (i != index) {
            newData.push(element)
          }
        }
        this.setData({
          member: newData
        })
        appData.shopInfo.shop.member = newData;
        return;
      } else {
        app.showToast('删除失败!', 'error')
        return;
      }
    } else {
      app.showToast('删除shopMember失败!', 'error');
      return ('error');
    }
  },
  async deleteMerchantInfo(i) {
    //首先 获取 店员的 merchantInfo  的 shopFlag数组
    console.log(this.data.member[i].memberOpenid)
    var shopFlag = [];
    const res = await app.callFunction({
      name: 'getDatabaseRecord_op',
      data: {
        collection: 'merchantInfo',
        openid: this.data.member[i].memberOpenid,
        record: 'shopFlag'
      }
    });
    console.log(res)
    if (Array.isArray(res)) {
      shopFlag = res;
      console.log(shopFlag)
    } else {
      console.log('获取店员店铺数据失败!')
      app.showToast('获取店员店铺数据失败!', 'error')
      return ('error');
    }
    //构造新数据
    var newShopFlag = [];
    for (let index = 0; index < shopFlag.length; index++) {
      const element = shopFlag[index];
      if (element.shopFlag === appData.shopInfo.shopFlag) {
        //删除项目
      } else {
        newShopFlag.push(element)
      }
    }
    console.log(newShopFlag)
    //向服务器发送新的  店员的 merchantInfo  的 shopFlag数组
    const r = await app.callFunction({
      name: 'amendDatabase_fg',
      data: {
        collection: "merchantInfo",
        flagName: '_openid',
        flag: this.data.member[i].memberOpenid,
        objName: "shopFlag",
        data: newShopFlag
      }
    });
    console.log(r)
    if (r === 'ok') {
      app.showToast('删除shopMember成功!', 'success');
      return ('ok');
    } else {
      app.showToast('删除shopMember失败!', 'error');
      return ('error');
    }
  },
  async deleteShopMember(i) {
    var newMember = [];
    const member = appData.shopInfo.shop.member;
    for (let index = 0; index < member.length; index++) {
      const element = member[index];
      if (i == index) {

      } else {
        newMember.push(element)
      }
    }
    const res = await app.callFunction({
      name:'amendDatabase_fg',
      data: {
        collection: 'shopAccount',
        flagName: 'shopFlag',
        flag: appData.shopInfo.shopFlag,
        objName: 'shop.member',
        data: newMember
      }
    });
    if (res === 'ok') {
      app.showToast('删除shopMember成功!', 'success');
      return ('ok');
    } else {
      app.showToast('删除shopMember失败!', 'error');
      return ('error');
    }
  },
  add(e) {
    console.log(e)
    const that = this;
    wx.navigateTo({
      url: `./newWaiter/newWaiter?position=${e.mark.mymark}`,
      events: {
        updata: function (data) {
          console.log(data)
        }
      },
      success: function (res) {
        res.eventChannel.emit('giveData', that.data.member)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //获取现有权限测量

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