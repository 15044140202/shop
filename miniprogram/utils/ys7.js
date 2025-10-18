const md5 = require('../utils/md5')
const oken = ''
const APPKEY = '13941b2f10414719b0ec72f808e6aa12'
export const TIMEOUT = 6000
export const BASE_URL = 'https://open.ys7.com/api/lapp/'
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
export async function liveAddressGet({ app, deviceSerial, channelNo = 1, gbchannel,code, type = '1', startTime, stopTime,protocol = 1 }) {
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