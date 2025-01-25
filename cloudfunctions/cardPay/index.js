// 云函数入口文件
const cloud = require('wx-server-sdk')
const tenpay = require('./tenpay')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
var config = {
  appid: 'wxad610929898d4371',
  mchid: '1676890001',
  partnerKey: '2992B65731B84779787C3548ECD26CBB',
  //pfx: require('fs').readFileSync('证书文件路径'),
  notify_url: 'https://express-6jsf-127742-8-1326882458.sh.run.tcloudbase.com',
  spbill_create_ip: '127.0.0.1'
};

// 云函数入口函数
exports.main = async (event) => {
  const {
    amount,
    description,
    sub_mchid,
    out_trade_no,
    auth_code,
    appid
  } = event;
  appid === undefined ? config.appid = 'wxad610929898d4371' : config.appid = appid;
  const api = await tenpay.init(config);
  //刷卡支付
  try {
    let result = await api.micropay({
      out_trade_no: out_trade_no,
      body: description,
      total_fee: amount,
      sub_mch_id: sub_mchid,
      auth_code: auth_code
    });
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