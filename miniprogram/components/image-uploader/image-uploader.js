const zx = require('../../utils/zxUtils/zx')
const app = getApp()
const appData = app.globalData
Component({
  properties: {
    maxCount: {
      type: Number,
      value: 9
    },
    userOpenid:{
      type:String,
      value:''
    }
  },
  data: {
    files: []
  },
  methods: {
    async chooseImage() {
      const { maxCount, userOpenid } = this.data;
      const upDataRes = await zx.updataImage(userOpenid, 'firendCircleBgImage', appData.cloud, maxCount)
      if (!upDataRes) {
        app.showModal('错误', '保存图片失败!')
        return
      }
      if (Array.isArray(upDataRes)) {
        this.setData({ files: upDataRes });
        this.triggerEvent('change', { files: upDataRes });
      }else{
        this.setData({ files: [upDataRes] });
        this.triggerEvent('change', { files: [upDataRes] });
      }
    },

    deleteImage(e) {
      const { index } = e.currentTarget.dataset;
      const { files } = this.data;

      files.splice(index, 1);
      this.setData({ files });
      this.triggerEvent('change', { files });
    }
  }
});