// pages/create-competition/create-competition.js
const app = getApp()
const appData = app.globalData
Page({
  data: {
    startDate: '',
    startTime: '',
    playDate: '',
    playTime: '',
    playerMaxSum: 8,
    towLow: 8,
    status: 0, // 默认报名中
    selectedRule: 'standard',
    rules: '标准规则',
    prizes: {
      first: '',
      second: '',
      third: ''
    },
    totalPrize: 0,
    location: '',
    entryFee: 0,
    sEntryFee: 0
  },

  onLoad: function (options) {
    // 设置默认时间为当前时间
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.setData({
      startDate: date,
      startTime: time,
      playDate: date,
      playTime: time,
    });
  },

  // 日期选择器变化
  bindStartDateChange: function (e) {
    this.setData({
      startDate: e.detail.value
    });
  },
  bindEndDateChange: function (e) {
    this.setData({
      playDate: e.detail.value
    });
  },
  // 时间选择器变化
  bindStartTimeChange: function (e) {
    this.setData({
      startTime: e.detail.value
    });
  },
  bindEndTimeChange: function (e) {
    this.setData({
      playTime: e.detail.value
    });
  },

  // 参赛人数调整
  decreasePlayer: function (e) {
    let sum
    const item = e.mark.item
    switch (item) {
      case 'towLow'://设置双败
        sum = this.data.towLow
        if (sum >= 16) {
          sum /= 2
          this.setData({
            towLow: sum
          });
        }
        break;
      default://设置最大人数
        sum = this.data.playerMaxSum
        if (sum >= 16) {
          sum /= 2
          this.setData({
            playerMaxSum: sum
          });
        }
        break;
    }
  },

  increasePlayer: function (e) {
    const item = e.mark.item
    let sum
    switch (item) {
      case 'towLow'://设置双败
        sum = this.data.towLow
        sum *= 2
        this.setData({
          towLow: sum
        })
        break;
      default://设置最大人数
        sum = this.data.playerMaxSum
        sum *= 2
        this.setData({
          playerMaxSum: sum
        })
        break;
    }
  },

  // 选择比赛规则
  selectRule: function (e) {
    const rule = e.currentTarget.dataset.rule;
    let rulesText = '';

    switch (rule) {
      case 'standard':
        rulesText = '标准规则';
        break;
      case 'american':
        rulesText = '美式8球规则';
        break;
      case 'custom':
        rulesText = '';
        break;
    }

    this.setData({
      selectedRule: rule,
      rules: rulesText
    });
  },

  // 奖金输入处理
  onPrizeInput: function (e) {
    const prizeType = e.currentTarget.dataset.prize;
    const value = e.detail.value;

    this.setData({
      [`prizes.${prizeType}`]: value
    });

    // 计算总奖金
    this.calculateTotalPrize();
  },
  //报名费用
  onEntryFee: function (e) {
    console.log(e)
    const prizeType = e.currentTarget.dataset.prize;
    const value = e.detail.value;
    const num = Number(value)
    // 非数字判断
    if (isNaN(num)) {
      app.showToast('请输入有效数字', 'none');
      return;
    }
    // 保留两位小数并乘以100
    const result = Number(num.toFixed(2))
    if (prizeType === 'first') {
      this.setData({
        entryFee: result
      });
    } else {
      this.setData({
        sEntryFee: result
      });
    }

  },
  // 计算总奖金
  calculateTotalPrize: function () {
    const { first, second, third } = this.data.prizes;
    const total = (Number(first) || 0) + (Number(second) || 0) + (Number(third) || 0);

    this.setData({
      totalPrize: total
    });
  },
  //获取比赛地点
  async getLocation() {
    const res = await wx.chooseLocation({})
    console.log(res)
    this.setData({
      location: res
    })
    console.log(this.data.location)
  },
  // 选择比赛状态
  selectStatus: function (e) {
    const status = parseInt(e.currentTarget.dataset.status);
    this.setData({
      status: status
    });
  },

  // 表单提交
  formSubmit: async function (e) {
    const formData = e.detail.value;
    console.log(formData)
    // 验证表单数据
    if (!formData.competitionName) {
      wx.showModal('请输入比赛名称');
      return;
    }

    if (!formData.location) {
      wx.showModal('请输入比赛地点');
      return;
    }
    //验证报名费
    if (!this.data.entryFee) {
      if (!this.data.entryFee) {
        const res = await wx.showModal({
          title: '确认',
          content: '确认要0报名费发起比赛吗?',
        })
        if (res.cancel) {
          app.showModal('请输入报名费');
          return;
        }
        this.data.entryFee = 0
      } else {
        app.showModal('请输入报名费');
        return;
      }
    }
    if (!this.data.sEntryFee) {
      if (!this.data.sEntryFee) {
        const res = await wx.showModal({
          title: '确认',
          content: '确认要0二报费发起比赛吗?',
        })
        if (res.cancel) {
          app.showModal('请输入二报费');
          return;
        }
        this.data.sEntryFee = 0
      } else {
        app.showModal('请输入二报费');
        return;
      }
    }
    if (!this.data.location.latitude || !this.data.location.longitude) {
      wx.showToast({
        title: '请在地图上选择比赛地点坐标',
        icon: 'none'
      });
      return;
    }
    if (this.data.location?.name !== formData.location) {
      this.data.location.name = formData.location
    }

    // 处理规则数据
    let finalRules = this.data.rules;
    if (this.data.selectedRule === 'custom' && formData.customRules) {
      finalRules = formData.customRules;
    }

    // 计算时间戳
    const startTimestamp = new Date(`${this.data.startDate} ${this.data.startTime}`).getTime();
    const playTimestamp = new Date(`${this.data.playDate} ${this.data.playTime}`).getTime();

    // 验证时间
    if (startTimestamp >= playTimestamp) {
      wx.showToast({
        title: '比赛时间必须晚于报名时间',
        icon: 'none'
      });
      return;
    }
    // 构建完整的比赛数据
    const competitionData = {
      orderType: 'competition',
      shopId: appData.shop_account._id,
      competitionName: formData.competitionName,
      playerMaxSum: this.data.playerMaxSum,
      towLow: this.data.towLow,
      nowPlayerSum: 0, // 初始为0
      status: this.data.status,
      location: this.data.location,
      start_time: startTimestamp,
      play_time: playTimestamp,
      round: 0,//'0报名1预选赛2双败赛',
      rules: finalRules,
      prizes: this.data.prizes,
      totalPrize: this.data.totalPrize,
      entryFee: this.data.entryFee * 100,
      sEntryFee: this.data.sEntryFee * 100,
      version: 0
    };

    // 这里可以添加将数据提交到服务器的代码
    console.log('比赛数据:', competitionData);
    const res = await app.callFunction({
      name: 'addRecord',
      data: {
        collection: 'competition',
        data: competitionData
      }
    })
    if (!res.success) {
      app.showModal('创建失败!')
      return
    }
    app.showModal('创建成功')
    wx.navigateBack()
  }
});