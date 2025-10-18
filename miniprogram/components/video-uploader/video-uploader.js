const zx = require('../../utils/zxUtils/zx')
const app = getApp()
const appData = app.globalData
Component({
  properties: {
    userOpenid: {
      type: String,
      value: ''
    }
  },
  data: {
    video: null
  },
  methods: {
    chooseVideo() {
      const that = this
      const { userOpenid } = this.data;
      zx.updataVideo(userOpenid, 'firendCircleBgVideo', appData.cloud).then(res => {
        if (!res) {
          app.showModal('错误', '保存图片失败!')
          return
        }
        that.setData({ video: res });
        that.triggerEvent('change', { file: res });
      })

    },

    deleteVideo() {
      this.setData({ video: null });
      this.triggerEvent('change', { file: null });
    }
  }
});