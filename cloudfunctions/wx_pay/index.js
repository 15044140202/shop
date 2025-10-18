// 云函数入口文件
const cloud = require('wx-server-sdk')
const tenpay = require('./tenpay')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
async function downloadPfx(){
  const r = await cloud.downloadFile({
    fileID: 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/icon/apiclient_cert.p12',
  })
  if (r.errMsg === "downloadFile:ok") {
    return r.fileContent
  }else{
    return ''
  }
} 
var config = {
  appid: 'wxad610929898d4371',
  mchid: '1676890001',
  partnerKey: '2992B65731B84779787C3548ECD26CBB',
  pfx: '',
  notify_url: 'https://www.zhixiangyunchuang.cn/api/wx_pay/payres',
  spbill_create_ip: '127.0.0.1'
};
//***getPayParams: 获取微信JSSDK支付参数(自动下单, 兼容小程序)
// let result = await api.getPayParams({
//   out_trade_no: '商户内部订单号',
//   body: '商品简单描述',   
//   total_fee: '订单金额(分)',
//   openid: '付款用户的openid'
// });
//****orderQuery: 查询订单 */
// let result = await api.orderQuery({
//   // transaction_id, out_trade_no 二选一
//   // transaction_id: '微信的订单号',
//   out_trade_no: '商户内部订单号'
// });

// 云函数入口函数
exports.main = async (event) => {
  const {
    item,
    parameter
  } = event;
  parameter.appid === undefined ? config.appid = 'wxad610929898d4371' : config.appid = parameter.appid;
  delete parameter.appid
 //需要下载证书的项目 下载证书
  if (item === 'refund') {
    config.pfx = await downloadPfx()
    config.notify_url = 'https://express-6jsf-127742-8-1326882458.sh.run.tcloudbase.com/api/wx_pay/refund'
  }
  const api = await tenpay.init(config);
  //支付 
  try {
    let result = await api[item](parameter);
    return {
      success:true,
      data:result
    }
  } catch (e) {
    return {
      success: false,
      data: e.data,
      Error:e.Error
    };
  }
}