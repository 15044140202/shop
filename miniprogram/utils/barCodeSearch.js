/**
 * 不依赖querystring，使用手动参数序列化
 */
var CryptoJS = require("../miniprogram_npm/crypto-js/index");

// 云市场分配的密钥Id
var secretId = "aBH0SXSBX2Qn7W8H";
// 云市场分配的密钥Key
var secretKey = "zOGKceT9vpPUpKUTRqkmLp8gU9KJffj5";

// 手动序列化表单参数（替代querystring.stringify）
function serializeParams(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}

// 生成请求参数的函数
function getRequestOptions(code) {
  // 签名相关
  var datetime = (new Date()).toGMTString();
  var uuId = randomUUID();
  var signStr = "x-date: " + datetime;
  var sign = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA1(signStr, secretKey))
  var auth = '{"id": "' + secretId + '", "x-date": "' + datetime + '", "signature": "' + sign + '"}';

  // 请求方法
  var method = "POST";
  
  // 请求头
  var headers = {
    "request-id": uuId,
    "Authorization": auth,
    "Content-Type": "application/x-www-form-urlencoded"
  }

  // body参数（POST方法下）
  var bodyParams = {
    "code": code
  }
  var bodyParamStr = serializeParams(bodyParams); // 使用手动序列化

  // url参数拼接
  var url = "https://ap-guangzhou.cloudmarket-apigw.com/service-7lfgxxf2/bar-code/query";

  return {
    url: url,
    method: method,
    header: headers,
    data: bodyParamStr,
    timeout: 5000
  }
}

// 对外暴露的查询函数，返回Promise
export function queryByBarCode(code) {
  return new Promise((resolve, reject) => {
    const options = getRequestOptions(code);
    
    wx.request({
      ...options,
      success: (response) => {
        if (response.statusCode === 200) {
          resolve(response.data);
        } else {
          reject(new Error(`请求失败，状态码: ${response.statusCode}`));
        }
      },
      fail: (error) => {
        console.log('请求错误:', error);
        reject(error);
      }
    });
  });
}

// UUID生成函数
function randomUUID() {
  const hexDigits = '0123456789abcdef';
  let uuid = '';

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += hexDigits[(Math.floor(Math.random() * 4) + 8)];
    } else {
      uuid += hexDigits[Math.floor(Math.random() * 16)];
    }
  }
  return uuid;
}
