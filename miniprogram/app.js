App({
  /**
   * 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）
   */
  globalData: {
    NewProject: true,
    //阿里云数据
    as: "", //AccessKey Secret
    productKey: "",
    endpoint: "https://iot.cn-shanghai.aliyuncs.com",
    ai: "", //AccessKeyId
    apiVersion: '2018-01-20',

    secret: 'b5c686febf2beaebd87f1c5fe21932c2',
    orderForm: [],
    disPlayOrderForm: [],
    disPlayDate: '',
    tableOrder: [],

    MAPKEY: 'P62BZ-3YDKZ-HI5XB-ZKWW4-QHG4H-DKB7X', //腾讯地图位置服务 key

    shopSelect: 0,
    shopLogo: '',
    device: {},
    status: '', //职位信息分为:boss(老板) waiter(服务员)  cashier(收银员)  manager(经理)  finance(财务) 
    memberAttendance: [], //员工打卡记录
    localImageArray: [],
    watcher: undefined, //operate页面 店铺信息数据 监听器
    globalShareInfo: {
      title: '智享自助商家端',
      path: '/pages/login/login',
      imageUrl: 'https://6269-billiards-0g53628z5ae826bc-1326882458.tcb.qcloud.la/image/%E6%B2%A1%E6%9C%89%E5%9B%BE%E7%89%87.png?sign=877b094c4497a3d02a2d7b126b54047a&t=1718773861'
    },

    my_sub_mchid: '1680705821', //时光私幕,

    tableYearCost: 100, //桌台年费价格
    sportShowCost: 3 //精彩秀调用一次价格
  },
  getRandomNum(length) {
    const randomNum = Math.floor(Math.random() * 1000000)
    return randomNum.toString().padStart(length, '0')
  },
  /**
   * @description 支付完成 执行的操作
   * @param {string} orderNum 
   * @param {string} shopId 
   * @param {number} tableNum 
   * @param {number} tableVersion 
   */
  async paymentDone(orderNum, shopId, tableNum, tableVersion) {
    const res = await this.callFunction({
      name: 'payment_done',
      data: {
        orderNum,
        shopId,
        tableNum,
        tableVersion
      }
    })
    return res
  },
  /**
   * 获取指定台球的版本信息
   * @param {number} tableNum - 台球编号
   * @returns {number} 台球桌版本信息
   */
  async getTableVersion(tableNum, shopId) {
    const res = await this.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_table',
        query: {
          shopId: shopId ? shopId : this.globalData.shop_account._id,
          tableNum: tableNum
        }
      }
    })
    console.log(res)
    if (!res.success) {
      this.showModal('提示', '获取桌台版本号错误!')
      return -1
    }
    //直接返回版本号
    return res.data[0].version
  },
  /**
   * 撤销订单函数
   * @async
   * @function repealOrder
   * @param {string} orderNum - 订单编号
   * @param {string} tableNum - 桌台编号
   * @param {string} shopId - 商户编号
   * @returns {Promise<Object>} 返回调用云函数的结果
   * 
   * 此函数用于撤销指定桌台的订单，需要传入订单编号、桌台编号和商户编号。
   * 它会获取当前时间作为撤销时间，并查询桌台的版本号以确保数据一致性。
   * 然后调用云函数'repeal_order'来执行撤销操作，pledgeState参数设置为3表示客户端撤销。
   */
  async repealOrder(orderNum, tableNum, shopId, sub_mchid) {
    const endTime = this.getNowTime()
    const tableVersion = await this.getTableVersion(tableNum)
    return await this.callFunction({
      name: 'repeal_order',
      data: {
        orderNum,
        tableNum,
        shopId,
        tableVersion,
        pledgeState: 3, //1.已支付 2.未支付 3.客户端撤销 4.服务器撤销
        endTime,
        sub_mchid
      }
    })
  },
  /**
   * @description 返回支付错误的信息提示框
   * @param {JSON} payResult 
   */
  async payErrCodeMsg(payResult) {
    if (payResult.err_code_des === '101 每个二维码仅限使用一次，请刷新再试') {
      await this.showModal('提示', '每个二维码仅限使用一次，请刷新再试')
    } else if (payResult.err_code_des === '重入请求数据和已存在的业务单据数据不一致') {
      await this.showModal('提示', '支付订单号重复,店员重新进入小程序重试!')
    } else if (payResult.return_code === 'FAIL') {
      await this.showModal('提示', '支付参数错误!' + return_msg)
    } else if (payResult.return_code === 'FAIL') {
      await this.showModal('提示', '支付参数错误!' + return_msg)
    }
    return
  },
  /**
   * @description 向服务器中添加一个指定_id的qr数据 用于扫描qr的人拉取
   * @param {*} data 
   */
  async updateQrData(data) {
    return (await this.callFunction({
      name: 'addRecord',
      data: {
        collection: 'shop_qr_data',
        data
      }
    }))
  },
  getDistance(lat1, lon1, lat2, lon2) {
    // 将经纬度从度数转换为弧度
    lat1 = (lat1 * Math.PI) / 180;
    lon1 = (lon1 * Math.PI) / 180;
    lat2 = (lat2 * Math.PI) / 180;
    lon2 = (lon2 * Math.PI) / 180;

    // Haversine公式
    let dlon = lon2 - lon1;
    let dlat = lat2 - lat1;
    let a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // 地球半径，单位为米
    let R = 6371000;

    // 计算距离
    let distance = R * c;
    return distance;
  },
  /**
   * 获取当前精确坐标
   */
  async getLocation(highAccuracyExpireTime = 8000) {
    const setting = await wx.getSetting({})
    console.log(setting)
    if (!setting['scope.userLocation']) { //没有授权
      const userLocation = await wx.authorize({
        scope: 'scope.userLocation',
      })
      console.log({
        '授权详情:': userLocation
      })
      if (userLocation.errMsg !== 'authorize:ok') { //授权失败
        throw 'ERROR-用户拒绝授权位置信息'
      }
    }
    const res = await wx.getLocation({
      type: 'wgs84',
      highAccuracyExpireTime
    })
    console.log({
      "当前位置信息": res
    })
    return res
  },
  /**
   * 异步获取头像图片的函数
   * @param {string} FileId - 头像文件的ID，如果是'1'或空字符串，则使用默认店铺头像
   * @param {boolean} disPlayShowloading - 是否显示加载中的提示
   * @returns {Promise<string>} 返回头像图片的临时文件路径
   * 
   * 函数首先检查本地缓存中是否存在该图片，如果存在则直接返回其临时文件路径。
   * 如果不存在，则通过云服务下载图片，并将结果保存到本地缓存中，然后返回临时文件路径。
   * 如果下载过程中发生错误，则在控制台打印错误信息，并返回空字符串。
   */
  async getHeadImage(FileId, disPlayShowloading) {
    var fileid = ''
    if (FileId === '1' || FileId === '') { //获取的是  默认店铺头像
      fileid = 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/image/商家端默认logo.png';
    } else {
      fileid = FileId;
    }
    //先判断本地缓存是否有此数据
    const localImageArray = this.globalData.localImageArray;
    for (let index = 0; index < localImageArray.length; index++) {
      const element = localImageArray[index];
      if (element.fileid === fileid) { //本地有 直接返回
        return element.tempFilePath
      }
    }
    //根据保存的 ID  下载文件 获取临时地址
    if (disPlayShowloading) this.showLoading('加载中...', true);
    var tempFilePath = '';
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: [fileid] // 文件 ID
      });
      // 如果下载成功，result 会包含临时文件路径等信息
      tempFilePath = result.fileList[0].tempFileURL
    } catch (error) {
      // 如果发生错误，error 对象会包含错误信息
      console.error('下载文件出错：', error);
      return ''
    }
    console.log(tempFilePath);
    if (disPlayShowloading) wx.hideLoading();
    this.globalData.localImageArray.push({ //保存到本地记录
      fileid: fileid,
      tempFilePath: tempFilePath
    })
    return tempFilePath;
  },
  //获取套餐信息
  async getSetMeal(shopFlag) {
    const res = this.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'setmeal',
        record: 'setmeal',
        shopFlag: shopFlag
      }
    })
    return res;
  },
  //获取店铺 计费规则
  async getCharging(shopFlag) {
    const res = this.callFunction({
      name: 'getDatabaseRecord_fg',
      data: {
        collection: 'charging',
        record: 'charging',
        shopFlag: shopFlag
      }
    })
    return res;
  },
  /**
   * @description //处理获取的店铺数据
   * @param {array} res 
   * @returns {JSON} 
   */
  resultDispose(res) {
    const shopData = {}
    for (let index = 0; index < res.length; index++) {
      const element = res[index];
      if (index === 0) { //shop_account
        shopData.shop_account = element.data[0]
      } else if (index === 1) { //shop_vip_set
        shopData.shop_vip_set = element.data[0]
      } else if (index === 2) { //shop_setmeal
        shopData.shop_setmeal = element.data[0]
      } else if (index === 3) { //shop_member_power
        shopData.shop_member_power = element.data[0]
      } else if (index === 4) { //shop_operate_set
        shopData.shop_operate_set = element.data[0]
      } else if (index === 5) { //shop_lucksudoku_set
        shopData.shop_lucksudoku_set = element.data[0]
      } else if (index === 6) { //shop_integral_set
        shopData.shop_integral_set = element.data[0]
      } else if (index === 7) { //shop_device
        shopData.shop_device = element.data[0]
      } else if (index === 8) { //shop_charging
        shopData.shop_charging = element.data
      } else if (index === 9) { //shop_member
        shopData.shop_member = element.data
      } else if (index === 10) { //shop_table
        shopData.shop_table = element.data
      } else if (index === 11) { //shop_group_buying
        shopData.shop_group_buying = element.data
      }
    }
    return shopData
  },
  /**
   * @description 获取灯控器状态
   * @param {string} lightName 
   */
  async getLightStatus(lightName) {
    if (!lightName) {
      this.showModal('提示', 'lightName 参数错误!')
      return
    }
    //获取灯控器状态
    const lightStatus = await this.call({
      method: 'GET',
      path: '/api/light',
      data: {
        lightName: lightName
      }
    })
    if (lightStatus.code === 404) {
      this.showModal('提示', '设备不在线!')
    }
    return lightStatus
  },
  //获取全部店铺信息
  async getLoginShopData(shopId) {
    const defultData = {
      fieldName: 'shopId',
      fieldData: shopId
    }
    const res = await this.callFunction({
      name: 'login',
      data: {
        register: false,
        transactions: [{
            collection: 'shop_account',
            data: {
              fieldName: '_id',
              fieldData: shopId
            }
          },
          {
            collection: 'shop_vip_set',
            data: defultData
          }, {
            collection: 'shop_setmeal', //店铺套餐设置
            data: defultData
          }, {
            collection: 'shop_member_power', //店铺店员设置
            data: defultData
          }, {
            collection: 'shop_operate_set', //店铺营业参数设置
            data: defultData
          }, {
            collection: 'shop_lucksudoku_set', //店铺幸运九宫格设置
            data: defultData
          }, {
            collection: 'shop_integral_set', //店铺积分设置
            data: defultData
          }, {
            collection: 'shop_device', //店铺设备设置
            data: defultData
          }, {
            collection: 'shop_charging', //店铺计费规则设置
            data: defultData
          }, {
            collection: 'shop_member', //店铺员工信息
            data: defultData
          }, {
            collection: 'shop_table', //店铺桌台信息
            data: defultData
          }, {
            collection: 'shop_group_buying', //店铺团购信息
            data: defultData
          }
        ]
      }
    })
    return res
  },
  //获取店铺设备信息
  async getDevice(shopFlag) {
    const res = await this.callFunction({
      name: 'getShopDevice',
      data: {
        shopFlag: shopFlag
      }
    })
    console.log(res);
    if (res !== 'error') {
      return res
    } else {
      return 'error'
    }
  },
  async downTempFile(FileId) {
    //根据保存的 ID  下载文件 获取临时地址
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    var tempFilePath = '';
    try {
      const result = await wx.cloud.getTempFileURL({
        fileList: [FileId] // 文件 ID
      });
      // 如果下载成功，result 会包含临时文件路径等信息
      tempFilePath = result.fileList[0].tempFileURL
    } catch (error) {
      // 如果发生错误，error 对象会包含错误信息
      console.error('下载文件出错：', error);
    }
    console.log(tempFilePath);
    wx.hideLoading();
    return tempFilePath;
  },
  /**
   * @description 计算积分
   * @param {obj} integral 店铺积分规则设置
   * @param {number} tableCost 桌台费金额
   * @param {number} commotidyCost 商品费金额
   * @param {number} storedCost 储值金额
   * @returns {number} 本订单应得得全部积分 总数
   */
  computeIntegral(integral, tableCost, commotidyCost, storedCost) {
    if (Object.keys(integral).length === 0) { //商家没有定义 积分规则  直接返回0
      return 0;
    }
    var sum = 0;
    //计算桌台费积分
    if (integral.tableCost.switch) {
      sum += Math.trunc(tableCost / integral.tableCost.everyCost) * integral.tableCost.giveValues
    }
    //计算商品费积分
    if (integral.commotidy.switch) {
      sum += Math.trunc(commotidyCost / integral.commotidy.everyCost) * integral.commotidy.giveValues
    }
    //计算充值积分
    if (integral.stored.switch) {
      sum += Math.trunc(storedCost / integral.stored.everyCost) * integral.stored.giveValues
    }
    return sum;
  },
  //支付
  async new_pay(amount, description, sub_mchid, out_trade_no, openid) {
    if (amount <= 0) {
      console.log('支付金额:0,无需支付!')
      return true
    }
    const res = await this.callFunction({
      name: 'wx_pay',
      data: {
        item: 'getPayParams',
        parameter: {
          total_fee: amount,
          body: description,
          sub_mch_id: sub_mchid,
          out_trade_no: out_trade_no,
          openid: openid,
          appid: 'wxad610929898d4371'
        }
      }
    })
    console.log(res)
    if (!res.success) { //错误
      this.showToast('支付数据错误!', res.data)
      return false;
    }
    // 唤起微信支付组件，完成支付
    try {
      const payRes_ = await this.requestPayment(res.data)
      console.log(payRes_)
      if (payRes_.errMsg === "requestPayment:ok") {
        this.showToast('支付成功!', 'success')
        return true;
      }
    } catch (error) {
      console.log(error)
      this.showToast('支付失败!', 'error')
      return false;
    }
    return false;
  },
  //支付
  async pay(amount, description, my_sub_mchid, orderNum) {
    const res = await this.callFunction({
      name: 'unifiedOrder',
      data: {
        amount: (amount * 100).toString(),
        description: description,
        sub_mchid: my_sub_mchid,
        out_trade_no: orderNum,
        appid: 'wxad610929898d4371'
      }
    })
    console.log(res)
    if (res === undefined) { //错误
      this.showToast('支付数据错误!', 'error')
      return 'error';
    }
    // 唤起微信支付组件，完成支付
    try {
      const payRes_ = await this.requestPayment(res)
      console.log(payRes_)
      if (payRes_.errMsg === "requestPayment:ok") {
        this.showToast('支付成功!', 'success')
        return 'ok'
      }
    } catch (error) {
      console.log(error)
      this.showToast('支付失败!', 'error')
      return 'error';
    }
  },
  /**
   * 发起支付请求
   * @param {Object} options - 支付参数对象
   * @param {string} options.timeStamp - 时间戳
   * @param {string} options.nonceStr - 随机字符串
   * @param {string} options.package - 统一下单接口返回的 prepay_id 参数值
   * @param {string} options.paySign - 签名
   * @param {string} options.signType - 签名类型，默认为 'MD5'
   * @returns {Promise<Object>} - 返回一个 Promise 对象，成功时解析为支付结果对象，失败时拒绝并返回错误信息
   */
  async lightCtrl(channel, ONOFF, operater = this.getMemberName()) {
    const res = await this.callFunction({
      name: 'lightCtrl',
      data: {
        lightName: this.globalData.shop_device.lightCtrl,
        lightData: `{"A${channel.toString().padStart(2, '0')}":1${ONOFF}0000,"res":"123"}`,
        shopId: this.globalData.shop_account._id,
        tableNum: parseInt(channel),
        ONOFF: Number(ONOFF),
        operater: operater
      }
    })
    return res
  },
  requestPayment(options) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: options.timeStamp,
        nonceStr: options.nonceStr,
        package: options.package,
        paySign: options.paySign,
        signType: options.signType, // 该参数为固定值  
        success(res) {
          resolve(res)
        },
        fail(res) {
          reject(res)
        }
      });
    })
  },
  /**
   * @description 查询订单状态
   * @param {string} out_trade_no //商户订单号
   * @param {string} sub_mch_id 子商户号
   * @returns {obj} obj.success 查询成功与否
   */
  async payOrderQuery(out_trade_no, sub_mch_id, ) {
    const res = await this.callFunction({
      name: 'wx_pay',
      data: {
        item: 'orderQuery',
        parameter: {
          out_trade_no,
          sub_mch_id,
        }
      }
    })
    console.log({
      '支付返回数据': res
    });
    return res;
  },
  /**
   * @description 等待刷卡支付结果
   * @param {string} orderNum 
   */
  async awaitOrderResult(orderNum) {
    for (let index = 0; index < 50; index++) {
      // 使用Promise.race，哪个promise先resolve或reject，就处理哪个  
      try {
        const res = await this.payOrderQuery(orderNum, this.globalData.shop_account.proceedAccount)
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
      await this.delay(2000);
    }
    return false;
  },
  /**
   * 处理银行卡支付的异步函数
   * @param {number} amount - 支付金额
   * @param {string} description - 支付描述
   * @param {string} sub_mchid - 子商户号
   * @param {string} out_trade_no - 商户订单号
   * @param {string} auth_code - 用户授权码
   * @param {string} appid - 小程序appid
   * @returns {Promise<Object>} 支付返回的数据
   * 
   * 该函数通过调用云函数'cardPay'来处理支付请求，并返回支付结果。
   * 结果会先打印在控制台，然后作为promise返回。
   */
  async cardPay(amount, description, sub_mchid, out_trade_no, auth_code, appid) {
    const res = await this.callFunction({
      name: 'wx_pay',
      data: {
        item: 'micropay',
        parameter: {
          out_trade_no: out_trade_no,
          body: description,
          total_fee: amount,
          sub_mch_id: sub_mchid,
          auth_code: auth_code,
          appid: appid
        }
      }
    })
    // 如果callFunction的promise先resolve，那么就处理它的结果  
    console.log({
      '支付返回数据': res
    });
    return res;
  },
  /**
   * @description 检测云函数是否调用成功  成功返回ture
   * @param {obj} callFunctionResult //云函数返回值
   * @returns {boolean}
   */
  testCloudCallFunctionResult(callFunctionResult) {
    if (!callFunctionResult.success) {
      console.log(callFunctionResult.message)
      this.showModal('cf错误', '函数错误返回值错误!')
      return false
    }
    return true
  },
  onLaunch: async function () {
    // this.cloudInit()
    const res = wx.getLaunchOptionsSync();
    console.log(res)

    wx.cloud.init()
    // // 确认已经在 onLaunch 中调用过 wx.cloud.init 初始化环境（任意环境均可，可以填空）
    // const RES = await this.call({
    //   path:'/api/database',
    //   method:'POST',
    //   data:{
    //     "url":"/tcb/databasequery",
    //     "query":"db.collection(\"shopAccount\").where({_openid:\"oEIwT7UsIyN5FPHry3F6jUBXAm1A\"}).get()"
    //   }
    // })
    // console.log(RES)
  },
  /**
   * 封装的微信云托管调用方法
   * @param {*} obj 业务请求信息，可按照需要扩展
   * @param {*} number 请求等待，默认不用传，用于初始化等待
   */
  async call(obj, showLoading = true) {
    console.log(obj)
    if (showLoading) {
      this.showLoading('数据加载中...', true)
    }
    try {
      const result = await wx.cloud.callContainer({
        config: {
          env: 'prod-8g52amaia67c9b07', // 微信云托管的环境ID
        },
        path: obj.path, // 填入业务自定义路径和参数，根目录，就是 / 
        method: obj.method || 'GET', // 按照自己的业务开发，选择对应的方法
        // dataType:'text', // 如果返回的不是json格式，需要添加此项
        header: {
          'X-WX-SERVICE': 'express-6jsf', // xxx中填入服务名称（微信云托管 - 服务管理 - 服务列表 - 服务名称）
          // 其他header参数
        },
        data: obj.data
        // 其余参数同 wx.request
      })
      console.log(`微信云托管调用结果${result.errMsg} | callid:${result.callID}`)
      if (showLoading) {
        wx.hideLoading()
      }
      return result.data // 业务数据在data中
    } catch (e) {
      if (showLoading) {
        wx.hideLoading()
      }
      const error = e.toString()
      // 如果错误信息为未初始化，则等待300ms再次尝试，因为init过程是异步的
      if (error.indexOf("Cloud API isn't enabled") != -1 && number < 3) {
        return new Promise((resolve) => {
          setTimeout(function () {
            resolve(that.call(obj, number + 1))
          }, 300)
        })
      } else {
        throw new Error(`微信云托管调用失败${error}`)
      }
    }
  },
  /**
   * @description 获取制定月份的 员工打卡记录 可制定年月日
   * 
   */
  async getMemberAttendance(year_p, month_p, day_p) {
    const year = year_p || new Date().getFullYear()
    const month = month_p || new Date().getMonth()
    //当月第一天0点的时间截
    const startTimeStamp = new Date(year, month, day_p || 1, 0, 0, 0).getTime()
    //当月最后一天23.59:59秒的时间截
    // 当月最后一天 23:59:59 秒的时间戳
    const lastDay = day_p || new Date(year, month + 1, 0).getDate();
    const lastTimeStamp = new Date(year, month, lastDay, 23, 59, 59).getTime();
    console.log({
      'startTimeStamp': startTimeStamp,
      "lastTimeStamp": lastTimeStamp
    })
    //获取当月本店的所有打卡记录
    const attendanceRecords = await this.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"shop_member_attendance\").where({
            shopId:\"${this.globalData.shop_account._id}\",
            time:_.gte(${startTimeStamp}).and(_.lte(${lastTimeStamp}))
          }).orderBy(\"time\", \"desc\").limit(1000).skip(0).get()`
      }
    })
    console.log(attendanceRecords)
    return attendanceRecords.data.reduce((acc, item) => {
      acc.push(JSON.parse(item))
      return acc
    }, [])
  },
  cloudInit() {
    wx.cloud.init({
      env: 'billiards-0g53628z5ae826bc',
      traceUser: true,
    });
  },
  async getOrderInfo(collection, orderNum) {
    const res = await this.callFunction({
      name: 'getData_where',
      data: {
        collection: collection,
        query: {
          orderNum: orderNum,
        }
      }
    })
    if (res.success) {
      return {
        success: true,
        data: res.data[0]
      }
    } else {
      return {
        success: false,
        data: res
      }
    }
  },
  createOrderNum(p_date, orderHead) {
    return orderHead + this.getNowTime_noSTR(p_date) + this.getRandomString(5)
  },
  /**
   * @param {string} p_date 
   * @param {string} item  获取时间的格式 hms  为hh:mm:ss  年月日为2024年05月05日格式  其他参数为yy/mm/dd hh:mm:ss
   */
  getNowTime(p_date, item) {
    //console.log(p_date ?? '未传入date')
    // 获取当前时间
    var now = new Date();
    if (p_date) {
      now = p_date;
    }
    // 分别获取年、月、日、时、分、秒，并转换为数字
    const year = now.getFullYear();
    var month = now.getMonth() + 1; // 月份从0开始，需要加1
    var date = now.getDate();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    // 如果需要，可以添加前导零以确保总是两位数
    month = month < 10 ? '0' + month : month;
    date = date < 10 ? '0' + date : date;
    hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    // 返回组合成只包含数字的字符串
    //console.log(`${year}/${month}/${date} ${hours}:${minutes}:${seconds}`);
    if (item === 'hms') {
      return `${hours}:${minutes}:${seconds}`;
    } else if (item === '年月日') {
      return `${year}年${month}月${date}日`
    } else {
      return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
    }
  },
  /**
   * @param {Object} shopInfo  //当前选择的店铺信息  用于判断桌台使用剩余期限和精彩秀余额
   * @param {Object} operateSet //当前选择的 店铺营业参数  用于检测剩余获取用户短信次数
   */
  async checkMerchantBalance(shop_table, shop_account) {
    const yearsCostLow = 30 * 24 * 60 * 60 * 1000 //年费不足30天开始警告
    const sportShowLow = 50 //精彩秀余额不足 50元是 开始警告
    const shortMessageLow = 50 //获取用户短信次数 不足 50次时开始警告
    const now = new Date().getTime()
    //检查桌台年费剩余时长
    for (let index = 0; index < shop_table.length; index++) {
      const element = shop_table[index];
      //本桌台截止日期
      const thisStopTime = new Date(element.useEndTime).getTime()
      if (thisStopTime - now < yearsCostLow) { //本桌台剩余年费不足一个月
        const res = await wx.showModal({
          title: '提醒',
          content: '有桌台即将到期,到期后将无法使用.请前往桌台管理界面续费!'
        })
        break;
      }
    }
    //检测精彩秀费用
    if (this.globalData.shop_device.camera.length > 0) { //判断本店是否绑定了精彩秀设备
      if (shop_account.sportShowAmount < sportShowLow) {
        await wx.showModal({
          title: '提醒',
          content: '精彩秀余额不足,请前往设备管理界面进行充值,余额不足用户将无法调取视频!'
        })
      }
    }
    //检测 获取用户电话号码次数
    if (this.globalData.shop_operate_set.startSet.phoneImpower === true) { //开台需要检测用户 是否绑定手机号
      if (shop_account.shortMsgDegree < shortMessageLow) {
        await wx.showModal({
          title: '提醒',
          content: '短信验证额度即将不足,无额度后将无法获取顾客手机号码!请前往营业参数设置出设置!'
        })
      }
    }
    return;
  },
  /**
   * @description 检查店铺名称 与商户信息里面的名称是否相同,不相同 自动同步
   * @param {object} merchantInfo 商户信息
   * @param {object} shopInfo 获取到的 店铺信息
   */
  async checkMerchantShopName(merchantInfo, shopInfo) {
    var merchantInfoVar = merchantInfo;
    console.log(merchantInfoVar)
    for (let index = 0; index < merchantInfoVar.shopId.length; index++) {
      const element = merchantInfoVar.shopId[index];
      if (element.shopId === shopInfo._id) { //这个店铺
        if (element.shopName === shopInfo.shopInfo.shopName) { //店铺名称 没有变化
          return;
        } else { //店铺名称有变化
          //修改商户信息里面的店铺名称
          const res = await this.callFunction({
            name: 'upDate',
            data: {
              collection: 'merchant_info',
              query: {
                _id: merchantInfo._id
              },
              upData: {
                [`shopId.${index}.shopName`]: shopInfo.shopInfo.shopName
              }
            }
          })
          if (res.success) {
            this.showToast('店名同步成功!', 'success')
            return {
              index: index,
              shopName: shopInfo.shopInfo.shopName
            };
          } else {
            this.showToast('店名同步失败!', 'success')
            return;
          }
        }
      }
    }
  },
  getNowTime_noSTR(p_date, item) {
    // 获取当前时间
    const now = p_date;
    // 分别获取年、月、日、时、分、秒，并转换为数字
    const year = now.getFullYear();
    var month = now.getMonth() + 1; // 月份从0开始，需要加1
    var date = now.getDate();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var seconds = now.getSeconds();
    // 如果需要，可以添加前导零以确保总是两位数
    month = month < 10 ? '0' + month : month;
    date = date < 10 ? '0' + date : date;
    hours = hours < 10 ? '0' + hours : hours == 24 ? "00" : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    // 返回组合成只包含数字的字符串
    if (item === undefined) {
      console.log(`${year}${month}${date}${hours}${minutes}${seconds}`);
      return `${year}${month}${date}${hours}${minutes}${seconds}`;
    } else if (item === '年月') {
      console.log(`${year}${month}`);
      return `${year}${month}`;
    } else if (item === '年月日') {
      console.log(`${year}${month}${date}`);
      return `${year}${month}${date}`;
    }
  },
  /**
   * @description 获取指定时间日期的 00:00:00  或者 23:59:59
   * @param {startTime || undefined} time 
   * @param {endTime || undefined} time
   * @returns {string}  2025-11-10 00:00:00 || 2025-11-10 23:59:59 格式的日期
   */
  getDateTimeLowOrHi(startTime, endTime) {
    if (dayOrMonth === '月') { //按月查询
      const firstDay = dateObj.setDate(1)
      const lastDay = dateObj.setMonth(dateObj.getMonth() + 1, 0)
      return {
        startTimeStamp: (firstDay.setHours(0, 0, 0, 0)).getTime(),
        endTimeStamp: (lastDay.setHours(23, 59, 59, 999)).getTime()
      }
    } else { //按日查询
      return {
        startTimeStamp: (dateObj.setHours(0, 0, 0, 0)).getTime(),
        endTimeStamp: (dateObj.setHours(23, 59, 59, 999)).getTime()
      }
    }
  },
  //获取随机字符串
  getRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  },
  showLoading(titel, mask) {
    wx.showLoading({
      title: titel,
      mask: mask
    })
  },
  async showModal(title, content) {
    return wx.showModal({
      title: content ? title : '提示',
      content: content || title,
    })
  },
  //获取当前操作人姓名
  getMemberName() {
    const shop_member = this.globalData.shop_member
    const merchant_info = this.globalData.merchant_info
    const shop_account = this.globalData.shop_account
    if (shop_account._openid === merchant_info._openid) {
      return 'boss'
    } else {
      for (let member of shop_member) {
        if (member.memberOpenid === merchant_info._openid) {
          return member.userName
        }
      }
    }
    return '未知员工'
  },
  showToast(titel, icon) {
    wx.showToast({
      title: titel,
      icon: icon
    })
  },
  async callFunction(event) {
    const {
      name,
      data,
      showLoading
    } = event;
    if (showLoading === undefined || showLoading === true) {
      this.showLoading('数据处理中...', true)
    }
    console.log({
      name: name,
      data: data
    })
    const res = await wx.cloud.callFunction({
      name: name,
      data
    })
    if (showLoading === undefined) {
      wx.hideLoading();
    }
    console.log(res);
    return res.result;
  },
  /**
   * 当小程序启动，或从后台进入前台显示，会触发 onShow
   */
  onShow: function (options) {

  },

  /**
   * 当小程序从前台进入后台，会触发 onHide
   */
  onHide: function () {

  },

  /**
   * 当小程序发生脚本错误，或者 api 调用失败时，会触发 onError 并带上错误信息
   */
  onError: function (msg) {

  },
  //检测是否有绑定灯控器函数
  haveLight() {
    if (this.globalData.shop_device.lightCtrl !== '') {
      console.log('灯控器ID:' + this.globalData.shop_device.lightCtrl)
      return true;
    } else {
      this.showToast('请先绑定灯控器!', 'error')
      return false;
    }
  },
  /**
   * @description //获取一个日期对象  一天或者一个月内 的起始时间截 和 最晚时间截
   * @param {string} dateObj //2025年09月19日 格式
   * @param {string} dayOrMonth //2025年09月19日 格式
   *@returns {obj} {startTimeStamp:num,endTimeStamp:num}
   */
  getTimeLowOrHi(dateObj, dayOrMonth) {
    if (dayOrMonth === '月') { //按月查询
      const firstDay = new Date(dateObj.setDate(1))
      const lastDay = new Date(dateObj.setMonth(dateObj.getMonth() + 1, 0))
      firstDay.setHours(0, 0, 0, 0)
      lastDay.setHours(23, 59, 59, 999)
      return {
        startTimeStamp: firstDay.getTime(),
        endTimeStamp: lastDay.getTime()
      }
    } else { //按日查询
      const firstDay = new Date(dateObj.getTime())
      const lastDay = new Date(dateObj.getTime())
      firstDay.setHours(0, 0, 0, 0)
      lastDay.setHours(23, 59, 59, 999)
      return {
        startTimeStamp: firstDay.getTime(),
        endTimeStamp: lastDay.getTime()
      }
    }
  },
  /**
   * @description 获取年月  或者 年月日 的时间日期对象
   * @param {string} ymd  2025年05月    // 2025年05月05日 格式的数据
   */
  getDateObj(ymd) {
    if (ymd.length < 10) { //判断参数是否为日期
      return new Date();
    }
    const dateStr = ymd + ' 12:00:00';
    const dateParts = dateStr.match(/(\d+)年(\d+)月(\d+)日 (\d+):(\d+):(\d+)/);
    if (dateParts) {
      const year = parseInt(dateParts[1]);
      const month = parseInt(dateParts[2]) - 1; // 月份从0开始  
      const day = parseInt(dateParts[3]);
      const hour = parseInt(dateParts[4]);
      const minute = parseInt(dateParts[5]);
      const second = parseInt(dateParts[6]);
      const date = new Date(year, month, day, hour, minute, second);
      return date;
    } else {
      console.log('Invalid date string');
      return 'error';
    }
  },
  async getShopGroupBuying(shopId = this.globalData.shop_account._id) {
    const res = await this.callFunction({
      name: 'getData_where',
      data: {
        collection: 'shop_group_buying',
        query: {
          shopId: shopId
        }
      }
    })
    if (res.success) {
      return res
    }
    return []
  },
  /**
   * @description  //获取空小程序码 并上传使用信息
   * @param {object} upData  //item 项目名称 是必要选项 , 其他请根据需求上传
   */
  async getAndupDateQr(upData) {
    //先获取  空白小程序码
    const res = await this.callFunction({
      name: 'fetchData',
      data: {
        skip: 0,
        limit: 1,
        collection: 'shop_table_qr',
        query: {
          using: 0
        }
      }
    })
    console.log(res)
    var picData = ''
    let qrId = ''
    if (!res.success) {
      this.showToast('获小程序码失败!', 'error');
      wx.hideLoading();
      throw '获小程序码失败!'
    }
    if (res.data.data.length === 0) {
      this.showModal('提示', '数据库二维码数量不足,请联系客户补充!')
      throw '数据库二维码数量不足,请联系客户补充!'
    }
    this.showToast('获取小程序码成功!', 'success')
    let base64String = res.data.data[0].qrData;
    qrId = res.data.data[0]._id
    picData = 'data:image/png;base64,' + base64String

    const qrData = {
      qrId: qrId,
      picData: picData,
      _id:res.data.data[0]._id,
      version: (res.data.data[0].version || 0) + 1
    }
    //上传的数据
    const upDate = {
      ...upData,
      qrData:'',
      using: 1
    }
    const upDateRes = await this.callFunction({
      name: 'upDate',
      data: {
        collection: 'shop_table_qr',
        query: {
          _id: qrData.qrId
        },
        upData:upDate,
        _inc:{
          version:1
        }
      }
    })
    if (!upDateRes.success) {
      this.showModal('上传QR数据失败!')
      throw 'error --- 上传qr数据失败!'
    }
    //上传成功 重新获取一下验证数据是否正确
    const secondData = await this.callFunction({
      name:'getData_doc',
      data:{
        collection:'shop_table_qr',
        _id:qrData._id
      }
    })
    if(!secondData.success){
      this.showModal('验证数据失败! 请重新获取!')
      throw 'error 验证数据失败,请重新获取!'
    }
    //验证数据
    const data = secondData.data
    if(!data.using){
      this.showModal('数据异常---使用状态异常! 请重新获取!')
      throw 'error 数据异常---使用状态异常! 请重新获取!'
    }
    if(data.version !== qrData.version){
      this.showModal('数据异常---版本异常! 请重新获取!')
      throw 'error 数据异常---版本异常! 请重新获取!'
    }
    if(data.qrData){
      this.showModal('数据异常---qr数据未清理! 请重新获取!')
      throw 'error 数据异常---qr数据未清理! 请重新获取!'
    }
    console.log(upDateRes)
    return qrData
  },
  //权限检测函数
  async power(powerType, powerName) { //有权返回 true  无权限返回false
    const power = this.globalData.shop_member_power
    const status = this.globalData.status
    if (this.globalData.status === 'boss') {
      return true;
    } else {
      // console.log(power[status]?.[powerType]?.[powerName]?.value)
      return power[status]?.[powerType]?.[powerName]?.value || false
    }
  },
  /**
   * @description 获取不受限制的小程序二维码
   * @param {JSON} qrData 
   * @param {String} miniProgramPath 
   * @returns {JSON} 返回微信云开发获取到的二维码信息  和 数据库_id 
   */
  async getUnlimitedQr(qrData, miniProgramPath) {
    const _id = this.getRandomString(28)
    //上传QR信息
    const upQrDataRes = await this.updateQrData({
      _id: _id,
      ...qrData
    })
    if (!upQrDataRes.success) { //
      console.log('上传QR信息失败!')
      return {
        success: false,
        message: 'get Qr Code Failed'
      }
    }
    //获取二维码
    console.log(miniProgramPath)
    const res = await this.callFunction({
      name: 'getQRCode',
      data: {
        pages: miniProgramPath,
        scene: _id
      }
    })
    console.log(res)
    return {
      _id: _id,
      ...res
    }
  },
  async DialogConfirm({
    Dialog,
    title,
    message,
    messageAlign,
    confirmButtonText,
    cancelButtonText
  }) {
    //重要提示时代付 
    try {
      const DialogRes = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => { // [!code ++]
          Dialog.close();
          wx.showToast({
            title: '选择超时!',
            icon: 'error'
          });
          reject(new Error('操作超时'));
        }, 30000); // 30秒未操作自动终止，防止阻塞界面  
        Dialog.confirm({
            title: title,
            message: message,
            messageAlign: messageAlign || 'center', // left right center
            confirmButtonText: confirmButtonText || '确定',
            cancelButtonText: cancelButtonText || '取消'
          })
          .then(() => {
            clearTimeout(timeoutId); // [!code ++] 清除定时器 
            resolve(true)
          })
          .catch(() => {
            clearTimeout(timeoutId); // [!code ++] 清除定时器 
            reject(true)
          });
      })
      if (DialogRes) {
        return true
      }
    } catch (e) {
      console.log({
        '用户取消': e
      })
      return false
    }
  },
  noPowerMessage() {
    this.showToast('没有权限!', 'error')
  },
  /**
   * @description //获取指定起始时间 到结束时间的所有本店订单
   * @param {*} startTime 
   * @param {*} endTime 
   */
  async getOrderData(startTime, endTime, showLoading) {
    console.log('起始时间:' + this.getNowTime(new Date(startTime)) + "||结束时间:" + this.getNowTime(new Date(endTime)))
    let allData = []
    const res = await this.call({
      path: '/api/database',
      method: 'POST',
      data: {
        url: '/tcb/databasequery',
        query: `db.collection(\"table_order\").where({
            shopId:\"${this.globalData.shop_account._id}\",
            time:_.gte(${startTime}).and(_.lte(${endTime}))
          }).orderBy(\"time\", \"desc\").limit(1000).skip(0).get()`
      }
    }, showLoading)
    console.log(res)
    allData.push(...res.data)
    const total = res.pager.Total
    console.log(res)
    let i = 1
    while (i * 1000 < total) {
      const res = await this.call({
        path: '/api/database',
        method: 'POST',
        data: {
          url: '/tcb/databasequery',
          query: `db.collection(\"table_order\").where({
                shopId:\"${this.globalData.shop_account._id}\",
                time:_.gte(${startTime}).and(_.lte(${endTime}))
              }).orderBy(\"time\", \"desc\").limit(1000).skip(${i * 1000}).get()`
        }
      })
      allData.push(...res.data)
      i++
    }
    allData = this.getOrderArr_parse(allData)
    this.globalData.disPlayOrderForm = allData
    return allData
  },
  getOrderArr_parse(orderArr) {
    const res = orderArr.reduce((acc, item) => {
      acc.push(JSON.parse(item))
      return acc
    }, [])
    console.log(res)
    return res
  },
  //延时
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  //计算桌台费
  computeTableCost(chargingArray, chargingId, nowPrice, startTime, endTime) {
    console.log({
      chargingArray,
      chargingId,
      nowPrice,
      startTime,
      endTime
    })
    const allTime = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000 / 60 //总时长分钟
    var charging = {};
    var amount = 0;
    //获取使用的计费规则
    for (let index = 0; index < chargingArray.length; index++) {
      const element = chargingArray[index];
      if (chargingId === element._id) { //锁定计费规则
        charging = element;
        break;
      }
    }
    //选择计费方式
    if (charging.periodSet === 'minute') { //按分钟计费
      amount = parseInt(nowPrice / 60 * allTime);
    } else if (charging.periodSet === 'costCost') { //按金额计费
      if (allTime < charging.costCost.freeTime) { //小于起始计费时间 不收费
        amount = 0;
      } else {
        amount = Math.trunc(parseInt(nowPrice / 60 * allTime) / charging.costCost.everyCost) * charging.costCost.everyCost + (parseInt(nowPrice / 60 * allTime) % charging.costCost.everyCost === 0 ? 0 : parseInt(charging.costCost.everyCost))
      }
    } else if (charging.periodSet === 'period') { //按周期计费
      amount = Math.ceil(allTime / charging.periodCost.periodTime) * (nowPrice / (60 / charging.periodCost.periodTime))
    }
    //计算 是否使用起步价格
    if (charging.startCost.value === true) { //使用起步价格
      if (allTime > charging.startCost.startTime) { //总时间大于起始计费时间
        if (amount > charging.startCost.startCost) { //总金额大于起步价
          return amount;
        } else { //总金额小于起步价 收取起步价
          return parseInt(charging.startCost.startCost);
        }
      } else { //没有达到起始计费时间
        return 0;
      }
    } else { //不使用起步价
      return amount;
    }
  },
  //获取 身份  函数
  getStatus(openid) {
    const member = this.globalData.shop_member
    if (openid === this.globalData.shop_account._openid) {
      return 'boss'
    } else {
      for (let index = 0; index < member.length; index++) {
        const element = member[index].memberOpenid;
        if (element === openid) {
          return member[index].position
        }
      }
      //没有职位信息  返回'NO'
      return 'NO'
    }
  },
  async getMerchantInfo() {
    const res = await this.callFunction({
      name: 'getOrInsertData',
      data: {
        collection: 'merchant_info',
        query: {
          _openid: '',
        },
        dataToInsert: {
          shopId: []
        }
      }
    })
    console.log(res)
    if (res.success) {
      return res.data
    } else {
      return false
    }
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '智享自助商家端',
      path: '../login/login',
    }
  }
})