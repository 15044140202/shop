function getNowTime(now_p) {
	var now = new Date();
	if (now_p) {
		now = now_p
	}
	const year = now.getFullYear().toString();
	const month = (now.getMonth() + 1).toString();
	const day = now.getDate().toString();
	const hour = now.getHours().toString();
	const minute = now.getMinutes().toString();
	const seconds = now.getSeconds().toString();
	return year + '/' + month.padStart(2, '0') + '/' + day.padStart(2, '0') + ' ' + hour.padStart(2, '0') + ':' + minute.padStart(2, '0') + ':' + seconds.padStart(2, '0')
}

// 云函数入口文件
const cloud = require('wx-server-sdk')
const tenpay = require('tenpay-node');
var config = {
	appid: 'wxad610929898d4371',
	mchid: '1676890001',
	partnerKey: '2992B65731B84779787C3548ECD26CBB',
	pfx: '',
	notify_url: 'www.baidu.com',
	spbill_create_ip: '127.0.0.1'
};

cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event) => {
	// 设置时区为亚洲/上海
	process.env.TZ = 'Asia/Shanghai';
	const nowTime = new Date().getTime();
	//先删除 已处理完的订单
	const deleteRes = await db.collection('payOrderList').doc('33c5161d66b7041006449e280f3bf1ca').update({
		data:{
			orderList:_.pull({
				payState:_.eq('payEnd')
			})
		}
	})
	const orderListRes = await db.collection('payOrderList').get()
	console.log(orderListRes.data)
	if (orderListRes.data.length > 0) {
		//下载证书
		const r = await cloud.downloadFile({
			fileID: 'cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/icon/apiclient_cert.p12',
		})
		if (r.errMsg === "downloadFile:ok") {
			config.pfx = r.fileContent
		} else {
			return 'error';
		}
		//初始化tenpay
		const api = tenpay.init(config);

		console.log('列表长度:' + orderListRes.data.length)
		const payList = orderListRes.data[0].orderList
		for (let index = 0; index < payList.length; index++) {
			const element = payList[index];
			//这个订单的下单时间
			const orderTime = new Date(element.orderTime).getTime();
			const tenMinute = 10 * 60 * 1000;
			if (nowTime - orderTime >= tenMinute) { //判断下单时间 是否超过 10分钟
				if (element.payState === 'paying') {
					//检测这个 订单是否支付完成
					let queryRes = await api.orderQuery({
						out_trade_no: element.payOrderNum,
						sub_mch_id: element.sub_mchid
					});
					if (queryRes.trade_state === 'NOTPAY') { //未支付
						console.log(`订单:${element.payOrderNum}超时未支付订单. 删除`)
						//没有支付的  废弃订单  修改支付状态为 payEnd
						await db.collection('payOrderList').where({
							orderList: {
								payOrderNum: element.payOrderNum
							}
						}).update({
							data: {
								[`orderList.$.payState`]: 'payEnd'
							}
						})
					} else {//已支付完成的 
						console.log(`订单:${element.payOrderNum}进行退款操作.`)
						//支付完成的订单  但是并没有 写入 下单操作  转入退款 修改支付状态为 payEnd
						let rePayRes = await api.refund({
							out_trade_no: element.payOrderNum,
							out_refund_no: 'RE' + element.payOrderNum,
							total_fee: element.amount * 100,
							refund_fee: element.amount * 100,
							sub_mch_id: element.sub_mchid
						});

						await db.collection('payOrderList').where({
							orderList: {
								payOrderNum: element.payOrderNum
							}
						}).update({
							data: {
								[`orderList.$.payState`]: 'payEnd'
							}
						})
					}
				} else { //不处理不是正在支付的订单


				}
			}
		}

		
	} else {
		console.log('没有找到支付列表数据!')
	}
}