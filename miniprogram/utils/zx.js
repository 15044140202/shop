
export const PIE_COLOR_ARR = [
  '#1F77B4', // 经典商务蓝 - 主色调
  '#FF7F0E', // 活力橙色 - 对比色
  '#2CA02C', // 沉稳绿色 - 增长色
  '#D62728', // 警示红色 - 重点色
  '#9467BD', // 优雅紫色 - 辅助色
  '#8C564B', // 咖啡棕色 - 稳重色
  '#E377C2', // 柔和粉色 - 特殊色
  '#7F7F7F', // 中性灰色 - 平衡色
  '#BCBD22', // 橄榄绿色 - 独特色
  '#17BECF'  // 青蓝色 - 清新色
]
/**
 * @description 打开指定位置地图
 * @param {number} latitude 
 * @param {number} longitude 
 */
export function openLocation(latitude, longitude) {
  // 调用地图导航
  wx.openLocation({
    latitude: latitude, // 目标纬度
    longitude: longitude, // 目标经度
    scale: 18, // 地图缩放级别，默认18
    success: () => {
      console.log('成功调起地图');
    },
    fail: (err) => {
      console.error('调起地图失败', err);
    }
  });
}
/**
 * @description 关闭支付订单
 * @param {object} callFunction 
 * @param {string} sub_mchid //子商户号
 * @param {string} orderNum //订单编号
 */
export async function closePayOrder(callFunction, sub_mchid, orderNum) {
  return await callFunction({
    name: 'wx_pay',
    data: {
      item: 'closeOrder',
      parameter: {
        out_trade_no: orderNum,
        sub_mch_id: sub_mchid
      }
    }
  })
}
/**
 * @description 退款申请
 * @param {number} amount 
 * @param {number} refund_amount 
 * @param {string} out_trade_no 
 * @param {string} out_refund_no 
 * @param {string} sub_mchid 
 * @returns {object}
 */
export async function refund(callFunction, amount, refund_amount, out_trade_no, out_refund_no, sub_mchid,appid) {
  console.log('退款:' + refund_amount)
  const tamount = amount * 100
  const ramount = refund_amount * 100
  const res = await callFunction({
    name: 'wx_pay',
    data: {
      item: 'refund',
      parameter: {
        appid:appid,
        out_trade_no: out_trade_no,
        out_refund_no: out_refund_no,
        total_fee: tamount.toString(),
        refund_fee: ramount.toString(),
        sub_mch_id: sub_mchid
      }
    }
  })
  console.log(res)
  return res;
}
/**
 * @description 查询支付订单的 状态  已支付,未支付,部分退款,全部退款
 * @param {object} //云函数调用对象
 * @param {string} orderNum 订单编号
 * @param {string}sub_mch_id 子商户号
 * @returns {object} /* .trade_state 　必填 string(32) SUCCESS：支付成功 REFUND：转入退款 NOTPAY：未支付 CLOSED：已关闭 REVOKED：已撤销（仅付款码支付会返回）USERPAYING：用户支付中（仅付款码支付会返回）PAYERROR：支付失败（仅付款码支付会返回）*/
export async function inquirePayState(callFunction, orderNum, sub_mch_id) {
  const res = await callFunction({
    name: 'wx_pay',
    data: {
      item: 'orderQuery',
      parameter: {
        out_trade_no: orderNum,
        sub_mch_id: sub_mch_id
      }
    }
  })
  console.log(res)
  return res
}
/**
 * @description 查询退款订单的 状态  已退款,未退款
 * @param {object} //云函数调用对象
 * @param {string} refundOrderNum 退款订单编号
 * @param {string}sub_mch_id 子商户号
 * @returns {object} //.result_code 　SUCCESS/FAIL SUCCESS退款申请接收成功，退款结果以退款状态为准 FAIL
 * */
export async function refundquery(callFunction, refundOrderNum, sub_mch_id,appid) {
  const res = await callFunction({
    name: 'wx_pay',
    data: {
      item: 'refundQuery',
      parameter: {
        appid:appid,
        out_refund_no: refundOrderNum,
        sub_mch_id: sub_mch_id
      }
    }
  })
  console.log(res)
  return res
}
export async function deleteFile(fileIDArr){
  return wx.cloud.deleteFile({
    fileList: fileIDArr
  })
}
/**
 * @description //上传图片至云存储
 * @param {string} openid 
 * @param {string} name 
 * @returns {string} fileID
 */
