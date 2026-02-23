// pages/tools/competition_manager/competitionDetail/competitionDetail.js
const app = getApp()
const appData = app.globalData
Page({

  /**
   * 页面的初始数据
   */
  data: {
    competitionList: [],
    index: 0,
    playerData: [],//选手数据
    skit: 0,
    limit: 100,
    count: 0,
    fold: true,//显示赛事详情 

    displayData: [],
    displayType: 'all',

    winTree: [],
    lowTree: []
  },
  /**
   * @description //刷新选手支付状态
   */
  async refirshPayState(e) {
    console.log(e)
    const playerInfo = this.data.playerData[e.mark.index]
    const res = await app.callFunction({
      name: 'wx_pay',
      data: {
        item: 'orderQuery',
        parameter: {
          out_trade_no: playerInfo.orderNum,
          sub_mch_id: playerInfo.sub_mchid
        }
      }
    })
    console.log(res)
    if (res.success && 'trade_state' in res.data && res.data.trade_state === "SUCCESS") {//支付成功
      const upRes = await app.callFunction({
        name: 'upDate',
        data: {
          collection: 'competition',
          query: {
            _id: playerInfo._id
          },
          upData: {
            payState: 1
          }
        }
      })
      if (!upRes.success) {
        app.showModal('上传数据错误!')
        throw 'error --- 上传数据错误'
      }
      const INDEX = this.data.playerData.findIndex(item=> item._id === this.data.displayData[e.mark.index]._id )
      this.setData({
        [`displayData[${e.mark.index}].payState`]:1,
        [`playerData[${INDEX}].payState`]: 1
      })
      return
    }
    //未支付成功 
    const nowTimeStamp = new Date().getTime()
    if (nowTimeStamp - playerInfo.time > 2 * 60 * 1000) {
      //先取消支付订单
      const closePayOrderRes = await cloud.callFunction({
        name: 'wx_pay',
        data: {
          item: 'closeOrder',
          parameter: {
            out_trade_no: playerInfo.orderNum,
            sub_mch_id: playerInfo.sub_mchid
          }
        }
      })
      console.log(closePayOrderRes)
      if (!closePayOrderRes.data?.err_code_des !== "ORDERCLOSED" && closePayOrderRes.data.result_code !== "SUCCESS") {
        throw {
          data: closePayOrderRes,
          message: 'error closePayOrder Error'
        }
      }
      //关闭订单成功
      const res = await app.callFunction({
        name: 'repealOrder_competition',
        data: {
          orderNum:playerInfo.orderNum
        }
      })
      if (!res.success) {
        app.showModal('订单取消失败!')
        throw 'error --- 订单取消失败!'
      }
      const INDEX = this.data.playerData.findIndex(item=> item._id === this.data.displayData[e.mark.index]._id )
      this.data.displayData.splice(e.mark.index,1)
      this.data.playerData.splice(INDEX,1)
      this.setData({
        displayData:displayData
      })
      app.showToast('订单已取消')
    } else {
      app.showModal('等待支付中')
    }
  },
  /**
   * @description 按当前对阵信息 排列
   */
  clash() {
    const playerData = this.data.playerData
    const competition = this.data.competitionList[this.data.index]
    //判断是否所有选手都以抽签完毕
    const noHaveNum = playerData.find(item => !item.competitionNum)
    if (noHaveNum) {
      app.showModal('有尚未抽签选手,请先抽签.')
      throw 'error --- 有尚未抽签选手,请先抽签.'
    }
    wx.navigateTo({
      url: './tree/tree',
    })
    return
  },
  /**
   * @description 暂停 或者 开启比赛
   * @param {*} e 
   */
  async stop(e) {
    console.log(e)
    const competition = this.data.competitionList[this.data.index]
    const nowStatus = competition.status
    const menu = await wx.showActionSheet({
      itemList: ['报名中', '进行中', '暂停中', '结束赛事'],
    })
    console.log(menu)
    let upData = menu.tapIndex
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: competition._id
        },
        upData: {
          status: upData
        }
      }
    })
    if (!res.success) {
      app.showModal('上传数据失败!')
      throw 'error ---上传数据失败!'
    }
    this.setData({
      [`competitionList[${this.data.index}].status`]: upData
    })
    app.showToast('操作成功!')
  },
  /**
 * @description 按抽签序号排列
 */
  sort(type) {
    if (type === 'win32') {
      if (this.data.winTree.length > 5) {
        const playerData = this.data.winTree[5].nodes
        this.setData({
          displayData: playerData
        })
      } else {
        app.showModal('胜组没有32强名单.')
        return
      }
    } else if (type === 'win16') {
      if (this.data.winTree.length > 4) {
        const playerData = this.data.winTree[4].nodes
        this.setData({
          displayData: playerData
        })
      } else {
        app.showModal('胜组没有16强名单.')
        return
      }
    } else if (type === 'win8') {
      if (this.data.winTree.length > 3) {
        const playerData = this.data.winTree[3].nodes
        this.setData({
          displayData: playerData
        })
      } else {
        app.showModal('胜组没有8强名单.')
        return
      }
    } else if (type === 'win4') {
      if (this.data.winTree.length > 2) {
        const playerData = this.data.winTree[2].nodes
        this.setData({
          displayData: playerData
        })
      } else {
        app.showModal('胜组没有4强名单.')
        return
      }
    } else if (type === 'win3') {
      if (this.data.winTree.length < 2 || this.data.lowTree.length < 1) {
        app.showModal('暂无前三名单.')
        return
      }
      const winPlayer = this.data.winTree[1].nodes
      const lowPlayer = this.data.lowTree[0].nodes
      this.setData({
        displayData: [...winPlayer, ...lowPlayer]
      })
    } else { //按序号排列
      const playerData = this.data.playerData
      playerData.sort((a, b) => a.competitionNum - b.competitionNum)
      this.setData({
        displayData: playerData
      })
      return
    }
  },
  /**
   * @description 获取胜组数据
   */
  async getWinTreeData() {
    const competition = this.data.competitionList[this.data.index]
    const task = []
    task.push(app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: 'tree_win'
        }
      }
    }))
    task.push(app.callFunction({
      name: 'getData_where',
      data: {
        collection: 'competition',
        query: {
          competitionId: competition._id,
          orderType: 'tree_low'
        }
      }
    }))
    const res = await Promise.all(task)
    const win_tree = res[0].data?.[0]?.tree || []
    const low_tree = res[1].data?.[0]?.tree || []
    console.log({ win_tree: win_tree, low_tree: low_tree })
    this.setData({
      winTree: win_tree,
      lowTree: low_tree
    })
    return { winTree: win_tree, lowTree: low_tree }
  },
  /**
* @description 对阵列表
*/
  async list() {
    const playerData = this.data.playerData
    const competition = this.data.competitionList[this.data.index]
    //判断是否所有选手都以抽签完毕
    const noHaveNum = playerData.find(item => !item.competitionNum)
    if (noHaveNum) {
      app.showModal('有尚未抽签选手,请先抽签.')
      throw 'error --- 有尚未抽签选手,请先抽签.'
    }
    wx.navigateTo({
      url: './list/list',
    })
    return
  },
  /**
* @description 16强
*/
  async win16() {
    //获取数据
    let winTree = this.data.winTree
    if (winTree.length <= 0) {
      const res = await this.getWinTreeData()
      winTree = res?.winTree ?? []
    }
    //判断数据
    if (winTree.length === 0) {
      app.showModal('尚未决出16强')
      throw 'error 尚未决出16强'
    }
    this.sort('win16')
  },
  /**
* @description 8强
*/
  async win8() {
    //获取数据
    let winTree = this.data.winTree
    if (winTree.length <= 0) {
      const res = await this.getWinTreeData()
      winTree = res?.winTree ?? []
    }
    //判断数据
    if (winTree.length === 0) {
      app.showModal('尚未决出8强')
      throw 'error 尚未决出8强'
    }
    this.sort('win8')
  },
  /**
* @description 4强
*/
  async win3() {
    //获取数据
    let winTree = this.data.winTree
    let lowTree = this.data.lowTree
    if (winTree.length <= 0 || lowTree.length <= 0) {
      const res = await this.getWinTreeData()
      winTree = res?.winTree ?? []
      lowTree = res?.lowTree ?? []
    }
    //判断数据
    if (winTree.length === 0 || lowTree.length === 0) {
      app.showModal('尚未决出前3')
      throw 'error 尚未决出前3'
    }
    this.sort('win3')
  },
  /**
 * @description 自动抽签
 */
  async lottery() {
    const playerData = this.data.playerData
    const competition = this.data.competitionList[this.data.index]
    //判断是否有 未抽签的参赛选手
    const isNoHaveNumPlayer = playerData.find(item => !item.competitionNum && item.payState === 1)
    if (!isNoHaveNumPlayer) {//所有选手以抽签完毕
      app.showModal('所有选手以抽签完毕')
      throw 'error --- 所有选手以抽签完毕'
    }
    //获取签池子
    const lotteryNumArr = []
    for (let num = 0; num < competition.nowPlayerSum; num++) {
      if (!playerData.find(item => item.competitionNum === num + 1)) {
        lotteryNumArr.push(num + 1)
      }
    }
    lotteryNumArr.sort(() => Math.random() - 0.5)//打乱顺序
    console.log(lotteryNumArr)
    //上传抽签结果
    const task = []
    for (let index = 0; index < playerData.length; index++) {
      const element = playerData[index];
      if (element.competitionNum) {
        continue //已分配的
      }
      task.push(
        app.callFunction({
          name: 'upDate',
          data: {
            collection: 'competition',
            query: {
              _id: element._id
            },
            upData: {
              competitionNum: lotteryNumArr[0]
            }
          }
        })
      )
      lotteryNumArr.splice(0, 1)
      if (task.length >= 50) {
        const res = await Promise.all(task)
        console.log(res)
        task.splice(0, 50)
      }
    }
    app.showModal('抽签完成,请返回后重新进入该界面,确认抽签结果正常.')
  },
  /**
   * @description 开启赛事 进入预选赛
   * 
   */
  async start() {
    //确认 开启赛事
    const competition = this.data.competitionList[this.data.index]
    if (competition.round) {
      app.showModal('当前赛事以开始,非报名阶段无法再次开启.')
      throw 'error ---当前赛事以开始,非报名阶段无法再次开启.'
    }
    const confirm = await wx.showModal({
      title: '确认窗口',
      content: `确认现在开启预选赛吗?当前总报名人数:${competition.nowPlayerSum}人,开启后将关闭客户端报名通道.如有二报,请在管理界面邀请选手参加.`,
    })
    if (confirm.cancel) {//取消操作
      throw 'error ---取消操作'
    }
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: competition._id
        },
        upData: {
          round: 1, //0报名1预选赛2双败赛
          status: 1,//0未开始1已开赛2已暂停
        }
      }
    })
    if (!res.success) {
      app.showModal('操作失败!')
      throw '操作失败!'
    }
    this.setData({
      [`competitionList[${this.data.index}].round`]: 1
    })
    app.showToast('操作成功!', 'success')
  },
  /**
   * @description //开启双败赛
   * 
   */
  async startTowLow() {
    const con = await wx.showModal({
      title: '请输入双败阶段名次',
      editable: true,
    })
    console.log(con)
    if (con.cancel) {
      app.showModal('取消操作')
      throw '取消操作'
    }
    const towLow = parseInt(con.content)
    if (isNaN(towLow)) {
      app.showModal('非法输入')
      throw '非法输入'
    }
    const competition = this.data.competitionList[this.data.index]
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: competition._id
        },
        upData: {
          towLow: towLow,
          round: 2
        }
      }
    })
    if (!res.success) {
      app.showModal('上传数据错误')
      throw 'error 上传数据错误'
    }
    this.data.competitionList[this.data.index].towLow = towLow
    this.data.competitionList[this.data.index].round = 2
    this.setData({
      competitionList: this.data.competitionList
    })
  },
  /**
   * @description //修改选手真实姓名
   * @param {*} e 
   */
  async change_name(e){
    console.log(e)
    const index = e.mark.index
    const nameRes = await wx.showModal({
      title: '修改选手姓名',
      editable: true,
      placeholderText: '请输入选手姓名'
    })
    console.log(nameRes)
    const newName = nameRes.content
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: this.data.displayData[index]._id
        },
        upData: {
          playerName: newName
        }
      }
    })
    if (!res.success) {
      app.showModal('数据保存失败')
      throw '数据保存失败!'
    }
    this.setData({
      [`displayData[${index}].playerName`]: newName
    })
    app.showToast('操作成功!')
  },
  async tap_player(e){
    console.log(e)
    const playerData = this.data.displayData[e.mark.index]
    //显示操作选项卡
    const con = await wx.showActionSheet({
      itemList: ['删除该选手','退还报名费'],
    })
    console.log(con)
    switch (con.tapIndex) {
      case 1:
        await this.returnFee(playerData)
        break;
      case 0:
        await this.deletePlayer(playerData)
        break;
      default:
        break;
    }
  },
  /**
   * @description 退款
   * @param {string} orderNum 
   */
  async returnFee(playerData){
    const competition = this.data.competitionList[this.data.index]
    const amount = playerData?.registrationTime ? competition.sEntryFee : competition.entryFee
    const res = await app.callFunction({
      name:'wx_pay',
      data:{
        item:'refund',
        parameter:{
          out_trade_no: playerData.orderNum,
          out_refund_no: 're' + playerData.orderNum,
          total_fee: amount,
          refund_fee: amount,
          sub_mch_id:appData.shop_account.proceedAccount
        }
      }
    })
    console.log(res)
    if (res?.data?.result_code === 'SUCCESS') {//退款成功!
      app.showToast('退款成功')
      return
    }
    app.showModal('退款失败' + res.data.err_code_des)
    return
  },
  /**
   * @description 删除已 退还报名费的 先手
   * @param {object} playerData 
   */
  async deletePlayer(playerData){
    const competition = this.data.competitionList[this.data.index]
    //先判断是否 已经退款了
    const amount = playerData?.registrationTime ? competition.sEntryFee : competition.entryFee
    if (amount) {
      const isRePay = await this.isRePay(playerData.orderNum)
      if (!isRePay) {
        app.showModal('请先进行退款后再进行删除选手.')
        throw 'error --- 请先进行退款后再进行删除选手'
      }
    }
    //标记该成员 为已退款
    const res = await app.callFunction({
      name:'repealOrder_competition',
      data:{
        orderNum: playerData.orderNum, 
        isRefound:true
      }
    })
    if (!res.success) {
      app.showToast('操作失败!','error')
      throw 'error 操作失败!'
    }
    playerData.payState = 2
    this.setData({
      displayData:this.data.displayData
    })
    app.showToast('操作成功')
  },
  // 检测是否已经退款了
  async isRePay(orderNum){
    const sub_mch_id = appData.shop_account.proceedAccount
    const res = await app.callFunction({
      name:'wx_pay',
      data:{
        item:'orderQuery',
        parameter:{
          out_trade_no:orderNum,
          sub_mch_id:sub_mch_id
        }
      }
    })
    if (res.data.trade_state === 'SUCCESS') {
      return false
    }else if(res.data.trade_state === 'REFUND'){
      return true
    }
    console.log(res)
    return false
  },
  /**
   * @description 手动分配签号
   * @param {*} e 
   */
  async change_comNum(e) {
    console.log(e)
    const index = e.mark.index
    //先判断这个人是否已经有 签号了
    // if (this.data.playerData[index].competitionNum) {
    //   app.showModal('以有签号的选手无法预输入签号')
    //   throw 'error -- 该选手以有签号了.'
    // }
    const numRes = await wx.showModal({
      title: '预输入签号',
      editable: true,
      placeholderText: '请输入签号'
    })
    console.log(numRes)
    const comNum = parseInt(Number(numRes.content))
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'competition',
        query: {
          _id: this.data.displayData[index]._id
        },
        upData: {
          competitionNum: comNum
        }
      }
    })
    if (!res.success) {
      app.showModal('数据保存失败')
      throw '数据保存失败!'
    }
    this.setData({
      [`displayData[${index}].competitionNum`]: comNum
    })
    app.showToast('操作成功!')
  },
  /**
   * @description //赛事详情折叠板
   * @param {*} skip 
   */
  flod(e) {
    console.log(e)
    this.setData({
      flod: !this.data.flod
    })
  },
  async getPlayerData(skip = 0) {
    const res = await app.callFunction({
      name: 'fetchData',
      data: {
        collection: 'competition',
        query: {
          competitionId: this.data.competitionList[this.data.index]._id,
          orderType: 'player'
        }, 
        _in: {
          record: 'payState',
          value: [1, 0]
        },
        skip: skip,
        limit: 100,
        orderBy: 'time|asc'
      }
    })
    console.log(res)
    if (!res.success) {
      app.showToast('错误', '获取选手信息错误!')
    }

    this.data.playerData.push(...res.data.data)
    this.setData({
      count: res.count.total,
      playerData: this.data.playerData,
      displayData: this.data.playerData,
    })
  },
  // 拨打电话功能
  makePhoneCall: function (e) {
    const phone = e.currentTarget.dataset.phone;
    wx.showModal({
      title: '拨打电话',
      content: `是否拨打 ${phone}?`,
      success: (res) => {
        if (res.confirm) {
          // 在实际应用中，这里可以调用微信小程序的电话API
          // wx.makePhoneCall({
          //   phoneNumber: phone
          // })
          wx.showToast({
            title: '调用电话功能',
            icon: 'success'
          });
        }
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log(options)
    this.setData({
      index: options.index
    })
    const page = getCurrentPages()
    console.log(page)
    this.setData({
      competitionList: page[page.length - 2].data.competitionList
    })
    console.log(this.data.competitionList)
    //获取当前 赛事全部参赛选手数据
    await this.getPlayerData(0)

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
  async onReachBottom() {
    if (this.data.count === this.data.playerData.length) {
      wx.showToast({
        title: '没有更多数据了!',
        icon: 'error'
      })
    } else {
      wx.showLoading({
        title: '数据加载中!'
      });
      await this.getPlayerData(this.data.playerData.length);
      wx.hideLoading();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})