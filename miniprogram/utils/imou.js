const md5 = require('../utils/md5')
export const TIMEOUT = 6000
export const BASE_URL = 'https://openapi.lechange.cn/openapi/'



/**
 *
 * @param {number} number 生成随机数的个数
 */
function makeRandom(number) {
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  let nums = "";
  for (var i = 0; i < number; i++) {
    var id = parseInt(Math.random() * 61);
    nums += chars[id];
  }
  return nums;
}
/**
 * @param {deviceId} string 摄像头的S/N 序列号
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 * @description 成功返回 msg === "操作成功。"  
 */
async function getDeviceOnline(deviceId, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'deviceOnline',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        token: token,
        deviceId: deviceId
      }
    }
  })
  console.log(res)
  if (res.result.msg === "操作成功。") {
    return res;
  } else {
    return res.result;
  }

}
/**
 * @param {deviceId} string 摄像头的S/N 序列号
 * @param {productId} string 设备产品id，解绑 子设备 时必填 无子设备请赋值undefined
 * @param {subDeviceId} string 子设备序列号，解绑 子设备 时必填 无子设备请赋值undefined
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function unBindDevice(deviceId, productId, subDeviceId, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  var params = {};
  if (productId === undefined) { //无子设备
    params = {
      'token': token,
      'deviceId': deviceId
    }
  } else { //有子设备
    params = {
      'token': token,
      'deviceId': deviceId,
      'productId': productId,
      "subDeviceId": subDeviceId
    }
  }
  const res = await request({
    url: 'unBindDevice',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: params
    }
  })
  console.log(res)
  if (res.result.msg === "操作成功。") {
    return 'ok';
  } else {
    return res.result.msg;
  }
}
/**
 * @param {deviceId} string 摄像头的S/N 序列号
 * @param {code} string 摄像头的安全码
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function bindDevice(deviceId, code, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'bindDevice',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "deviceId": deviceId,
        "code": code,
        "token": token
      }
    }
  })
  console.log(res)
  if (res.result.msg === "操作成功。") {
    return 'ok';
  } else {
    return res.result.msg;
  }
}
/**
 *
 * @param {object} options
 * @description 使用 promise 封装 wx.request
 */
export function request(options) {
  console.log(options)
  const {
    appId,
    appSecret,
    params
  } = options.data
  const time = parseInt(Date.now() / 1000)
  const nonce = makeRandom(32)
  const sign = `time:${time},nonce:${nonce},appSecret:${appSecret}`
  const signMd5 = md5.hexMD5(sign)
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: 'post',
      timeout: TIMEOUT,
      data: {
        system: {
          "ver": "1.0",
          appId,
          sign: signMd5,
          nonce,
          time,
        },
        id: nonce,
        params,
      },
      success: function (res) {
        console.log(res)
        resolve(res.data)
      },
      fail: reject,
      complete: res => {
        wx.hideLoading()
      }
    })
  })
}

/**
 *
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 * @description 调用http接口生成accessToken
 * @returns {string} 成功返回accessToken  失败返回error
 */
