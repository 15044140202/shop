// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command




// 云函数入口函数
exports.main = async (event, context) => {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    let { collection, query, dataToInsert } = event
    if ('openid' in query && !query.openid) {
        query.openid = openid
    }

    try {
        // 查询数据
        const result = await db.collection(collection).where(query).get()
        if (result.data.length > 0) {
            // 数据存在，返回数据
            return {
                success: true,
                message: 'Data found',
                data: result.data
            }
        } else {
            // 数据不存在，插入新数据
            const insertResult = await db.collection(collection).add({
                data: dataToInsert
            })
            return {
                success: true,
                message: 'Data inserted',
                data:dataToInsert
            }
        }
    } catch (err) {
        return {
            success: false,
            message: 'Error occurred',
            error: err
        }
    }

}