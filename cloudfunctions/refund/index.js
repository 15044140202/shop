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
  pfx: '',
  notify_url: 'www.baidu.com',
  spbill_create_ip: '127.0.0.1'
};

// 云函数入口函数
exports.main = async (event) => {
  const {
    amount,
    refund_amount,
    out_trade_no,
    out_refund_no,
    sub_mchid,
    appid
  } = event;
  appid === undefined ? config.appid = 'wxad610929898d4371':config.appid = appid;
  //下载证书
  const r = await cloud.downloadFile({
    fileID: 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/icon/apiclient_cert.p12',
  })
  if (r.errMsg === "downloadFile:ok") {
    config.pfx = r.fileContent
  }else{
    return 'error';
  }
 //初始化tenpay
  const api = tenpay.init(config);

  let res = await api.refund({
    out_trade_no: out_trade_no,
    out_refund_no: out_refund_no,
    total_fee: amount,
    refund_fee: refund_amount,
    sub_mch_id:sub_mchid
  });
  return 'ok';
}