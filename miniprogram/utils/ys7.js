const md5 = require('../utils/md5')
const oken = ''
const APPKEY = '13941b2f10414719b0ec72f808e6aa12'
export const TIMEOUT = 6000
export const BASE_URL = 'https://open.ys7.com/api/lapp/'
export const spaceId = '104954'
export async function getToken(app) {
  //判断本地存储是否有 token数据
  if (oken) {
    return oken
  }
  const res = await app.callFunction({
    name: 'get_ys7_token',
    data: {}
  })
  console.log(res);
  if (res.code !== 200) {
    wx.showModal({
      title: '提示',
      content: 'error ---' + res.message,
    })
    throw 'error ---' + res.message
  }
  return res.data.accessToken
}


/**
 *
 * @param {object} options
 * @description 使用 promise 封装 wx.request
 */
export function request(options) {
  console.log(options)
  return new Promise((resolve, reject) => {
    wx.request({
      url: (options.BASE_URL ? options.BASE_URL : BASE_URL) + options.url,
      method: options.method || 'POST',
      timeout: TIMEOUT,
      data: options.data,
      header: options.header,
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
 * @description 根据设备型号以及设备版本号查询设备是否支持萤石协议
 * @param {object} ccloudcallFunction //微信云函数的 调用对象
 * @param {string} model 设备型号
 * @param {string} version 设备版本号
 */
export async function device_is_support_ys7(app, model, version) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/support/ezviz'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?model=${model}&version=${version}&appKey=${appKey}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 添加设备到账号下
 * @param {object} app 微信云函数
 * @param {string} deviceSerial //设备序列号
 * @param {string} validateCode //设备安全吗
 */
export async function deviceAdd(app, deviceSerial, validateCode) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/add'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?deviceSerial=${deviceSerial}&validateCode=${validateCode}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 删除账号下设备
 * @param {object} app 微信云函数
 * @param {string} deviceSerial //设备序列号
 */
export async function deviceDelete(app, deviceSerial) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/delete'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?deviceSerial=${deviceSerial}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 用于根据序列号通道号获取设备状态信息
 * @param {object} app 微信云函数
 * @param {string} deviceSerial //设备序列号
 * @param {number} channel 通道号,默认为1
 */
export async function deviceStatusGet(app, deviceSerial, channel = 1) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/status/get'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?deviceSerial=${deviceSerial}&channel=${channel}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 设备基础信息查询
 * @param {object} app 
 * @param {string} deviceSerial //设备序列号
 * @returns {object} 
 */
export async function searchDeviceInfo(app, deviceSerial) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/searchDeviceInfo'
  const method = 'GET'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    BASE_URL: 'https://open.ys7.com/api/v3/',
    url: URL + `?deviceSerial=${deviceSerial}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 修改云端设备名称
 * @param {object} app 
 * @param {string} deviceSerial //设备序列号
 * @returns {object} { "code": "200","msg": "操作成功!"}
 */
export async function deviceNameUpdate(app, deviceSerial, newName) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/name/update'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?deviceSerial=${deviceSerial}&deviceName=${newName}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 获取播放地址
 * @param {object} app 
 * @param {string} deviceSerial //设备序列号
 * @param {number} channelNo //通道号，非必选，默认为1
 * @param {number} gbchannel //国标设备的通道编号，视频通道编号ID
 * @param {string} code 	ezopen协议地址的设备的视频加密密码
 * @param {string} type //地址的类型，1-预览，2-本地录像回放，3-云存储录像回放，非必选，默认为1；回放仅支持rtmp、ezopen、flv协议
 * @param {string} startTime 本地录像/云存储录像回放开始时间,云存储开始结束时间必须在同一天，示例：2019-12-01 00:00:00
 * @param {string} stopTime 本地录像/云存储录像回放结束时间,云存储开始结束时间必须在同一天，示例：2019-12-01 23:59:59
 * @param {number} protocol 流播放协议，1-ezopen、2-hls、3-rtmp、4-flv，默认为1
 * @returns {object} {"msg": "Operation succeeded","code": "200","data": {"id": "254708522214232064","url": "https://open.ys7.com/v3/openlive/C78957921_1_1.m3u8?expire=1606999273&id=254708522214232064&t=093e5c6668d981e0f0b8d2593d69bdc98060407d1b2f42eaaa17a62b15ee4f99&ev=100","expireTime": "2020-12-03 20:41:13"}
}
 */
export async function liveAddressGet({ app, deviceSerial, channelNo = 1, gbchannel, code, type = '1', startTime, stopTime, protocol = 1 }) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'live/address/get'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    BASE_URL: 'https://open.ys7.com/api/lapp/v2/',
    url: URL + `?accessToken=${token}&deviceSerial=${deviceSerial}&channelNo=${channelNo}${gbchannel ? '&gbchannel=' + gbchannel : ''}&code=${code}&type=${type}${startTime ? '&startTime=' + startTime : ''}${stopTime ? '&stopTime=' + stopTime : ''}&protocol=${protocol}`,
    method: method
  })
  return res
}
/**
 * @description 关闭设备视频加密
 * @param {object} app 
 * @param {string} deviceSerial //设备序列号
 * @returns {object} { "code": "200","msg": "操作成功!"}
 */
export async function deviceEncryptOff(app, deviceSerial) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = 'device/encrypt/off'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    url: URL + `?deviceSerial=${deviceSerial}&accessToken=${token}`,
    method: method
  })
  return res
}
/**
 * @description 创建存储空间
 * @param {obj} app 
 * @param {string} expireDays 过期天数，默认7天，时间范围: 0：永久保存，1-3650：过期时间，单位：天
 * @param {string} spaceName 录像空间名称, 格式: 仅支持中文、英文、数字、下划线，长度不超过32个字符
 */
export async function creatVideoSpace(app, expireDays, spaceName) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloudrecord/video/space'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token
    },
    data: {
      expireDays: expireDays,
      spaceName: spaceName
    },
    BASE_URL: 'https://open.ys7.com/api',
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 查询存储空间信息
 * @param {obj} app 
 * @param {string} spaceId 
 */
export async function queryVideoSpace(app, spaceId) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloudrecord/video/space'
  const method = 'GET'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token
    },
    data: {
      spaceId: spaceId
    },
    BASE_URL: 'https://open.ys7.com/api',
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 查询存储空间列表
 * @param {obj} app 
 * @param {string} spaceId 
 */
export async function queryVideoSpaceList(app, startTime, endTime, lastSpaceId, pageSize) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloudrecord/video/space/listById'
  const method = 'GET'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token
    },
    data: {
      startTime,
      endTime,
      lastSpaceId,
      pageSize
    },
    BASE_URL: 'https://open.ys7.com/api',
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 模板列表查询
 * @param {obj} app 
 */
export async function queryVideoTemplateList(app) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloud/video/template/list'
  const method = 'GET'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token
    },
    BASE_URL: 'https://open.ys7.com/api',
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 创建一次性录制计划
 * @param {*} app 
 * @param {string} planName 计划名称，允许为 中文、英文、数字、下划线、中划线1-32位
 * @param {long} spaceId 空间ID
 * @param {string} startTime 开始时间，格式： yyyyMMddHHmmss
 * @param {string} endTime 结束时间，格式： yyyyMMddHHmmss ，
 * @param {Array} devIndexInfos [{deviceSerial	string	是	设备序列号,localIndex	string	是	通道号,validateCode	string	否	设备验证码}]
 * @param {long} templateId 模板ID 
 */
export async function planOneOff(app, planName, spaceId, startTime, endTime, devIndexInfos, templateId) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloudrecord/video/plan/oneOff'
  const method = 'POST'
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token
    },
    BASE_URL: 'https://open.ys7.com/api',
    data: {
      planName,
      spaceId,
      startTime,
      endTime,
      devIndexInfos,
      templateId
    },
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 回放视频转码录制存储接口
 * @param {*} app 
 * @param {string} localIndex 	设备通道 默认1
 * @param {string} deviceSerial 设备序列号	
 * @param {string} projectId 项目ID，项目的唯一标识，需输入已创建的项目ID
 * @param {string} devProto 若不传，则标识为萤石协议； 若传：gb28181，标识为国标设备 ；默认不传
 * @param {string} validateCode 录像解密密钥， 若设备加密则必须填写，否则视频无法录制成功;若设备未加密，则该入参不要传
 * @param {string} startTime 录像开始时间，格式: yyyyMMddHHmmss
 * @param {string} endTime 录像结束时间，格式:yyyyMMddHHmmss
 * @param {string} recType 录像类型，local-本地录像，cloud-云存储，record-云录制2.0
 */
export async function recVideoSave(app, localIndex, deviceSerial, projectId, devProto, validateCode, startTime, endTime, recType) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/open/cloud/v1/rec/video/save'
  const method = 'POST'
  const data = {
    projectId,
    validateCode,
    startTime,
    endTime,
    recType,
    filePrefix:`${new Date().getTime()}`
  }
  if(devProto){
    data.devProto = devProto
  }
  const res = await request({
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'accessToken': token,
      'localIndex': localIndex,
      'deviceSerial': deviceSerial
    },
    BASE_URL: 'https://open.ys7.com/api',
    data:data,
    url: URL,
    method: method
  })
  return res
}
/**
 * @description 根据任务ID查询文件列表
 * @param {*} app 
 * @param {string} taskId 任务 ID 
 * @param {int} pageNumber 分页页码，以0开始，默认为0
 * @param {int} pageSize 分页大小，从1开始，不能大于50
 * @param {boolean} hasUrl 是否需要下载链接， true:需要，false不需要，默认值是false。若任务中的文件移动至归档存储项目中，且没有解冻，该文件的下载链接会为空
 */
export async function queryTaskFiles(app, taskId, pageNumber, pageSize, hasUrl) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/v3/open/cloud/task/files'
  const method = 'GET'
  const res = await request({
    BASE_URL: 'https://open.ys7.com/api',
    url: URL + `?accessToken=${token}&taskId=${taskId}&pageNumber=${pageNumber}&pageSize=${pageSize}&hasUrl=${hasUrl}`,
    method: method
  })
  return res
}
/**
 * @description 获取文件下载/在线播放地址
 * @param {*} app 
 * @param {string} fileId 文件ID，项目下文件的唯一标识，需输入已录制的文件ID
 * @param {string} projectId 项目ID，项目的唯一标识，需输入已创建的项目ID
 */
export async function file_official_download(app, fileId, projectId) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/service/cloudrecord/file/official/download'
  const method = 'GET'
  const res = await request({
    BASE_URL: 'https://open.ys7.com/api',
    header:{
      'accessToken':token
    },
    url: URL + `?contentType=video/mp4&fileId=${fileId}&projectId=${projectId}`,
    method: method
  })
  return res
}
/**
 * @description 查询任务详情接口
 * @param {*} app 
 * @param {string} taskId 任务 ID 
 */
export async function queryTask(app, taskId) {
  const token = await getToken(app)
  const appKey = APPKEY
  const URL = '/v3/open/cloud/task'
  const method = 'GET'
  const res = await request({
    BASE_URL: 'https://open.ys7.com/api',
    url: URL + `/${taskId}?accessToken=${token}`,
    method: method
  })
  return res
}