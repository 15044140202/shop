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
  notify_url: 'www.baidu.com',
  spbill_create_ip: '127.0.0.1'
};

// 云函数入口函数
exports.main = async (event) => {
  const {
    out_trade_no,
    sub_mch_id,
    appid,
  } = event;
  appid === undefined ? config.appid = 'wxad610929898d4371':config.appid = appid;
  
  const api = tenpay.init(config);
  //查询订单
  let result = await api.orderQuery({
    sub_mch_id:sub_mch_id,
    out_trade_no:out_trade_no//商户内部订单号
  });
  return result;
}