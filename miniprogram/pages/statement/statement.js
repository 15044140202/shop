// pages/satement/statement.js
const app = getApp()
const appData = app.globalData;

function getOrderSum(item, orderForm) {
  var sum = 0;
  for (let index = 0; index < orderForm.length; index++) {
    const element = orderForm[index];
    if (item === '商品单') {
      if (element.orderName === '商品单') {
        sum += element.commotidyCost;
      }
    }
    if (element.orderName != '商品单') {
      if (item === '未结账') {
        if (element.endTime === '未结账') {
          sum += 1;
        }
      } else {
        if (element.endTime != '未结账') {
          sum += 1;
        }
      }
    }



  }
  return sum;
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shopNameArray: [],
    shopName_seletNum: 0,

    AccountsTotal: app.globalData.AccountsTotal,
    cash_data: [],
    card_data: [],
    item_data: [],
    sattement_data: [],
    warn_data: [],
    debt_data: []
  },
  dataLoad() {
    this.setData({
      cash_data: [{
          name: "现金",
          url: '/pages/statement/cash/cash?id=cash'
        },
        {
          name: "微信",
          url: '/pages/statement/cash/cash?id=wx'
        }
      ],
      card_data: [{
          name: "会员卡",
          url: "/pages/statement/cash/cash?id=vip"
        },
        {
          name: "会员欠款",
          url: "/pages/statement/cash/cash?id=vipOwe"
        },
        {
          name: "代金券",
          url: "/pages/statement/cash/cash?id=cashCoupon"
        },
        {
          name: "美团券",
          url: "/pages/statement/cash/cash?id=mtCoupon"
        },
        {
          name: "抖音券",
          url: "/pages/statement/cash/cash?id=dyCoupon"
        }
      ],
      item_data: [{
          sum: 2812,
          yuan: "元",
          name: "桌台费"
        },
        {
          sum: 0,
          yuan: "元",
          name: "台内商品费"
        },
        {
          sum: 0,
          yuan: "元",
          name: "外卖商品费"
        },
        {
          sum: 0,
          yuan: "元",
          name: "会员储值"
        },
        {
          sum: 0,
          yuan: "元",
          name: "优惠券销售"
        }
      ],
      sattement_data: [{
          sum: getOrderSum('未结账', appData.orderForm),
          yuan: "单",
          name: "未结单据",
          path: './orderForm/orderForm?item=未结账单据'
        },
        {
          sum: getOrderSum('已结账', appData.orderForm),
          yuan: "单",
          name: "已结单据",
          path: './orderForm/orderForm?item=已结账单据'
        },
        {
          sum: 0,
          yuan: "个",
          name: "新办会员"
        },
        {
          sum: 800,
          yuan: "元",
          name: "会员储值"
        },
        {
          sum: 0,
          yuan: "次",
          name: "商品入库记录"
        },
        {
          sum: 0,
          yuan: "元",
          name: "商品入库报表"
        },
        {
          sum: getOrderSum('商品单', appData.orderForm),
          yuan: "元",
          name: "商品销售报表",
          path: './orderForm/orderForm?item=商品单'
        },
        {
          sum: 0,
          yuan: "元",
          name: "退货报表"
        },
        {
          sum: 0,
          yuan: "次",
          name: "商品清点记录"
        },
        {
          sum: 0,
          yuan: "次",
          name: "员工配送统计"
        },
        {
          sum: 0,
          yuan: "次",
          name: "收取员工现金记录"
        },
        {
          sum: appData.memberAttendance.length,
          yuan: "次",
          name: "员工本月打卡记录",
          path: './attendance/attendance'
        },
        {
          sum: 0,
          yuan: "人",
          name: "打扫开灯记录"
        },
        {
          sum: 0,
          yuan: "元",
          name: "余额调整"
        },
        {
          sum: 0,
          yuan: "张",
          name: "赠送优惠券"
        },
        {
          sum: 2909.0,
          yuan: "元",
          name: "微信收支明细"
        },
        {
          sum: 145.0,
          yuan: "元",
          name: "微信退款明细"
        },
        {
          sum: 0,
          yuan: "位",
          name: "预定列表"
        },
        {
          sum: 0,
          yuan: "次",
          name: "开门记录"
        }
      ],
      warn_data: [{
          sum: 1,
          yuan: "个",
          name: "库存不足"
        },
        {
          sum: 0,
          yuan: "个",
          name: "今日生日"
        },
        {
          sum: 0,
          yuan: "元",
          name: "微信实时余额"
        }
      ],
      debt_data: [{
        sum: 0,
        yuan: "元",
        name: "客人欠款"}, 
      ]
    })
  },
  bindPickerChange(event) {
    console.log('picker发送选择改变，携带值为', event.detail.value);
    this.setData({
      shopName_seletNum: event.detail.value
    });
    appData.shopSelect = event.detail.value;
  },
  async goto(e) {
    app.showLoading('加载中...', true)
    var itemNum = '';
    var itemName = '';
    if (e.mark.item === 'turnover') {
      itemNum = 0;
      itemName = '查看营业额'
    } else if (e.mark.item === 'collectionType') {
      itemNum = 1;
      itemName = '按收款方式查询'
    } else if (e.mark.item === 'collectionItem') {
      itemNum = 2;
      itemName = '按收入项目查询'
    } else if (e.mark.item === '未结账单据') {
      itemNum = 3;
      itemName = '未结账单据'
    } else if (e.mark.item === '已结账单据') {
      itemNum = 4;
      itemName = '已结账单据'
    } else if (e.mark.item === '商品销售报表') {
      itemNum = 7;
      itemName = '商品销售报表'
    }
    if (await app.power('statement', itemNum, itemName) === false) {
      app.noPowerMessage()
      return;
    }
   appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate());
    wx.hideLoading()
    wx.navigateTo({
      url: e.mark.path,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    //初次加载  取得店铺名称列表
    for (let index = 0; index < appData.merchantInfo.shopFlag.length; index++) {
      let element = appData.merchantInfo.shopFlag[index];
      this.data.shopNameArray.push(element.shopName)
      console.log("店铺名称集:" + this.data.shopNameArray[index])
    }
    this.setData({
      shopNameArray: this.data.shopNameArray
    })
    this.dataLoad();
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
  async onPullDownRefresh() {
    app.showLoading('数据加载中...', true);
    appData.orderForm = await app.getOrderForm(appData.shopInfo.shopFlag, app.getNowDate());
    wx.stopPullDownRefresh();
    wx.hideLoading();
    this.dataLoad();
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