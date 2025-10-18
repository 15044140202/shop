const GEOCODER = 'https://apis.map.qq.com/ws/geocoder/v1/';
/**
 * Performs reverse geocoding (coordinates to address) using Tencent Maps API
 * 使用腾讯地图API进行逆地理编码（坐标转地址）
 * 
 * @param {string} txMapKey - Tencent Maps API key 腾讯地图API密钥
 * @param {string} location - Coordinate in "latitude,longitude" format 经纬度坐标，格式为"纬度,经度"
 * @returns {Promise} Promise that resolves with geocoding result or rejects with error
 *                   返回Promise，成功时返回地理编码结果，失败时返回错误
 * 
 * @example
 * geocoder('YOUR_API_KEY', '31.230416,121.473701')
 *   .then(res => console.log(res.result.address))
 *   .catch(err => console.error(err))
 */
export function geocoder(txMapKey, location) {
	return new Promise((resolve, reject) => {
		wx.request({
			url: `${GEOCODER}?location=${location}&key=${txMapKey}&get_poi=1`,
			success: (res) => {
				resolve(res);
			},
			fail: (err) => {
				reject(err);
			}
		});
	});
}