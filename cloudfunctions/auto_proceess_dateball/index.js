// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
function getAllMember(order) {
  let members = []
  //发起人
  members.push({
    memberStatus: 'launchPerson',
    memberObjName: 'launchPerson',
    memberOrderId: order._id
  })
  for (let key of Object.keys(order)) {
    if (key.includes('joinPerson')) {
      members.push({
        memberStatus: 'joinPerson',
        memberObjName: key,
        memberOrderId: order[key].personOrderId
      })
    }
  }
  return members
}
/**
 * @description //判断订单的指定成员 是否违约
 * @param {string} memberObjName //该成员对象名称
 * @param {object} order //订单
 * @returns {boolean} //违约返回 true 不违约返回false
 */
function judgeMemberIsBreach(memberObjName, order) {
  //1  所有成员都没到店 , 此种情况 都不违约
  const allMemberNoReachShop = !(Object.keys(order).some(item => (item.includes('launchPerson') || item.includes('joinPerson')) && order[item]?.reachShop))
  if (allMemberNoReachShop) {//都没到店
    return false
  }
  //2 所有成员都到店 判断到店时间
  const allMemberReachShop = !(Object.keys(order).some(item => (item.includes('launchPerson') || item.includes('joinPerson')) && !order[item]?.reachShop))
  if (allMemberReachShop) {//所有成员 都到店
    //都到店  还是wait  说明 到店的时间不在一个区间, 判断是否是在约定的时间到店的
    const dateTimeStamp = new Date(order.dateBallTime.replace(/-/g, "/")).getTime()
    const memberReachTimeStamp = order[memberObjName].reachShop
    //到店时间 早于或晚于 约定时间30分钟 算违约
    if (Math.abs(dateTimeStamp - memberReachTimeStamp) > 30 * 60 * 1000) {
      return true
    } else {
      return false
    }
  }
  //有人到店  且本人没到店 直接返回 违约
  if (!order[memberObjName]?.reachShop) {
    return true
  }
  //本人到店时间 是否是约定时间段内 不在约定时间段内 违约 
  const dateTimeStamp = new Date(order.dateBallTime.replace(/-/g, "/")).getTime()
  const myReachTimeStamp = order[memberObjName].reachShop
  if (Math.abs(myReachTimeStamp - dateTimeStamp) <= 30 * 60 * 1000) {//在约定时间 前后30分钟内到店
    return false  //不违约
  } else {
    return true //违约
  }

}
function signUserBreach(userOpenid) {
  return db.collection('user_info').where({
    _openid: userOpenid
  }).upDate({
    data: {
      dateBall_breach: _.inc(1)
    }
  })
}
/**
 * @description//分析订单 返回需要处理的任务
 * @param {Array} orderArr 需要处理的订单数组
 * @param {task} task 需要处理的任务
 */
function dateOrder_process(orderArr, task) {
  const nowTimeStamp = new Date().getTime()
  for (let item of orderArr) {
    if (task.length >= 96) {//当并发数据大于 96 时 退出
      return
    }
    const dateState = item.dateState
    const dateTimeStamp = new Date(item.dateBallTime.replace(/-/g, '/')).getTime()
    console.log({ '现在时间': nowTimeStamp, "约球时间": dateTimeStamp })
    //筛选 征召中  但是已过 约定时间 未成功 征召到的订单
    if (dateState === 'draft' && nowTimeStamp > dateTimeStamp) {//超时
      //标记所有成员 订单状态为取消
      const membersData = getAllMember(item)
      for (let member of membersData) {
        task.push(
          db.collection('online_dateball').doc(member.memberOrderId).update({
            data: {
              [`${member.memberStatus === 'joinPerson' ? 'orderState' : 'dateState'}`]: 'cancel'
            }
          })
        )
      }
    }
    //筛选 等待开局  但是已过 约定时间 标记所有人订单状态为取消, 分析出爽约人 标记其账单 爽约,个人记录爽约+1
    if (dateState === 'wait' && nowTimeStamp > dateTimeStamp) {
      //标记所有成员 订单状态为取消  违约状态
      const membersData = getAllMember(item)
      console.log(membersData)
      for (let member of membersData) {
        const isBreach = judgeMemberIsBreach(member.memberObjName, item)
        const upData = {
          [`${member.memberStatus === 'joinPerson' ? 'orderState' : 'dateState'}`]: 'cancel',
          breach: isBreach,
        }
        //标记用户违约
        if (isBreach) {
          task.push(signUserBreach(member.memberStatus === 'joinPerson' ? item[member.memberObjName].personOpenid : item.userOpenid))
        }
        task.push(
          db.collection('online_dateball').doc(member.memberOrderId).update({
            data: upData
          })
        )
      }
    }
    //筛选 打球中  此订单状态为 所有人以应约到店, 超过1小时标记所有订单状态为over
    if (dateState === 'playing' && nowTimeStamp > dateTimeStamp + 60 * 60 * 1000) {
      //标记所有成员 订单状态为取消
      const membersData = getAllMember(item)
      for (let member of membersData) {
        task.push(
          db.collection('online_dateball').doc(member.memberOrderId).update({
            data: {
              [`${member.memberStatus === 'joinPerson' ? 'orderState' : 'dateState'}`]: 'over'
            }
          })
        )
        //判断这个成员是否违约
      }
    }
  }
}

/**
 * @description //获取全部需要处理的订单
 */
async function getDateBallOrder() {
  //draft(征召中) 状态为 await(待开局) playing(对局中)
  const MAX_LIMIT = 100
  const countResult = await db.collection('online_dateball').where({
    dateState: _.in(["draft", "wait", "playing"])
  }).count()
  const total = countResult.total
  // 计算需分几次取
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // 承载所有读操作的 promise 的数组
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    const promise = db.collection('online_dateball').where({
      dateState: _.in(["draft", "wait", "playing"])
    }).skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  // 等待所有
  return ((await Promise.all(tasks)) || []).reduce((acc, cur) => {
    return acc.concat(cur.data)
  },[])
}
// 云函数入口函数 //
exports.main = async (event, context) => {
  //打印调用源信息
  // 设置时区为亚洲/上海
  process.env.TZ = 'Asia/Shanghai';
  if (cloud.getWXContext().SOURCE === 'wx_trigger') {
    console.log('触发器调用自动处理约球订单函数.')
  } else {
    throw 'error --- 非定时器调用 自动处约球订单函数,终止!'
  }
  //获取约球订单主订单(cidy!=="") draft(征召中) 状态为 await(待开局) playing(对局中)
  const dateBallOrder = await getDateBallOrder()
  console.log(dateBallOrder)
  if (dateBallOrder.length <= 0) {
    console.log('没有需要处理的数据!')
    return
  }
  //分析约球订单状态
  const task = []
  dateOrder_process(dateBallOrder, task)
  if (task.length > 0) {
    await Promise.all(task)
  }
  return {
    success: true,
    message: `处理订单数量:${dateBallOrder.length},处理用户状态:${task.length}条`
  }
}