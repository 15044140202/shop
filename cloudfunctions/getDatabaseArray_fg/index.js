// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境

// 云函数入口函数
exports.main = async (event) => {
  const {
    collection,
    shopFlag,
    ojbName,
    startSum,
    endSum
  } = event
  const db = cloud.database();
  const res = await db.collection(collection).where({
    shopFlag: shopFlag
  }).get()
  if ('data' in res) {
    if (res.data.length === 0) { //没有此数据  创建数据
      await db.collection(collection).add({
        data: {
          shopFlag: shopFlag,
          [ojbName]: []
        }
      })
      return [];
    }

    if (ojbName in res.data[0]) {
      const newArray = [];
      const array = res.data[0][ojbName]
      //提供的  start 最小值为1   
      const start = array.length >= startSum ? array.length - startSum : -1
      const end = array.length >= endSum ? array.length - endSum : 0
      if (endSum < 0) { //要全部数据
        return array;
      } else { //要部分数据
        if (start < 0) { //没有数据了!

        } else {
          for (let index = array.length - 1; index >= 0; index--) {
            const element = array[index];
            if (index <= start && index >= end) {
              newArray.push(element)
            }
          }
        }
        return newArray;
      }
    } else { //不包含索取对象   // 创建该对象  赋值[]
      await db.collection(collection).where({
        shopFlag: shopFlag
      }).update({
        data: {
          [ojbName]: []
        }
      })
      return [];
    }
  } else { //读取错误
    return 'error'
  }

}