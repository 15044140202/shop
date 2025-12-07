const app = getApp()
const appData = app.globalData
const zx = require('../../../../../utils/zx')
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
    totalNodes: 0,
    winOrLow: 'win',//胜组/败组 win / low

    showCustomModal: false, //二报选手数据
    options: [], // 你的50个选项数组
    selectedIndex: -1,

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
        winOrLow: 'win',
        baseCount: this.data.pyramidLayers_win[this.data.pyramidLayers_win.length - 1].nodes.length
      })
    }
  },
  async upDataScore(winOrLow, level, index, score) {
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const competition = this.data.competition

    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: orderType
        },
        upData: {
          [`tree.${level}.nodes.${index}.score`]: score
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
      [`pyramidLayers[${level}].nodes[${index}].score`]: score
    })
  },
  async upDataTableNum(winOrLow, level, index, tableNum) {
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const competition = this.data.competition

    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: orderType
        },
        upData: {
          [`tree.${level}.nodes.${index}.tableNum`]: tableNum
        }
      }
    })
    if (!res.success) {
      app.showToast('操作失败!')
      throw 'error --- 操作失败!'
    }
    if (winOrLow === 'win') {
      this.data.pyramidLayers_win[level].nodes[index].tableNum = tableNum
    } else if (winOrLow === 'low') {
      this.data.pyramidLayers_low[level].nodes[index].tableNum = tableNum
    } else if (winOrLow === 'final') {
      this.data.pyramidLayers_final[level].nodes[index].tableNum = tableNum
    }
    this.setData({
      [`pyramidLayers[${level}].nodes[${index}].tableNum`]: tableNum
    })
  },
  /**
   * @description 点击树状图 , 弹出选择框
   * 
   */
  async onNodeTap(e) {
    console.log(e)
    const node = e.currentTarget.dataset?.node
    const level = e.currentTarget.dataset?.level
    const index = e.currentTarget.dataset?.index
    const winOrLow = this.data.winOrLow
    console.log(node)
    if (Object.keys(node).length > 0) {//非空单元
      const con = await wx.showActionSheet({
        itemList: ['上传比分', '分配桌台', '置空此位'],
        title: '功能选择'
      })
      console.log(con)
      if (con.tapIndex === 2) {//置空此位
        await this.setNull(level, index)
        return
      }
      const type = con.tapIndex === 0 ? 'score' : 'tableNum'
      //上传比分
      const res = await wx.showModal({
        title: type === 'score' ? '请输入选手比分' : '请输入桌台号码',
        editable: true,
      })
      if (res.cancel) {
        return
      }
      const sum = parseInt(res.content)
      console.log(sum)
      if (isNaN(sum)) {
        return
      }
      if (type === 'score') {
        await this.upDataScore(this.data.winOrLow, level, index, sum)
      } else {
        await this.upDataTableNum(this.data.winOrLow, level, index, sum)
      }
    } else {//空单元 判断是否是第一层级 , 第一层级运行 二报进程, 非第一层级运行轮空晋级进程
      if (level === this.data.pyramidLayers.length - 1) {//最底层级
        if (winOrLow === 'win') {
          const con = await wx.showActionSheet({
            itemList: ['刷新数据', '选手二报'],
            title: '功能选择'
          })
          console.log(con)
          if (con.tapIndex === 0) {//刷新数据
            await this.refirshWinLastLevel()
          } else if (con.tapIndex === 1) {//选手二报
            await this.sEntry(level, index)
          }
          return
        } else {//刷新败组 //决赛先手信息
          if (winOrLow === 'low') {
            this.refirshLowPlayer(e)
            return
          }
          if (winOrLow === 'final') {
            this.refirshWinPlayer(e)
            return
          }
        }
      } else {
        if (winOrLow === 'low') {
          this.refirshLowPlayer(e)
          return
        } else {
          this.qualify(e)
        }

      }
    }
  },
  /**
   * @description 置某格子 为空
   */
  async setNull(level, index) {
    const winOrLow = this.data.winOrLow
    const orderType = winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final'
    const res = await app.callFunction({
      name: 'record_set',
      data: {
        collection: 'competition',
        query: {
          orderType: orderType,
          competitionId: this.data.competition._id
        },
        record: `tree.${level}.nodes.${index}`,
        data: {}
      }
    })
    if (!res.success) {
      app.showModal('上传数据失败!请退出赛事管理系统,重新进入尝试!')
      throw 'error --- 上传数据失败!请退出赛事管理系统,重新进入尝试!'
    }
    if (winOrLow === 'win') {
      this.data.pyramidLayers_win[level].nodes[index] = {}
      this.data.pyramidLayers = this.data.pyramidLayers_win
    } else if (winOrLow === 'low') {
      this.data.pyramidLayers_low[level].nodes[index] = {}
      this.data.pyramidLayers = this.data.pyramidLayers_low
    } else {
      this.data.pyramidLayers_final[level].nodes[index] = {}
      this.data.pyramidLayers = this.data.pyramidLayers_final
    }
    this.setData({
      pyramidLayers: this.data.pyramidLayers
    })
  },
  /**
   * @description 刷新胜组最后 最底层数据
   * 
   */
  async refirshWinLastLevel() {
    const playerData = this.data.playerData.sort((a, b) => a.competitionNum - b.competitionNum)
    const pyramidLayers_win = this.data.pyramidLayers_win
    const lastLevel = pyramidLayers_win.length - 1
    for (let index = 0; index < playerData.length; index++) {
      const player = playerData[index]
      // console.log(player)
      if (Object.keys(pyramidLayers_win[lastLevel].nodes[index]).length === 0) {
        this.data.pyramidLayers_win[lastLevel].nodes[index] = player
        const res = await app.callFunction({
          name: 'upDate',
          data: {
            collection: 'competition',
            query: {
              orderType: 'tree_win',
              competitionId: player.competitionId
            },
            upData: {
              [`tree.${lastLevel}.nodes.${index}`]: player
            }
          }
        })
        if (!res.success) {
          app.showModal('上传数据失败!退出赛事管理系统重新进入再次尝试.')
          throw 'error --- 上传数据失败!退出赛事管理系统重新进入再次尝试.'
        }
      }
    }
    this.data.pyramidLayers = pyramidLayers_win
    this.setData({
      pyramidLayers: pyramidLayers_win
    })
  },
  /**
   * @description //刷新掉如败组选手信息
   */
  async refirshLowPlayer(e) {
    const node = e.currentTarget.dataset?.node
    const level = e.currentTarget.dataset?.level
    const index = e.currentTarget.dataset?.index

    const competition = this.data.competition
    let towLowLevel = Math.log2(competition.towLow)
    const pyramidLayers_low = this.data.pyramidLayers_low
    const pyramidLayers_win = this.data.pyramidLayers_win
    console.log(towLowLevel)
    console.log(level, index)
    if (level === pyramidLayers_low.length - 1) {//最底层
      //获取胜组最底层输家数据
      const lowerArr = pyramidLayers_win[towLowLevel].nodes
      console.log(lowerArr)
      const lowArrIndex = pyramidLayers_low.length - 1
      //验证 表格数据是否对应准确
      if (lowerArr.length / 2 !== pyramidLayers_low[lowArrIndex].nodes.length) {
        console.log(lowerArr,pyramidLayers_low[lowArrIndex].nodes)
        app.showModal(`对应树状图成员数量不正确,胜组${lowerArr.length},败组${pyramidLayers_low[lowArrIndex].nodes.length}`)
        throw 'error --- 对应树状图成员数量不正确'
      }
      const newLowerArr = []
      for (let index = 0; index < lowerArr.length; index++) {
        if (index % 2 == 0 || index === 0) {
          const player1 = JSON.parse(JSON.stringify(lowerArr[index]))
          const player2 = JSON.parse(JSON.stringify(lowerArr[index + 1]))
          //添加成员
          if ((Object.keys(player1).length > 0 && 'score' in player1) && (Object.keys(player2).length > 0 && 'score' in player2)) {
            if (player1?.score > player2?.score) {
              delete player2.score
              delete player2.tableNum
              const nowData = pyramidLayers_low[lowArrIndex].nodes[newLowerArr.length]
              newLowerArr.push(Object.keys(nowData).length > 0 ? nowData : player2)
            } else {
              delete player1.score
              delete player1.tableNum
              const nowData = pyramidLayers_low[lowArrIndex].nodes[newLowerArr.length]
              //console.log(Object.keys(nowData).length > 0 ? nowData : player1)
              newLowerArr.push(Object.keys(nowData).length > 0 ? nowData : player1)
            }
          } else {
            newLowerArr.push({})
          }
        }
      }
      //判断是否更新
      if (newLowerArr === pyramidLayers_low[lowArrIndex].nodes) {//不需要更新
        return
      }
      //更新
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'competition',
          query: {
            competitionId: competition._id,
            orderType: 'tree_low'
          },
          upData: {
            [`tree.${lowArrIndex}.nodes`]: newLowerArr
          }
        },
      })
      if (!res.success) {
        app.showModal('操作失败,请刷新数据重试!')
        throw 'error --- 上传数据失败!'
      }
      this.data.pyramidLayers_low[lowArrIndex].nodes = newLowerArr
      this.setData({
        pyramidLayers: this.data.pyramidLayers_low
      })
      app.showToast('操作成功')
      return
    } else {//点击的不是 败组最底层
      //判断是否是 败组内战 还是 胜组淘汰和败组混战
      let player1 = {}
      let player2 = {}
      let upDatePlayer = {}
      if (level > 0 && level % 2 !== 0) {//混战
        if (index === 0 || index % 2 === 0) {//败组上轮人选
          //混战 败组人
          player1 = JSON.parse(JSON.stringify(pyramidLayers_low[level + 1].nodes[index]))
          player2 = JSON.parse(JSON.stringify(pyramidLayers_low[level + 1].nodes[index + 1]))
          //添加成员
          if ((Object.keys(player1).length > 0 && 'score' in player1) && (Object.keys(player2).length > 0 && 'score' in player2)) {
            if (player1?.score > player2?.score) {
              upDatePlayer = player1
            } else {
              upDatePlayer = player2
            }
          }
        } else {//胜组掉下来的人
          const level_win = Math.log2(pyramidLayers_low[level + 1].nodes.length)
          console.log(level_win)
          player1 = JSON.parse(JSON.stringify(pyramidLayers_win[level_win].nodes[index]))
          player2 = JSON.parse(JSON.stringify(pyramidLayers_win[level_win].nodes[index - 1]))
          if ((Object.keys(player1).length > 0 && 'score' in player1) && (Object.keys(player2).length > 0 && 'score' in player2)) {
            if (player1?.score > player2?.score) {
              upDatePlayer = player2
            } else {
              upDatePlayer = player1
            }
          }
        }
      } else {//内战
        //败组上轮 获胜的人选
        player1 = JSON.parse(JSON.stringify(pyramidLayers_low[level + 1].nodes[index * 2]))
        player2 = JSON.parse(JSON.stringify(pyramidLayers_low[level + 1].nodes[index * 2 + 1]))
        if ((Object.keys(player1).length > 0 && 'score' in player1) && (Object.keys(player2).length > 0 && 'score' in player2)) {
          if (player1?.score > player2?.score) {
            upDatePlayer = player1
          } else {
            upDatePlayer = player2
          }
        }
      }
      //判断有无人选
      if (Object.keys(upDatePlayer).length === 0) {
        app.showModal('该位置的选手上轮比赛未完成!')
        throw 'error --- 该位置的选手上轮比赛未完成!'
      }
      delete upDatePlayer.tableNum
      delete upDatePlayer.score
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'competition',
          query: {
            orderType: 'tree_low',
            competitionId: competition._id
          },
          upData: {
            [`tree.${level}.nodes.${index}`]: upDatePlayer
          }
        }
      })
      if (!res.success) {
        app.showModal('操作失败!请返回重新加载数据后重试!')
        throw 'error --- 上传数据错误!'
      }
      this.data.pyramidLayers_low[level].nodes[index] = upDatePlayer
      this.setData({
        pyramidLayers: this.data.pyramidLayers_low
      })
      app.showToast('操作成功!')
    }
    return
  },

  /**
   * @description //刷新决赛选手信息
   */
  async refirshWinPlayer() {
    const player1 = this.data.pyramidLayers_win[0].nodes[0]
    const player2 = this.data.pyramidLayers_low[0].nodes[0]
    if (Object.keys(player1).length > 0 && Object.keys(player2).length > 0) {
      const res = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'competition',
          query: {
            orderType: 'tree_final',
            competitionId: this.data.competition._id
          },
          upData: {
            [`tree.1.nodes.0`]: player1,
            [`tree.1.nodes.1`]: player2,
          }
        }
      })
      if (!res.success) {
        app.showModal('上传数据失败!')
        throw 'error --上传数据失败!'
      }
      this.data.pyramidLayers_final[1].nodes[0] = player1
      this.data.pyramidLayers_final[1].nodes[1] = player2
      this.setData({
        [`pyramidLayers[1].nodes[0]`]: player1,
        [`pyramidLayers[1].nodes[1]`]: player2
      })
    } else {
      app.showModal('胜组和败组冠军尚未决出!')
      throw 'error --- 胜组和败组冠军尚未决出'
    }
  },
  /**
   * @description 选择轮空
   */
  async selectBye(player1, player2, level, index) {
    let player = {}
    if (Object.keys(player1).length > 0) {
      player = player1
    } else {
      player = player2
    }
    const con = await wx.showModal({
      title: '确认',
      content: `确认[${player.playerName}]轮空晋级吗?`,
    })
    if (con.cancel) {
      app.showToast('取消操作')
      throw 'error --- 取消操作'
    }
    const winPlayer = JSON.parse(JSON.stringify(player))
    delete winPlayer.score
    delete winPlayer.tableNum
    const winOrLow = this.data.winOrLow
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          orderType: winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final',
          competitionId: this.data.competition._id
        },
        upData: {
          [`tree.${level}.nodes.${index}`]: winPlayer
        }
      }
    })
    if (!res.success) {
      app.showModal('上传数据失败!')
      throw 'error --上传数据失败!'
    }
    if (winOrLow === 'win') {
      this.data.pyramidLayers_win[level].nodes[index] = winPlayer
    } else if (winOrLow === 'low') {
      this.data.pyramidLayers_low[level].nodes[index] = winPlayer
    } else if (winOrLow === 'final') {
      this.data.pyramidLayers_final[level].nodes[index] = winPlayer
    }
    this.setData({
      [`pyramidLayers[${level}].nodes[${index}]`]: winPlayer
    })
    return

  },
  //显示二报 选手选择框
  showOptions() {
    this.setData({
      showCustomModal: true
    })
  },
  /**
   * @description //隐藏二报选手 选择框
   */
  hideModal() {
    this.setData({
      showCustomModal: false
    })
  },
  /**
   * @description 选择二报选手 
   * @param {*} e 
   */
  selectOption(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      selectedIndex: index
    })
    console.log('选择了:', this.data.options[index])
  },
  /**
   * @description 二次报名
   */
  async sEntry(level, index) {
    const winLevelPlayerArr = this.data.pyramidLayers_win[level].nodes
    const sPlayerArr = []
    //获取二报资格人
    for (let index = 0; index < winLevelPlayerArr.length; index += 2) {
      const player1 = winLevelPlayerArr[index];
      const player2 = winLevelPlayerArr[index + 1];
      if (('score' in player1) && ('score' in player1)) {
        sPlayerArr.push(player1.score > player2.score ? player2 : player1)
      }
    }
    console.log(sPlayerArr)
    //选择二报人员
    this.setData({
      options: sPlayerArr,
      sEntryLevel: level,
      sEntryIndex: index
    })
    this.showOptions()
  },
  /**
   * @description 确认 二报人员选择
   */
  async confirmSelection() {
    //二报人员信息
    const now = new Date()
    const playerData = JSON.parse(JSON.stringify(this.data.options[this.data.selectedIndex]))
    delete playerData.tableNum
    delete playerData.score
    delete playerData._id
    playerData.registrationTime = true//二报
    //二报费用
    const competition = this.data.competition
    const sEntryFee = competition.sEntryFee
    playerData.payState = competition.sEntryFee === 0 ? 1 : 0
    playerData.competitionNum = 0
    playerData.orderNum = zx.createOrderNum(now, 'cpt')

    playerData.entryFee = sEntryFee
    playerData.time = now.getTime()
    //预下单
    //下单
    const plRes = await app.callFunction({
      name: 'place_order_competition',
      data: {
        order: playerData,
        competitionVersion: competition.version ?? 0
      }
    })
    console.log(plRes)
    if (!plRes.success) {
      app.showModal('报名失败!请重新进入该页面重试!')
      throw 'erro  报名失败!请重新进入该页面重试!'
    }
    playerData._id = plRes.addOrderRes._id
    if (competition.sEntryFee) {
      //付款
      const payRes = await this.sanCodePay(playerData.entryFee, playerData.orderNum, playerData.sub_mchid)
      if (!payRes) { //支付失败
        console.log(res)
        //撤销订单  支付完成返回时间在 90秒内 不执行撤销命令  防止 服务器已撤销 造成的二次撤销 意外关灯
        await this.repealOrder(playerData.orderNum)
        wx.hideLoading();
        app.showToast('支付失败!', 'error')
        return
      }
      console.log('支付成功!')
      const paymentDoneRes = await this.paymentDone(playerData._id)
      console.log(paymentDoneRes)
    }

    this.setData({
      [`competition.nowPlayerSum`]: this.data.competition.nowPlayerSum + 1,
      [`pyramidLayers_win[${this.data.sEntryLevel}].nodes[${this.data.sEntryIndex}]`]: playerData,
      showCustomModal: false,
      selectedIndex: -1,
      sEntryLevel: -1,
      sEntryIndex: -1
    })
    await wx.showModal({
      title: '提示',
      content: '返回上一页面刷新数据, 并重新给二报选手抽签后,点击对应签号空位刷新数据.',
    })
    wx.navigateBack({ delta: 2 })
  },
  /**
 * @description //刷新二报人员数据
 */
  async refirshSentry(e) {
    const sEntryLevel = this.data.sEntryLevel
    const sEntryIndex = this.data.sEntryIndex
    const playerInfo = this.data.playerData.find(item => item.competitionNum === sEntryIndex + 1)
    if (!playerInfo) {
      app.showModal('此位置对应签号并没有选手!')
      throw 'error --- 此位置对应签号并没有选手'
    }
    //上传数据
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          orderType: 'tree_win',
          competitionId: this.data.competition._id
        },
        upData: {
          [`tree.${sEntryLevel}.nodes.${sEntryIndex}`]: playerInfo
        }
      }
    })
    if (!res.success) {
      app.showModal('数据上传错误!')
      throw 'error --- 数据上传错误'
    }
    this.setData({
      [`pyramidLayers_win[${sEntryLevel}].nodes[${sEntryIndex}]`]: playerInfo,
      pyramidLayers: this.data.pyramidLayers_win,
      showCustomModal: false
    })
  },
  /**
 * @description //订单支付成功
 * @param {string} orderNum 
 */
  async paymentDone(_id) {
    return await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: _id
        },
        upData: {
          payState: 1
        }
      }
    })
  },
  /**
 * @description //撤销订单
 * @param {string} orderNum 
 */
  async repealOrder(orderNum) {
    return await app.callFunction({
      name: 'repealOrder_competition',
      data: {
        orderNum: orderNum
      }
    })
  },
  async sanCodePay(amount, orderNum, sub_mchid) {
    let cardId
    try {
      cardId = await wx.scanCode({
        onlyFromCamera: true, // 是否只能从相机扫码，不允许从相册选择图片
      });
    } catch (e) {
      console.log('支付 error:' + e)
      return false
    }
    console.log('调用微信支付!:' + cardId.result)
    let payCode
    try {
      payCode = await app.cardPay(amount.toString(), '比赛报名费', sub_mchid, orderNum, cardId.result, 'wxad610929898d4371')
      if (!payCode.success && payCode.data.err_code_des !== '需要用户输入支付密码') { //支付返回错误
        await app.payErrCodeMsg(payCode.data)
        //支付错误撤销订单
        return false
      }
    } catch (e) {
      console.log('支付ERROR:' + e)
    }
    console.log('查询支付结果')
    if (await this.awaitOrderResult(orderNum, sub_mchid)) {
      console.log('支付成功!')
      return true
    }
    return false
  },
  async awaitOrderResult(orderNum, sub_mchid) {
    for (let index = 0; index < 50; index++) {
      // 使用Promise.race，哪个promise先resolve或reject，就处理哪个  
      try {
        const res = await app.payOrderQuery(orderNum, sub_mchid)
        console.log(res)
        if (res.success && 'trade_state' in res.data) {
          if (res.data.trade_state === "SUCCESS") { //支付成功
            return true;
          }
        }
        //这里要加 取消支付的情况处理
      } catch (e) {
        console.log('orderQuery catch ', e);
      }
      await app.delay(2000);
    }
    return false;
  },
  /**
   * @description //选择轮空晋级 或者 智能选择 晋级人员
   * @param {*} e 
   */
  async qualify(e) {
    console.log(e)
    const node = e.currentTarget.dataset?.node
    const level = e.currentTarget.dataset?.level
    const index = e.currentTarget.dataset?.index
    const pyramidLayers = this.data.pyramidLayers
    const winOrLow = this.data.winOrLow
    console.log(node)
    //下一级对应的两个选手 比分 & 桌台都上传完毕  将执行自动晋级 否则 则让其选择二报 或者 选择轮空晋级
    if (level === this.data.pyramidLayers.length - 1 && winOrLow === 'win') {//最底层  胜组可选择二报
      //执行二报代码

      app.showToast('二报2')
      return
    }
    if (level < pyramidLayers.length - 1) {//晋级
      const bottomPlayer1 = pyramidLayers[level + 1].nodes[(index + 1) * 2 - 2]
      const bottomPlayer2 = pyramidLayers[level + 1].nodes[(index + 1) * 2 - 1]
      if (Object.keys(bottomPlayer1).length === 0 || Object.keys(bottomPlayer2).length === 0) {//下一级有空缺人选
        await this.selectBye(bottomPlayer1, bottomPlayer2, level, index)
        return
      } else {//无空缺人员 自动晋级
        //判断 下面两个人比分是否全部上传完毕?
        if (isNaN(parseInt(bottomPlayer1?.score)) || isNaN(parseInt(bottomPlayer2?.score))) {
          app.showModal('请先上传选手比分!')
          return
        }
        //晋级 
        const winPlayer = JSON.parse(JSON.stringify(bottomPlayer1.score > bottomPlayer2.score ? bottomPlayer1 : bottomPlayer2))
        delete winPlayer.score
        delete winPlayer.tableNum
        const res = await app.callFunction({
          name: 'upDate',
          data: {
            collection: 'competition',
            query: {
              orderType: winOrLow === 'win' ? 'tree_win' : winOrLow === 'low' ? 'tree_low' : 'tree_final',
              competitionId: this.data.competition._id
            },
            upData: {
              [`tree.${level}.nodes.${index}`]: winPlayer
            }
          }
        })
        if (!res.success) {
          app.showModal('上传数据失败!')
          throw 'error --上传数据失败!'
        }
        if (winOrLow === 'win') {
          this.data.pyramidLayers_win[level].nodes[index] = winPlayer
        } else if (winOrLow === 'low') {
          this.data.pyramidLayers_low[level].nodes[index] = winPlayer
        } else if (winOrLow === 'final') {
          this.data.pyramidLayers_final[level].nodes[index] = winPlayer
        }
        this.setData({
          [`pyramidLayers[${level}].nodes[${index}]`]: winPlayer
        })
        return
      }
    }

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
        pyramidLayers_low: tree,
        baseCount: tree[tres.length - 1].nodes.length
      })
    } else {
      const tree = res.data[0].tree
      this.setData({
        pyramidLayers: tree,
        pyramidLayers_low: tree,
        baseCount: tree[tree.length - 1].nodes.length
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
        pyramidLayers_win: tree,
        baseCount: tree[tree.length - 1].nodes.length
      })
    } else {
      const tree = res.data[0].tree
      this.setData({
        pyramidLayers: tree,
        pyramidLayers_win: tree,
        baseCount: tree[tree.length - 1].nodes.length
      })
    }
  },
  // 生成金字塔结构
  generatePyramid(layers, baseCount, orderType) {
    console.log(layers)
    const playerData = this.data.playerData
    playerData.sort((a, b) => a.competitionNum - b.competitionNum)
    const pyramidLayers = [];
    let totalNodes = 0;

    for (let level = 1; level <= layers; level++) {
      // 计算当前层的节点数量
      const nodeCount = Math.ceil(baseCount / Math.pow(2, level - 1));
      const nodes = [];
      // 生成节点数据
      for (let i = 1; i <= nodeCount; i++) {
        if (level === 1 && playerData.length >= i && orderType === 'win') {
          nodes.push(playerData[i - 1]);
        } else {
          nodes.push({});
        }

      }
      pyramidLayers.push({
        level: level,
        width: nodes.length,
        nodes: nodes
      });
      totalNodes += nodeCount;
    }

    // 反转数组，让第一层在底部
    pyramidLayers.reverse();
    this.setData({
      pyramidLayers: pyramidLayers,
      totalNodes: totalNodes
    });
    return pyramidLayers
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})