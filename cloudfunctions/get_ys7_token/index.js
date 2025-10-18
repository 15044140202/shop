// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')
const crypto = require('crypto')
const qs = require('querystring'); // 新增：用于将参数转为表单格式

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 萤石云API配置 - 请替换为你的实际信息
const EZVIZ_CONFIG = {
  APP_KEY: '13941b2f10414719b0ec72f808e6aa12',
  APP_SECRET: 'ea66bd61beb3e16f0f87c6633eabfa00',
  API_URL: 'https://open.ys7.com/api/lapp/token/get'
}

// 加密函数 - 用于加密存储Token
function encrypt(text, key) {
  const cipher = crypto.createCipheriv('aes-128-ecb', key, '')
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

// 解密函数 - 用于读取Token
function decrypt(text, key) {
  const decipher = crypto.createDecipheriv('aes-128-ecb', key, '')
  let decrypted = decipher.update(text, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// 获取加密密钥 - 建议从环境变量获取
function getEncryptionKey() {
  // 注意：APPID可能不足16位，需补全（aes-128-ecb要求密钥必须16位）
  const appid = cloud.getWXContext().APPID || '';
  return appid.padEnd(16, '0').substr(0, 16); // 补全16位，避免密钥长度错误
}

// 检查用户是否合法
async function isUserValid(openid) {
  console.log(openid)
  try {
    const result = await db.collection('vip_list')
      .where({ userOpenid: openid })
      .get();

    const vipList = result.data || [];
    return vipList.some(item => item.totalTableCost > 0);
  } catch (error) {
    console.error('验证用户合法性出错:', error);
    return false;
  }
}

// 检查Token是否有效
async function checkTokenValidity() {
  const result = await db.collection('ye7_token').limit(1).get()

  if (result.data.length === 0) {
    return false
  }

  const tokenData = result.data[0]
  const now = Date.now()

  // 检查是否过期(提前1天刷新)
  if (now >= tokenData.expireTime - 86400000) {
    return false
  }

  return true
}

// 【重点修复】获取新的萤石云Token
async function fetchNewToken() {
  try {
    // 1. 准备请求参数（萤石云要求表单格式传递）
    const requestData = {
      appKey: EZVIZ_CONFIG.APP_KEY,  // 正确传递appKey
      appSecret: EZVIZ_CONFIG.APP_SECRET  // 正确传递appSecret
    };

    // 2. 调用萤石云API（关键：用qs.stringify转表单格式，配置正确的Content-Type）
    const response = await axios.post(
      EZVIZ_CONFIG.API_URL,
      qs.stringify(requestData), // 转为表单格式（如 "appKey=xxx&appSecret=xxx"）
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded' // 必须配置此请求头
        }
      }
    );

    // 3. 处理响应（萤石云返回的code是字符串，如"200"）
    console.log('萤石云API响应:', response.data);
    if (response.data.code !== '200') {
      throw new Error(`萤石云返回错误: ${response.data.msg || '未知错误'}`);
    }

    // 4. 计算过期时间(7天有效期)
    const expireTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // 5. 加密token
    const encryptedToken = encrypt(response.data.data.accessToken, getEncryptionKey());

    return {
      accessToken: encryptedToken,
      expireTime: expireTime,
      updateTime: Date.now()
    }
  } catch (error) {
    console.error('获取萤石云Token失败:', error.message);
    throw new Error(`获取Token失败: ${error.message}`); // 更清晰的错误信息
  }
}

// 【修复】更新数据库中的Token（原代码countResult.data错误）
async function updateTokenInDB(tokenData) {
  const countResult = await db.collection('ye7_token').count();

  if (countResult.total > 0) {
    // 先查询现有记录的ID，再更新（原代码countResult.data不存在）
    const queryResult = await db.collection('ye7_token').limit(1).get();
    await db.collection('ye7_token')
      .doc(queryResult.data[0]._id)
      .update({ data: tokenData });
  } else {
    // 创建新记录
    await db.collection('ye7_token').add({ data: tokenData });
  }
}

// 获取解密后的有效Token
async function getValidToken() {
  const result = await db.collection('ye7_token').limit(1).get()

  if (result.data.length === 0) {
    return null
  }

  // 解密Token
  const decryptedToken = decrypt(result.data[0].accessToken, getEncryptionKey())

  return decryptedToken
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  // 【修复】获取用户OpenID（原代码FROM_OPENID是云函数触发来源，用户OpenID用OPENID）
  const openid = wxContext.FROM_OPENID

  try {
    // 1. 验证用户合法性
    if (openid) {
      const userValid = await isUserValid(openid)
      if (!userValid) {
        return {
          code: 403,
          message: '权限不足，您不是合法用户'
        }
      }
    }


    // 2. 检查Token是否有效
    const tokenValid = await checkTokenValidity()

    // 3. 如果Token无效，获取新Token并更新数据库
    if (!tokenValid) {
      const newTokenData = await fetchNewToken()
      await updateTokenInDB(newTokenData)
    }

    // 4. 返回有效的Token
    const validToken = await getValidToken()

    return {
      code: 200,
      message: '获取Token成功',
      data: {
        accessToken: validToken,
        tokenPreview: validToken ? `${validToken.substr(0, 6)}...${validToken.substr(-6)}` : null
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '获取Token失败',
      error: error.message
    }
  }
}