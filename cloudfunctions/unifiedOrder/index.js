// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const tenpay = require('tenpay-node');
var config = {
  appid: 'wxad610929898d4371',
  mchid: '1676890001',
  partnerKey: '2992B65731B84779787C3548ECD26CBB',
  //pfx: require('fs').readFileSync('证书文件路径'),
  notify_url: 'https://express-6jsf-127742-8-1326882458.sh.run.tcloudbase.com/api/payres',
  spbill_create_ip: '127.0.0.1'
};

// 云函数入口函数
exports.main = async (event) => {
  const {
    amount,
    description,
    sub_mchid,
    out_trade_no,
    appid
  } = event;
  appid === undefined ? config.appid = 'wxad610929898d4371' : config.appid = appid;
  const wxContext = cloud.getWXContext()

  const api = tenpay.init(config);

  //统一下单函数
  try {
    const res = await api.getPayParams({
      out_trade_no: out_trade_no,
      body: description,
      total_fee: amount,
      openid: wxContext.OPENID === '' ? wxContext.FROM_OPENID : wxContext.OPENID,
      sub_mch_id: sub_mchid,
    })
    return res;
  } catch (e) {
    return {
      success:false,
      message:'支付失败',
      data:e
    }
  }

}