export async function updataImage(openid, name) {
  const r = await wx.chooseMedia({
    count: 9,
    mediaType: ['image'],
    sourceType: ['album'],
  })
  console.log(r)
  const path = r.tempFiles//[0].tempFilePath
  const task = []
  for (let index = 0; index < path.length; index++) {
    const element = path[index];
    task.push(
      wx.cloud.uploadFile({
        cloudPath: `image/${openid}${name}${getRandomString(5)}.png`, // 上传至云端的路径
        filePath: element.tempFilePath, // 小程序临时文件路径
      })
    )
  }
  const res = await Promise.all(task)
  console.log(res)
  if(res.length === 1){//只有一个 返回值不返回数组
    return res[0].fileID
  }
  const fileIDArr = res.reduce((acc,item)=>{
    if(item.fileID !== 'undefine'){
      acc.push(item.fileID)
    }
    return acc
  },[])

  if (fileIDArr.length > 0) {
    return fileIDArr
  } else {
    wx.showToast({
      title: '错误!',
      icon: 'error'
    })
  }
}
/**
 * @description 把字符串 每间隔4位插入一个 - 
 * @param {string} str 
 * @returns {string} 处理过得str
 */
export const formatByLoop = (str) => {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += str[i];
    if ((i + 1) % 4 === 0 && i !== str.length - 1) {
      result += '-';
    }
  }
  return result;
};
/**
 * @description 支持全角/半角数字及复杂场景 的 文本数字提取（包括小数）
 * 示例  
 * console.log(extractNumbers("  258非5D6522"));// "25856522"  
 * console.log(extractNumbers("①2𝟑4.56"));// "1234.56"（支持全角数字、小数点和数学符号）
 * console.log(extractNumbers("价格：¥12.34元"));// "12.34"
 * @param {string} str 
 * @returns {string}
 */
export const extractNumbers_d = (str) => {
  let result = str.replace(/[^\uFF10-\uFF190-9.\uFF0E]/g, '')
    .replace(/[\uFF10-\uFF19]/g, (match) => {
      String.fromCharCode(match.charCodeAt(0) - 0xfee0)
    })
    .replace(/\uFF0E/g, '.')
  // 可选：处理多个小数点的情况，只保留第一个
  const decimalParts = result.split('.');
  if (decimalParts.length > 1) {
    result = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }
  return result;
};
/**
 * @description 支持全角/半角数字及复杂场景 的 文本数字提取(无法识别小数点)
 * 示例  
 * console.log(extractNumbers("  258非5D6522"));// "25856522"  
 * console.log(extractNumbers("①2𝟑4"));// "1234"（支持全角数字和数学符号）    
 * @param {string} str 
 * @returns {string}
 */
export const extractNumbers = (str) => {
  return str.replace(/[\uFF10-\uFF19] |[^0-9]/g, '');
};
/**
 * @description //获取现在时间
 * @param {date} p_date  //时间对象  当
 * @param {boolean} unsigned //传值=ture 时 返回无符号的纯数字时间字符串
 * @returns {string} //时间字符串
 */
export function getNowTime(p_date, unsigned) {
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
  // 组合成只包含数字的字符串
  var formattedDateTime = '';
  if (unsigned === false) { //返回有符号的时间数据
    formattedDateTime = `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
  } else { //返回无符号的 时间数据
    formattedDateTime = `${year}${month}${date}${hours}${minutes}${seconds}`;
  }
  console.log(formattedDateTime)
  return formattedDateTime
}
/**
 * @description 获取一个指定长度的随机字符串
 * @param {number} length 
 * @returns {string} 字符串
 */
export function getRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
/**
 * @description 获取一个 orderHead + 现时间串 + 5位随机字母的订单号
 * @param {date} now //时间对象
 * @param {string} orderHead  //订单头
 * @returns 字符串型订单
 */
export function createOrderNum(now, orderHead) {
  return orderHead + getNowTime(now, true) + getRandomString(5)
}
/**
 * @description 此函数 功能是将提供的时间字符串  转换成整数 
 * @param {string} time
 * @returns {number}  
 */
export function timeToNum(time) {
  const timeStr = time.replace(/:/g, '');
  return parseInt(timeStr)
}
/**
 * @description 此函数 判断提供的时间是处于提供的时间段数组 哪个成员的时间范围内 
 * @param {Array} timeSegmentArray //对象型时间段数组 格式 [{startTime:'00:00',endTime:'12:00'}]
 * @param {string} time //时间格式  00:00
 * @returns {number} //时间段数组的下标 不处于任何时间段内  返回-1
 */
export function timeOfSegment(timeSegmentArray, time) {
  const timeNum = parseInt(time.replace(/:/g, ''))
  for (let index = 0; index < timeSegmentArray.length; index++) {
    const element = timeSegmentArray[index];
    const startTNum = parseInt(element.startTime.replace(/:/g, ''))
    const endTNum = parseInt(element.endTime.replace(/:/g, ''))
    if (startTNum === endTNum) { //全天
      return index;
    } else if (startTNum < endTNum) { //开始时间小于结束时间
      if (timeNum >= startTNum && timeNum < endTNum) {
        return index;
      }
    } else if (startTNum > endTNum) { //开始时间 大于结束时间
      if (timeNum >= startTNum || timeNum < endTNum) {
        return index;
      }
    }
  }
  return -1; //不处于任何时间段
}