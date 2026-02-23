// pages/firendCircle/firendCircle.js
const app = getApp()
const appData = app.globalData
const zx = require('../../../utils/zx')
const txMap = require('../../../utils/TXmap/txMapApi')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    appData: appData,
    user_info: appData.user_info,
    moments: [],
    currentMomentId: null,

    skip: 0,
    limit: 50,
    total: 99999,

    item:'已审查'
  },
  async itemChaneg(e){
    if (this.data.item === '已审查') {
      this.setData({
        item:'未审查'
      })
      this.data.skip = 0
      this.data.limit = 50
      this.data.moments.length = 0
      await this.getFirendCircle(this.data.skip, this.data.limit)
    }else{
      this.setData({
        item:'已审查'
      })
      this.data.skip = 0
      this.data.limit = 50
      this.data.moments.length = 0
      await this.getFirendCircle(this.data.skip, this.data.limit)
    }
  },
  //转跳至发朋友圈界面
  makeFirendCircle() {
    wx.navigateTo({
      url: `./makeFirendCircle/makeFirendCircle?city=${this.data.city}`,
    })
  },
  // 转跳至我的照片页面
  myPhoto() {
    wx.navigateTo({
      url: './myPhoto/myPhoto',
    })
  },
  //更换朋友圈背景图片
  async bgImageChange(e) {
    console.log(e)
    const modalRes = await wx.showModal({
      title: '提示',
      content: '更换朋友圈背景图片?',
      confirmText: '更换',
      cancelText: '取消',
    })
    if (modalRes.cancel) {
      throw 'error --- 取消操作'
    }


    const upDataRes = await zx.updataImage(this.data.user_info._openid, 'firendCircleBgImage', appData.cloud, 1)
    if (!upDataRes) {
      app.showModal('错误', '保存图片失败!')
      throw 'error --- 保存图片失败'
    }
    //保存用户朋友圈背景图片
    const saveBgimg = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'user_info',
        query: {
          _openid: this.data.user_info._openid
        },
        upData: {
          bgImage: upDataRes
        }
      }
    })
    if (!saveBgimg.success) {
      app.showModal('提示', '保存背景图片失败!')
      throw "error --- 保存背景图片失败"
    }
    this.data.user_info.bgImage = upDataRes
    this.setData({
      user_info: this.data.user_info
    })
    app.showToast('保存成功!', 'success')
  },

  // 显示评论框
  showCommentBox(e) {
    const momentId = e.currentTarget.dataset._id;
    this.setData({
      currentMomentId: momentId
    });

    // 获取组件实例并显示
    this.commentBox = this.selectComponent('#commentBox');
    this.commentBox.show();
  },

  // 处理评论提交
  async handleCommentSubmit(e) {
    console.log(e)
    const { content } = e.detail;
    const { currentMomentId } = this.data;

    if (!content.trim()) return;
    const user_info = this.data.user_info
    let isChange = false
    //内容审查
    if (! await zx.safety_test({ message: { content: content, scene: 2 }, callFunction: app.callFunction })) {
      return
    }

    // 更新朋友圈数据
    const moments = this.data.moments.map(item => {
      if (item._id === currentMomentId) {
        isChange = true
        return {
          ...item,
          comments: [
            ...item.comments,
            {
              content: content,
              replyTo: [],
              userName: user_info.userInfo.name,
              userOpenid: user_info._openid,
              userAvatar: user_info.userInfo.headImage ? user_info.userInfo.headImage : 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/userboy.png'
            }
          ]
        };
      }
      return item;
    });
    //上传信息
    if (isChange) {
      app.callFunction({
        name: 'upDate',
        data: {
          collection: 'user_moment',
          query: {
            _id: currentMomentId
          },
          _push: {
            comments: {
              content: content,
              replyTo: [],
              userName: user_info.userInfo.name,
              userOpenid: user_info._openid,
              userAvatar: user_info.userInfo.headImage ? user_info.userInfo.headImage : 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/userboy.png'
            }
          }
        },
        showLoading: false
      })
    }
    this.setData({ moments });
  },
  //去朋友的朋友圈
  gotoFirendFirendCircle(e) {
    console.log(e)
    const userOpenid = this.data.moments[e.mark.index].userOpenid
    wx.navigateTo({
      url: `./firendFirendCircle/firendFirendCircle?userOpenid=${userOpenid}`,
    })
  },
  //预览照片
  previewImage(e) {
    console.log(e)
    const picPathArr = this.data.moments[e.mark.index].images
    const url = picPathArr.reduce((acc, item) => {
      let url_1 = item
      var res = url_1
      if (url_1.indexOf('cloud://') === 0) {
        var first = url_1.indexOf('.')
        var end = url_1.indexOf('/', first)
        res = 'https://' + url_1.slice(first + 1, end) + '.tcb.qcloud.la/' + url_1.slice(end + 1, url_1.length)
      }
      acc.push({ url: res })
      return acc
    }, [])
    wx.previewMedia({
      sources: url,
      current: 0,
      showmenu: true
    })
  },
  //显示更多回复
  showMoreComments(e) {
    console.log(e)
    this.setData({
      [`moments[${e.mark.index}].showAllComments`]: true
    })
  },
  //隐藏更多回复栏
  concealComments(e) {
    console.log(e)
    this.setData({
      [`moments[${e.mark.index}].showAllComments`]: false
    })
  },


  // 点赞功能
  async handleLike(e) {
    const _id = e.currentTarget.dataset._id;
    console.log(_id)
    const user_info = this.data.user_info;
    let isChange = false
    const moments = this.data.moments.map(item => {
      if (item._id === _id) {
        const likes = [...item.likes];
        const index = likes.findIndex(item => item.userOpenid === user_info._openid);

        if (index === -1) {
          likes.push({
            userName: user_info.userInfo.name,
            userOpenid: user_info._openid,
            userAvatar: user_info.userInfo.headImage ? user_info.userInfo.headImage : 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/userboy.png'
          });
          isChange = true
          item.isLike = true
        }
        return { ...item, likes };
      }
      return item;
    });
    if (isChange) {
      app.callFunction({
        name: 'upDate',
        data: {
          collection: 'user_moment',
          query: {
            _id: _id
          },
          _push: {
            likes: {
              userName: user_info.userInfo.name,
              userOpenid: user_info._openid,
              userAvatar: user_info.userInfo.headImage ? user_info.userInfo.headImage : 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/userboy.png'
            }
          }
        },
        showLoading: false
      })
      this.setData({ moments });
    }


  },
  //审核
  async check(e){
    console.log(e)
    const _id = this.data.moments[e.mark.index]._id
    let contentCheck = 0
    //内容审查  0未审查  1已审查通过 2审查未通过
    if (e.mark.item === 'passed') {//通过 1
      contentCheck = 1
    }else if (e.mark.item === 'close') {//未通过 2
      contentCheck = 2
    }else if (e.mark.item === 'delete') {//删除
      const res = await app.callFunction({
        name:'removeRecord',
        data:{
          collection:'user_moment',
          query:{
            _id:_id
          }
        }
      })
      if (!res.success) {
        app.showModal('操作失败!')
        return
      }
      this.data.moments.splice(e.mark.index, 1);
      this.setData({
        moments:this.data.moments
      })
      return
    }
    //上传 审核信息
    const res = await app.callFunction({
      name:'upDate',
      data:{
        collection:'user_moment',
        query:{
          _id:_id
        },
        upData:{
          contentCheck:contentCheck
        }
      }
    })  
    if (!res.success) {
      app.showModal('操作失败!')
      return
    }
    this.data.moments.splice(e.mark.index, 1);
    this.setData({
      moments:this.data.moments
    })
  },

  //获取朋友圈数据
  async getFirendCircle(skip, limit) {
    let res = await app.callFunction({
      name: 'fetchData',
      data: {
        skip: skip,
        limit: limit,
        collection: 'user_moment',
        query: {
          contentCheck: this.data.item === '已审查' ? 0 : 1,
        },
        orderBy: "time|desc"
      }
    })
    console.log(res)
    if (!res.success) {
      app.showModal('提示', '获取数据错误!')
      throw 'ERROR --- 获取数据错误!'
    }
    const moments = res?.data?.data || []
    const nowTimeStamp = new Date().getTime()
    const that = this
    //处理  自己是否已点赞, 或者还有时间
    moments.forEach(item => {
      //点赞
      item.isLike = false
      item.timeStr = that.getTimeStr(nowTimeStamp, item.time)
    })

    //刷新本地数据
    this.data.moments.push(...moments)
    this.setData({
      total: res.count.total,
      moments: this.data.moments
    })
  },
  //获取文字表达的时间节点
  getTimeStr(nowTimeStamp, momentTimeStamp) {
    if (nowTimeStamp - momentTimeStamp > 30 * 24 * 60 * 60 * 1000) {//大于一个月 返回实际时间
      return app.getNowTime(new Date(momentTimeStamp))
    } else if (nowTimeStamp - momentTimeStamp > 14 * 24 * 60 * 60 * 1000) {//大于14天
      return '2周以前'
    } else if (nowTimeStamp - momentTimeStamp > 7 * 24 * 60 * 60 * 1000) {//大于7天
      return '1周以前'
    } else if (nowTimeStamp - momentTimeStamp > 6 * 24 * 60 * 60 * 1000) {
      return '6天以前'
    } else if (nowTimeStamp - momentTimeStamp > 5 * 24 * 60 * 60 * 1000) {
      return '5天以前'
    } else if (nowTimeStamp - momentTimeStamp > 4 * 24 * 60 * 60 * 1000) {
      return '4天以前'
    } else if (nowTimeStamp - momentTimeStamp > 3 * 24 * 60 * 60 * 1000) {
      return '3天以前'
    } else if (nowTimeStamp - momentTimeStamp > 2 * 24 * 60 * 60 * 1000) {
      return '2天以前'
    } else if (nowTimeStamp - momentTimeStamp > 1 * 24 * 60 * 60 * 1000) {
      return '1天以前'
    } else if (nowTimeStamp - momentTimeStamp > 60 * 60 * 1000) {//1小时以上 1天一下
      const H = Math.floor((nowTimeStamp - momentTimeStamp) / (60 * 60 * 1000))
      return `${H}小时以前`
    } else if (nowTimeStamp - momentTimeStamp > 5 * 60 * 1000) {//五分钟以上 1小时以下
      const M = Math.floor((nowTimeStamp - momentTimeStamp) / (60 * 1000))
      return `${M}分钟以前`
    } else {
      return '刚刚'
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    const that = this

    this.getFirendCircle(that.data.skip, that.data.limit)
    wx.showShareMenu()
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
    console.log('页面上拉触底事件的处理函数')
    //分析剩余数量是否够一次加载的
    if (this.data.total <= this.data.moments.length) return

    let limit = this.data.total - this.data.moments.length >= this.data.limit ? this.data.limit : this.data.total - this.data.moments.length
    this.data.skip = this.data.moments.length

    this.getFirendCircle(this.data.skip, limit)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      userName: '鑫鼎汇自助桌球',
      path: `pages/firendCircle/firendCircle?city=${this.data.city}`,
      title: '鑫鼎汇球友圈',
      imagePath: '/pages/thumb.png',
      webpageUrl: 'www.qq.com',
      withShareTicket: true,
      miniprogramType: 0,
      scene: 0,
    }
  },
  onShareTimeline() {
    return {
      title: '鑫鼎汇球友圈',
      query: `city=${this.data.city}`,
    }
  }
})