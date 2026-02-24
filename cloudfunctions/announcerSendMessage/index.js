// 云函数入口文件
const cloud = require('wx-server-sdk')
const request = require('request')
const uuid = require('uuid')
const crypto = require('crypto')

cloud.init()

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '').substr(0, 14)
}

function _buildParams() {
  return {
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: uuid(),
    SignatureVersion: '1.0',
    Timestamp: timestamp(),
    AccessKeyId: "", // 请填写您的AccessKeyId
    Version: '2020-04-20',
    RegionId: "cn-shenzhen"
  };
}
//首字母大写
const firstLetterUpper = str => {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}
//格式化参数
const formatParams = params => {
  var keys = Object.keys(params)
  var newParams = {}
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    newParams[firstLetterUpper(key)] = params[key]
  }
  return newParams;
}
//将数组参数格式化成url传参方式
const replaceRepeatList = (target, key, repeat) => {
  for (var i = 0; i < repeat.length; i++) {
    var item = repeat[i];

    if (item && typeof item === 'object') {
      const keys = Object.keys(item);
      for (var j = 0; j < keys.length; j++) {
        target[`${key}.${i + 1}.${keys[j]}`] = item[keys[j]];
      }
    } else {
      target[`${key}.${i + 1}`] = item;
    }
  }
}
//将所有重复参数展开平面化
const flatParams = (params) => {
  var target = {};
  var keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = params[key];
    if (Array.isArray(value)) {
      replaceRepeatList(target, key, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}
//url编码
const encode = (str) => {
  var result = encodeURIComponent(str);

  return result.replace(/\!/g, '%21')
    .replace(/\'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}
//将所有参数以特定格式放进数组中
const normalize = (params) => {
  var list = [];
  var flated = flatParams(params);
  var keys = Object.keys(flated).sort();
  for (let i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = flated[key];
    list.push([encode(key), encode(value)]);
  }
  return list;
}
//按传参名首字母顺序将所有参数以特定格式放进数组中
const canonicalize = (normalized) => {
  var fields = [];
  for (var i = 0; i < normalized.length; i++) {
    var [key, value] = normalized[i];
    fields.push(key + '=' + value);
  }
  return fields.join('&');
}

function request_(params, opts) {
  params = formatParams(params)
  params.Action = firstLetterUpper(params.Action) //
  var defaultParams = _buildParams()
  params = Object.assign(defaultParams, params)

  var method = (opts.method || 'GET').toUpperCase()
  var normalized = normalize(params)
  var canonicalized = canonicalize(normalized)

  var stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`

  const key = "" + '&' // 请填写您的AccessKey Secret

  var signature = crypto.HMAC(crypto.SHA1, stringToSign, key, {
    asBase64: true
  })

  normalized.push(['Signature', encode(signature)])

  const url = method === 'POST' ? `https://iot.cn-shenzhen.aliyuncs.com/` : `https://iot.cn-shenzhen.aliyuncs.com/?${canonicalize(normalized)}`
  if (method === 'POST') {
    opts.headers = opts.headers || {};
    opts.headers['content-type'] = 'application/x-www-form-urlencoded'
    opts.data = canonicalize(normalized)
  }
  return new Promise((resolve, reject) => {
    request({
      url: url,
      method: method,
      headers: opts.headers,
      form: opts.data
    }, (err, response, body) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(body))
      }
    })
  })
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}
