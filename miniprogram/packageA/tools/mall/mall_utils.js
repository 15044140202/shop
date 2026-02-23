const app = getApp()
const appData = app.globalData;
const zx = require('../../../utils/zx')
export const sub_mchid = '1680705821' //时光私募
//商店运费模版
export async function getShoppingTemplate(mall_shopId){
  const res = await app.callFunction({
    name:'getData_where',
    data:{
      collection:'mall_shopping_template',
      query:{
        shopId:mall_shopId
      }
    }
  })
  console.log(res)
  if (!res.success) {
    app.showModal('提示','获取店铺运费模版失败!')
    return []
  }
  return res.data
}
// 获取商品总运费
export async function getExpressFee(order, shoppingTemplates = []) {
  // 没有运费模板或订单为空，返回运费0
  if (!shoppingTemplates.length || !order?.goodsList?.length) {
    return 0;
  }
  console.log(order.goodsList)
  // 按运费模板ID分组商品
  const templateGroups = order.goodsList.reduce((acc, item) => {
    const templateId = item?.shoppingTemplate?._id || '';
    acc[templateId] = acc[templateId] || [];
    acc[templateId].push(item);
    return acc;
  }, {});
  console.log(templateGroups)
  // 计算每个分组的总运费
  let totalFee = 0;
  
  for (const [templateId, goodsItems] of Object.entries(templateGroups)) {
    console.log(templateId, goodsItems)
    // 查找对应的运费模板
    const template = shoppingTemplates.find(t => t._id === templateId) || {};
    console.log({'模版是':template})
    // 如果没有找到模板，使用默认模板（如果有）
    const defaultTemplate = shoppingTemplates.find(t => t.isDefault) || {};
    const activeTemplate = template._id ? template : defaultTemplate;
    
    // 如果没有有效的运费模板，跳过此组
    if (!activeTemplate._id) continue;
    console.log(activeTemplate)
    // 根据模板类型计算运费
    switch (activeTemplate.type) {
      
      case 'fixed': // 固定运费
        totalFee += parseFloat(activeTemplate.fixedFee || 0);
        break;
        
      case 'weight': // 按重量计算
        const totalWeight = goodsItems.reduce((sum, item) => 
          sum + (parseFloat(item.weight || 0) * item.quantity), 0);
        
        if (totalWeight > 0) {
          const firstAmount = parseFloat(activeTemplate.firstAmount || 0);
          const firstFee = parseFloat(activeTemplate.firstFee || 0);
          const additionalAmount = parseFloat(activeTemplate.additionalAmount || 0);
          const additionalFee = parseFloat(activeTemplate.additionalFee || 0);
          
          if (totalWeight <= firstAmount) {
            totalFee += firstFee;
          } else {
            const excessWeight = totalWeight - firstAmount;
            const additionalUnits = Math.ceil(excessWeight / additionalAmount);
            totalFee += firstFee + (additionalUnits * additionalFee);
          }
        } else {
          // 没有重量信息，使用固定运费
          totalFee += parseFloat(activeTemplate.fixedFee || 0);
        }
        break;
        
      case 'volume': // 按体积计算
        const totalVolume = goodsItems.reduce((sum, item) => 
          sum + (parseFloat(item.volume || 0) * item.quantity), 0);
        
        if (totalVolume > 0) {
          const firstAmount = parseFloat(activeTemplate.firstAmount || 0);
          const firstFee = parseFloat(activeTemplate.firstFee || 0);
          const additionalAmount = parseFloat(activeTemplate.additionalAmount || 0);
          const additionalFee = parseFloat(activeTemplate.additionalFee || 0);
          
          if (totalVolume <= firstAmount) {
            totalFee += firstFee;
          } else {
            const excessVolume = totalVolume - firstAmount;
            const additionalUnits = Math.ceil(excessVolume / additionalAmount);
            totalFee += firstFee + (additionalUnits * additionalFee);
          }
        } else {
          // 没有体积信息，使用固定运费
          totalFee += parseFloat(activeTemplate.fixedFee || 0);
        }
        break;
        
      default: // 未知类型或无有效规则，使用固定运费
        totalFee += parseFloat(activeTemplate.fixedFee || 0);
    }
  }
  console.log(totalFee)
  return totalFee;
}
//查询快递
export async function queryExpress(expressNum) {
  wx.navigateTo({
    url: `plugin://kdPlugin/index?num=${expressNum}&appName=智享自助桌球`,
  })
}
/**
 * @description 获取订单的全部快递
 * @param {object} order 
 */
export async function getOrderExpress(order) {
  const res = await app.callFunction({
    name: 'getData_where',
    data: {
      collection: 'user_mall_order_express',
      query: {
        orderId: order._id
      }
    }
  })
  if (!res.success) {
    app.showModal('获取快递信息失败!')
    throw 'ERROR --- 获取快递信息失败!'
  }
  return res.data
}

/**
 * @description 获取账单总价  包含运费
 * @param {object} order 
 */
export function getOrderTotalFee(order) {
  let totalAmount = 0
  //商品总价
  totalAmount = order.goodsList.reduce((acc, item) => {
    acc += item.goodsPrice * item.goodsQuantity
    return acc
  }, 0)
  //运费价格
  return totalAmount + (order?.expressFee || 0)
}
/**
 * @description 获取指定订单号的订单
 * @param {object} callFunction 函数对象
 * @param {string} orderNum 订单编号
 */
export async function getOneOrder(callFunction, _id) {
  return await callFunction({
    name: 'getData_doc',
    data: {
      collection: 'user_mall_order',
      _id: _id
    }
  })
}
//取消当前地址数组中的默认 地址标识
export async function cancelDefaultAdd(shoppingAdd) {
  const index = shoppingAdd.findIndex(item => item.defaultAdd)
  if (index !== -1) {
    const res = await app.callFunction({
      name: 'upDate',
      data: {
        collection: 'shopping_add',
        query: {
          _id: shoppingAdd[index]._id
        },
        upData: { defaultAdd: false }
      }
    })
    if (!res.success) {
      app.showModal('提示', '上传默认地址信息错误!')
      return false
    }
    shoppingAdd[index].defaultAdd = false
    return true
  }
  console.log('没有需要更改的默认地址!')
  return false
}
export async function getShoppingAdd(myOpenid) {
  const res = await app.callFunction({
    name: 'getData_where',
    data: {
      collection: 'shopping_add',
      query: {
        userOpenid: myOpenid
      }
    }
  })
  if (!res.success) {
    app.showModal('提示', '获取收货地址错误')
    return []
  }
  //获取默认地址 index 
  let index = res.data.findIndex(item => item.defaultAdd)
  if (index === -1) {
    index = 0
  }
  return {
    shoppingAdd: res.data,
    shoppingAddSelected: index
  }
}