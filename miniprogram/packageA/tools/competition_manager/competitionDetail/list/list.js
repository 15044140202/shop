// pages/tools/competition_manager/competitionDetail/list/list.js
const app = getApp()
const appData = app.globalData

Page({

  /**
   * 页面的初始数据
   */
  data: {
    playerData: [],
    competition: {},
    pyramidLayers: [],
    pyramidLayers_win: [],
    pyramidLayers_low: [],
    pyramidLayers_final: [],

    winOrLow: 'win',//胜组/败组 win / low
    infoIndex: -1,
  },
  async levelAdd(winOrLow, level) {
    const competitionId = this.data.competition._id
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const tree = this.data.pyramidLayers
    const levelInfo = tree[level].nodes
    console.log(levelInfo)
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competitionId,
          orderType: orderType
        },
        _unshift: {
          tree: { width: 1, nodes: [{}], level: 1 }
        }
      }
    })
    if (!res.success) {
      app.showModal('操作失败!请返回主页面重新加载数据后尝试!')
      return
    }
    this.data.pyramidLayers.unshift({ width: 1, nodes: [{}], level: 1 })
    this.setData({
      pyramidLayers: this.data.pyramidLayers
    })
  },
  async levelDelete(winOrLow, level) {
    const competitionId = this.data.competition._id
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const tree = this.data.pyramidLayers
    const levelInfo = tree[level].nodes
    console.log(levelInfo)
    //先验证 该级所有成员是否为空
    for (let index = 0; index < levelInfo.length; index++) {
      const element = levelInfo[index];
      if (Object.keys(element).length > 0) {
        app.showModal('不能删除已有晋级选手的整层!')
        throw 'error --- 不能删除已有晋级选手的整层'
      }
    }
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competitionId,
          orderType: orderType
        },
        _shift: {
          tree: ''
        }
      }
    })
    if (!res.success) {
      app.showModal('操作失败!请返回主页面重新加载数据后尝试!')
      return
    }
    this.data.pyramidLayers.shift()
    this.setData({
      pyramidLayers: this.data.pyramidLayers
    })
  },
  /**
   * @description 重置某级长度
   */
  async reSetLevelLong(winOrLow, level) {
    const competitionId = this.data.competition._id
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const tree = this.data.pyramidLayers
    const levelInfo = tree[level].nodes
    console.log(levelInfo)
    //选择新长度
    const longRes = await wx.showModal({
      title: '设置选手数量',
      editable: true
    })
    console.log(longRes)
    const newLong = parseInt(longRes.content)
    if (newLong <= 0) {
      app.showModal('输入的数值非法')
      throw 'error --- 输入的数值非法'
    }
    let newData = []
    if (newLong < levelInfo.length) {//缩减长度
      //判断 此级 这个长度 以后的数据是否全部为空
      for (let index = 0; index < levelInfo.length; index++) {
        const element = levelInfo[index];
        if (Object.keys(element).length > 0 && index + 1 > newLong) {
          app.showModal('不能删除已有晋级选手数据的位置!')
          throw 'error --- 不能删除已有晋级选手数据的位置'
        }
      }
      newData = tree[level].nodes.splice(0, newLong)
    } else {//增加长度
      newData = tree[level].nodes
      const longSum = newLong - levelInfo.length
      for (let index = 0; index < longSum; index++) {
        newData.push({})
      }
    }
    console.log(newData)
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competitionId,
          orderType: orderType
        },
        upData: {
          [`tree.${level}.nodes`]: newData,
          [`tree.${level}.width`]: newLong,
        }
      }
    })
    if (!res.success) {
      app.showModal('操作失败!请返回主页面重新加载数据后尝试!')
      return
    }
    this.data.pyramidLayers[level].width = newLong
    this.data.pyramidLayers[level].nodes = newData
    this.setData({
      pyramidLayers: this.data.pyramidLayers
    })

  },
  async longTap(e) {
    console.log(e)
    const level = e.mark.index
    const winOrLow = this.data.winOrLow
    const res = await wx.showActionSheet({
      itemList: ['删除第一级', '调整此级长度', '向前插入一级'],
    })
    console.log(res)
    if (res.tapIndex === 0) {//删除此级
      this.levelDelete(winOrLow, level)
    } else if (res.tapIndex === 1) {//调整长度
      this.reSetLevelLong(winOrLow, level)
    } else if (res.tapIndex === 2) {//向前插入一级
      this.levelAdd(winOrLow, level)
    }
  },
  /**
 * @description 显示某级别详情
 */
  async displayComInfo(e) {
    console.log(e)
    if (e.mark.index === this.data.infoIndex) {//隐藏显示
      this.setData({
        infoIndex: NaN
      })
      return
    }
    this.setData({
      infoIndex: e.mark.index
    })
  },
  async switchTab(e) {
    console.log(e)
    const competition = this.data.competition
    const winOrLow = e.currentTarget.dataset.tab
    if (winOrLow === this.data.winOrLow) {
      //无需切换
      return
    }
    if (winOrLow === 'low') {//切换到败组
      if (competition.round !== 2) {
        app.showModal('当前未开启/设置双败阶段')
        return
      }
      //获取数据
      await this.getTowLowData()
      this.setData({
        winOrLow: 'low'
      })

    }
    if (winOrLow === 'final') {//切换到总决赛
      //判断 胜组 和 败组 是否都有冠军了
      const win1 = this.data.pyramidLayers_win[0].nodes[0]
      const low1 = this.data?.pyramidLayers_low[0]?.nodes[0]
      console.log({ win1: win1, low1: low1 })
      if ((!win1 || Object.keys(win1).length <= 0) || (!low1 || Object.keys(low1).length <= 0)) {
        app.showModal('总决赛请在胜组和败组决赛后开启.')
        return
      }
      //获取总决赛 数据
      await this.getFinalData()
      this.setData({
        winOrLow: 'final'
      })
    }
    if (winOrLow === 'win') {//切换到胜组
      this.setData({
        pyramidLayers: this.data.pyramidLayers_win,
        winOrLow: 'win'
      })
    }
  },
  /**
   * @description 上传比分
   * @param {*} e 
   */
  async upDateScore(e) {
    console.log(e)
    const winOrLow = this.data.winOrLow
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const competition = this.data.competition
    const level = this.data.infoIndex
    const index = e.mark.index
    //判断两位选手是否都存在
    const pyramidLayers = this.data.pyramidLayers
    if (Object.keys(pyramidLayers[level].nodes[index]).length === 0) {
      app.showModal('该位置无选手')
      throw 'error 该位置无选手'
    }
    //上传比分
    const res1 = await wx.showModal({
      title: '请输入比分',
      editable: true,
    })
    if (res1.cancel) {
      return
    }
    const score = parseInt(res1.content)
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: orderType
        },
        upData: {
          [`tree.${level}.nodes.${index}.score`]: score,
        }
      }
    })
    if (!res.success) {
      app.showToast('操作失败!')
      throw 'error --- 操作失败!'
    }
    if (winOrLow === 'win') {
      this.data.pyramidLayers_win[level].nodes[index].score = score
    } else if (winOrLow === 'low') {
      this.data.pyramidLayers_low[level].nodes[index].score = score
    } else if (winOrLow === 'final') {
      this.data.pyramidLayers_final[level].nodes[index].score = score
    }
    this.setData({
      [`pyramidLayers[${level}].nodes[${index}].score`]: score,
    })
  },
  /**
   * @description //上传桌台号码
   * @param {*} e 
   */
  async upDateTbaleNum(e) {
    console.log(e)
    const winOrLow = this.data.winOrLow
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const competition = this.data.competition
    const level = this.data.infoIndex
    const index = e.mark.index
    //判断两位选手是否都存在
    const pyramidLayers = this.data.pyramidLayers
    if (Object.keys(pyramidLayers[level].nodes[index]).length === 0 || Object.keys(pyramidLayers[level].nodes[index - 1]).length === 0) {
      app.showModal('无法为未分配选手的对战分配桌台')
      throw 'error 无法为未分配选手的对战分配桌台'
    }
    //上传比分
    const res1 = await wx.showModal({
      title: '请输入桌台号码',
      editable: true,
    })
    if (res1.cancel) {
      return
    }
    const tableNum = parseInt(res1.content)
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: orderType
        },
        upData: {
          [`tree.${level}.nodes.${index}.tableNum`]: tableNum,
          [`tree.${level}.nodes.${index - 1}.tableNum`]: tableNum,
        }
      }
    })
    if (!res.success) {
      app.showToast('操作失败!')
      throw 'error --- 操作失败!'
    }
    if (winOrLow === 'win') {
      this.data.pyramidLayers_win[level].nodes[index].tableNum = tableNum
      this.data.pyramidLayers_win[level].nodes[index - 1].tableNum = tableNum
    } else if (winOrLow === 'low') {
      this.data.pyramidLayers_low[level].nodes[index].tableNum = tableNum
      this.data.pyramidLayers_low[level].nodes[index - 1].tableNum = tableNum
    } else if (winOrLow === 'final') {
      this.data.pyramidLayers_final[level].nodes[index].tableNum = tableNum
      this.data.pyramidLayers_final[level].nodes[index - 1].tableNum = tableNum
    }
    this.setData({
      [`pyramidLayers[${level}].nodes[${index}].tableNum`]: tableNum,
      [`pyramidLayers[${level}].nodes[${index - 1}].tableNum`]: tableNum
    })

  },
  //获取决赛组数据
  async getFinalData() {
    const competition = this.data.competition
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'competition',
        query: {
          orderType: 'tree_final',
          competitionId: competition._id
        }
      }
    })
    if (!res.success) {
      app.showModal('获取数据失败,请刷新重试')
      throw 'error 获取数据失败,请刷新重试'
    }
    //判断有无数据
    if (res.data.length === 0) {
      //没有数据
      const tree = this.generatePyramid(Math.log2(2) + 1, 2, 'final')
      //上传数据
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'competition',
          data: {
            orderType: 'tree_final',
            competitionId: competition._id,
            tree: tree
          }
        }
      })
      if (!res.success) {
        app.showModal('上传数据失败!,请刷新重试!')
        throw 'error --- 上传数据失败!,请刷新重试!'
      }
      this.setData({
        pyramidLayers: tree,
        pyramidLayers_final: tree
      })
    } else {
      this.setData({
        pyramidLayers: res.data[0].tree,
        pyramidLayers_final: res.data[0].tree
      })
    }
  },
  //获取败组数据
  async getTowLowData() {
    const competition = this.data.competition
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'competition',
        query: {
          orderType: 'tree_low',
          competitionId: competition._id
        }
      }
    })
    if (!res.success) {
      app.showModal('获取数据失败,请刷新重试')
      throw 'error 获取数据失败,请刷新重试'
    }
    //判断有无数据
    if (res.data.length === 0) {
      //没有数据
      const tree = this.generatePyramid(Math.log2(competition.towLow) + 1, competition.towLow, 'low')
      //上传数据
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'competition',
          data: {
            orderType: 'tree_low',
            competitionId: competition._id,
            tree: tree
          }
        }
      })
      if (!res.success) {
        app.showModal('上传数据失败!,请刷新重试!')
        throw 'error --- 上传数据失败!,请刷新重试!'
      }
      this.setData({
        pyramidLayers: tree,
        pyramidLayers_low: tree
      })
    } else {
      this.setData({
        pyramidLayers: res.data[0].tree,
        pyramidLayers_low: res.data[0].tree
      })
    }
  },
  //获取树状数据
  async getTrreData() {
    const competition = this.data.competition
    const res = await app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'competition',
        query: {
          orderType: 'tree_win',
          competitionId: competition._id
        }
      }
    })
    if (!res.success) {
      app.showModal('获取数据失败,请刷新重试')
      throw 'error 获取数据失败,请刷新重试'
    }
    //判断有无数据
    if (res.data.length === 0) {
      //没有数据
      const tree = this.generatePyramid(Math.log2(competition.playerMaxSum) + 1, competition.playerMaxSum, 'win')
      //上传数据
      const res = await app.callFunction({
        name: 'addRecord',
        data: {
          collection: 'competition',
          data: {
            orderType: 'tree_win',
            competitionId: competition._id,
            tree: tree
          }
        }
      })
      if (!res.success) {
        app.showModal('上传数据失败!,请刷新重试!')
        throw 'error --- 上传数据失败!,请刷新重试!'
      }
      this.setData({
        pyramidLayers: tree,
        pyramidLayers_win: tree
      })
    } else {
      this.setData({
        pyramidLayers: res.data[0].tree,
        pyramidLayers_win: res.data[0].tree
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const data = getCurrentPages()
    const upData = data[data.length - 2].data
    const upPagePlayerData = data[data.length - 2].data.playerData
    console.log(upPagePlayerData)
    this.setData({
      playerData: upPagePlayerData,
      competition: upData.competitionList[upData.index]
    })
    this.getTrreData()
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})