export async function getAccessToken(appId, appSecret) {
  //判断本地存储是否有 token数据 
  const res = await request({
    url: 'accessToken',
    data: {
      appId,
      appSecret
    }
  })
  console.log(res);
  if (res.result.msg === '操作成功。') { //成功
    return res.result.data.accessToken;
  } else { //失败
    return 'error'
  }
}
/**
 * 
 * @description 创建云转存任务
 * @param {string} projectId //项目id
 * @param {string} deviceId //	设备序列号
 * @param {string} channelId //通道号
 * @param {Integer} taskType //任务类型，1本地录像，2云存储
 * @param {Integer} combine 	//是否合并，0否，1是
 * @param {string} beginTime //开始时间，yyyy-MM-dd HH:mm:ss
 * @param {string} endTime //结束时间，yyyy-MM-dd HH:mm:ss
 * @param {Integer} sliceTime //切片时长，单位分钟（30-180）
 * @param {String} password //	设备密码加密后的字符串
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function createProjectTask(projectId, deviceId, channelId, taskType, combine, beginTime, endTime, sliceTime, password, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'createProjectTask',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "token": token,
        "projectId": projectId,
        "deviceId": deviceId,
        'channelId': channelId,
        'taskType': taskType,
        'beginTime': beginTime,
        'endTime': endTime,
        'combine': combine,
        'sliceTime': sliceTime,
        "password": password
      }
    }
  })
  console.log(res)
  //分析结果
  if (res.result.msg === '操作成功。') { //创建成功
    return res.result;
  } else(
    wx.showToast({
      title: res.result.msg
    })
  )
}
/**
 * 
 * @param {string} projectName 项目名称，支持数字字母下划线,最大长度 20
 * @param {integer} expireDays 保存时间天数，至少为 7 天，最大为 365*5 天
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function createProject(projectName, expireDays, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'createProject',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "projectName": projectName,
        "expireDays": expireDays,
        "token": token
      }
    }
  })
  console.log(res)
  //判断是否成功
  if (res.result.msg === '操作成功。') {
    //返回项目 ID 
    return res.result
  } else {
    console.log('项目创建失败!');
    return 'error'
  }
}
/**
 * 
 * @param {integer} pageNo //	页码
 * @param {integer} pageSize //页大小
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function queryProjectsByPage(pageNo, pageSize, appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'queryProjectsByPage',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "token": token,
        'pageNo': pageNo,
        'pageSize': pageSize
      }
    }
  })
  console.log(res)
  if (res.result.msg === "操作成功。") {
    return res.result;
  } else {
    return res.result.msg;
  }
}
/**
 * 
 * @description //分页获取任务下的文件列表
 * @param {*} pageNo 页码
 * @param {integer} pageSize 	页大小
 * @param {string} taskId 	文件所属任务id
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function queryProjectTaskFilesByTaskId(pageNo,pageSize,taskId,appId, appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'queryProjectTaskFilesByTaskId',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "token": token,
        "pageNo": pageNo,
        "pageSize": pageSize,
        'taskId': taskId
      }
    }
  })
  console.log(res)
  if (res.result.msg === '操作成功。') {
    return res.result;
  } else {
    console.log('操作失败!')
    wx.showToast({
      title: res.result.msg,
    })
  }
}
/**
 * 
 * @description //查询任务详情
 * @param {string} taskId 	任务id
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
 */
async function queryProjectTaskDetailByTaskId(taskId,appId,appSecret) {
  //先获取 token
  const token = await getAccessToken(appId, appSecret);
  if (token === 'error') { //获取失败
    return 'getTokenError'
  }
  const res = await request({
    url: 'queryProjectTaskDetailByTaskId',
    data: {
      appId: appId,
      appSecret: appSecret,
      params: {
        "token": token,
        'taskId': taskId
      }
    }
  })
  console.log(res)
  if (res.result.msg === '操作成功。') {
    return res.result;
  } else {
    console.log('操作失败!')
    wx.showToast({
      title: res.result.msg,
    })
  }
}

 /**
  * @description //设置设备本地录像视频流类型
  * @param {string} deviceId 设备序列号
  * @param {string} channelId 通道号
  * @param {string} streamType 本地录像视频流类型 //"main"：高清主码流，"extra1"：标清辅码流
 * @param {string} appId  用户appId
 * @param {string} appSecret  用户appSecret
  */
 async function setLocalRecordStream(deviceId,channelId,streamType,appId,appSecret) {
 //先获取 token
 const token = await getAccessToken(appId, appSecret);
 if (token === 'error') { //获取失败
  return 'getTokenError'
}
 const res = await request({
   url: 'setLocalRecordStream',
   data: {
     appId: appId,
     appSecret: appSecret,
     params: {
       "token": token,
       "deviceId":deviceId,
       "channelId":channelId,
       "streamType":streamType
     }
   }
 })
 console.log(res)
 if (res.result.msg === '操作成功。') {
   return 'ok'
 } else {
   console.log('操作失败!')
   wx.showToast({
     title: res.result.msg,
   })
 }
}
module.exports = {
  bindDevice: bindDevice,
  unBindDevice: unBindDevice,
  getDeviceOnline: getDeviceOnline,
  createProject: createProject,
  createProjectTask: createProjectTask,
  queryProjectsByPage: queryProjectsByPage,
  queryProjectTaskFilesByTaskId: queryProjectTaskFilesByTaskId,
  queryProjectTaskDetailByTaskId:queryProjectTaskDetailByTaskId,
  setLocalRecordStream:setLocalRecordStream
}