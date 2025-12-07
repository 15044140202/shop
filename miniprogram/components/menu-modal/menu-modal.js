Component({
  properties: {
    // 是否显示弹窗
    show: {
      type: Boolean,
      value: false
    },
    // 弹窗标题
    title: {
      type: String,
      value: '功能选择'
    },
    // 菜单项列表
    menuItems: {
      type: Array,
      value: []
    },
    // 主题颜色
    themeColor: {
      type: String,
      value: '#0094ff'
    }
  },

  data: {
    // 组件内部数据
  },

  methods: {
    // 点击菜单项
    onMenuItemTap(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('menuSelect', { index });
    },

    // 点击取消按钮
    onCancelTap() {
      this.triggerEvent('menuSelect', { index: -1 });
    },

    // 阻止事件冒泡
    preventDefault() {
      // 空函数，用于阻止事件冒泡
    }
  }
})