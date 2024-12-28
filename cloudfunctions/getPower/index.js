// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database();
// 云函数入口函数
exports.main = async (event) => {
  const {
    shopFlag
  } = event;
  const defult =  {
    statement: [{
        '查看营业额': true
      },
      {
        '按收款方式查询': false
      },
      {
        '按收入项目查询': false
      },
      {
        '已结账单据': false
      },
      {
        '未结账单据': false
      },
      {
        '新办会员列表': false
      },
      {
        '会员储值列表': false
      },
      {
        '商品销售报表': false
      },
      {
        '商品清点记录': false
      },
      {
        '补货记录': false
      },
      {
        '员工配送统计': false
      },
      {
        '收取员工现金记录': false
      },
      {
        '员工打卡记录': false
      },
      {
        '收员工营业现金': false
      },
      {
        '库存不足列表': false
      },
      {
        '今日过生日会员': false
      },
      {
        '赠送优惠券': false
      },
      {
        '微信收支明细': false
      },
      {
        '微信退款明细': false
      }
    ],
    operate: [{
        '外卖': true
      },
      {
        '开台': true
      },
      {
        '结账': true
      },
      {
        '换台': true
      },
      {
        '并台': true
      },
      {
        '商品销售及配送': true
      },
      {
        '现金结算': false
      },
      {
        '商品并入太费结算': false
      },
      {
        '清点商品': false
      },
      {
        '一键补货': false
      },
      {
        '退货': false
      },
      {
        '赠送优惠券': false
      },
      {
        '盘点时不允许修改库存': false
      },
      {
        '跨天退货': false
      },
      {
        '撤销美团券核销': false
      }
    ],
    set: [{
        '店铺设置': false
      },
      {
        '员工及权限': false
      },
      {
        '计费规则及桌台档案': false,
      },
      {
        '会员优惠设置': false
      },
      {
        '会员档案设置': false
      },
      {
        '积分规则设置': false
      },
      {
        '商品档案设置': false
      },
      {
        '商品采购入库': false
      },
      {
        '短信设置及群发': false
      },
      {
        '建议和评价': false
      },
      {
        '优惠券管理': false
      },
      {
        '套餐设置': true
      },
      {
        '预定管理': false
      },
      {
        '连锁管理': false
      },
      {
        '公告管理': false
      },
      {
        '修改会员生日': false
      },
      {
        '预定列表': false
      },
      {
        '取消预定': false
      },
      {
        '开门记录': false
      },
      {
        '退开门押金': false
      },
      {
        '修改会员敏感信息': false
      },
      {
        '美团接入管理': false
      },
      {
        '抖音接入管理': false
      }
    ],
    systemSet: [{
        '微信收款账号设置': false
      },
      {
        '灯控器设置': false
      },
      {
        '打印机设置': false
      },
      {
        '营业参数设置': false
      },
      {
        '桌台管理': false
      },
      {
        '绑定桌台码': false
      },
      {
        '门禁设置': false
      },
      {
        '退款/部分退款': false
      }
    ]
  }
  var power = [];
  while (power.length === 0) {
    //首先查询本店 合集信息 是否存在
    const res = await db.collection('power').where({
      shopFlag: shopFlag
    }).get()
    console.log(res)
    if (res.data.length === 0) { //判断是否 数据库中没有此店铺的 公告数据模版  没有则添加
      await db.collection('power').add({
        data: {
          shopFlag:shopFlag,
          waiter: defult,
          cashier: defult,
          manager: defult,
          finance: defult,
        }
      })
    } else {
        return res.data[0];
    }
  }
}