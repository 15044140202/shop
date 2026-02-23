Component({
  properties: {
    // 弹窗标题
    title: {
      type: String,
      value: '二维码'
    },
    // 描述信息
    desc: {
      type: String,
      value: ''
    },
    // 二维码图片尺寸（rpx）
    size: {
      type: Number,
      value: 500
    },
    // 是否显示保存按钮
    showSaveBtn: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 弹窗显示状态
    visible: false,
    // 二维码图片数据（base64或网络URL）
    imageData: '',
    // 加载状态
    loading: false,
    // 错误信息
    errorMsg: '',
    // 标记是否传入过数据
    hasData: false
  },

  methods: {
    /**
     * 显示二维码弹窗
     * @param {Object} options 配置选项
     */
    show(options = {}) {
      const config = {
        title: options.title || this.properties.title,
        desc: options.desc || this.properties.desc,
        imageData: options.imageData || '',
        size: options.size || this.properties.size,
        showSaveBtn: options.showSaveBtn !== undefined ? options.showSaveBtn : this.properties.showSaveBtn
      };

      this.setData({
        visible: true,
        title: config.title,
        desc: config.desc,
        loading: true,
        errorMsg: '',
        hasData: !!config.imageData
      }, () => {
        if (config.imageData) {
          this.loadImage(config.imageData);
        } else {
          this.setData({
            loading: false,
            errorMsg: '未提供二维码图片数据'
          });
        }
      });

      this.triggerEvent('show');
    },

    /**
     * 隐藏弹窗
     */
    hide() {
      this.setData({
        visible: false,
        imageData: '',
        loading: false,
        errorMsg: ''
      });
      this.triggerEvent('hide');
    },

    /**
     * 更新二维码图片
     * @param {string} imageData 新的图片数据
     */
    updateImage(imageData) {
      if (!imageData) {
        this.setData({
          errorMsg: '图片数据为空',
          imageData: ''
        });
        return;
      }

      this.setData({
        loading: true,
        errorMsg: '',
        hasData: true
      }, () => {
        this.loadImage(imageData);
      });
    },

    /**
     * 加载图片
     */
    loadImage(imageData) {
      // 验证图片数据格式
      if (!imageData) {
        this.setData({
          loading: false,
          errorMsg: '图片数据为空',
          imageData: ''
        });
        return;
      }

      // 如果是网络URL，需要下载到本地
      if (imageData.startsWith('http')) {
        this.downloadImage(imageData);
      } else if (imageData.startsWith('data:image') || imageData.startsWith('/') || imageData.startsWith('wxfile://')) {
        // 直接显示base64或本地路径
        this.setData({
          imageData: imageData,
          loading: false,
          errorMsg: ''
        });
        this.triggerEvent('load', { imageData: imageData });
      } else {
        this.setData({
          loading: false,
          errorMsg: '不支持的图片格式',
          imageData: ''
        });
      }
    },

    /**
     * 下载网络图片
     */
    downloadImage(url) {
      wx.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            this.setData({
              imageData: res.tempFilePath,
              loading: false,
              errorMsg: ''
            });
            this.triggerEvent('load', { imageData: res.tempFilePath });
          } else {
            throw new Error(`下载失败，状态码: ${res.statusCode}`);
          }
        },
        fail: (err) => {
          this.setData({
            loading: false,
            errorMsg: `下载失败: ${err.errMsg || '网络错误'}`,
            imageData: ''
          });
          this.triggerEvent('error', { errMsg: err.errMsg });
        }
      });
    },

    /**
     * 保存图片到相册
     */
    saveImage() {
      if (!this.data.imageData) {
        wx.showToast({
          title: '图片未加载',
          icon: 'none'
        });
        return;
      }

      // 检查授权
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            // 已被拒绝，需要引导用户开启权限
            wx.showModal({
              title: '提示',
              content: '需要您授权保存到相册',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting();
                }
              }
            });
          } else {
            // 申请或直接保存
            this.doSaveImage();
          }
        }
      });
    },

    /**
     * 执行保存图片
     */
    doSaveImage() {
      wx.saveImageToPhotosAlbum({
        filePath: this.data.imageData,
        success: () => {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          this.triggerEvent('save', { filePath: this.data.imageData });
        },
        fail: (err) => {
          console.error('保存失败:', err);
          if (err.errMsg.includes('auth deny')) {
            // 用户拒绝授权
            wx.showModal({
              title: '提示',
              content: '需要您授权保存到相册',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              }
            });
          } else {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
          this.triggerEvent('savefail', { errMsg: err.errMsg });
        }
      });
    },

    /**
     * 图片加载错误处理
     */
    onImageError(e) {
      console.error('图片加载失败:', e.detail);
      this.setData({
        errorMsg: '图片加载失败，请检查图片地址',
        loading: false
      });
      this.triggerEvent('error', e.detail);
    },

    /**
     * 关闭弹窗
     */
    onClose() {
      this.hide();
    },

    /**
     * 保存图片按钮点击
     */
    onSaveImage() {
      this.saveImage();
    },

    /**
     * 重新加载按钮点击
     */
    onRefresh() {
      if (this.data.imageData) {
        this.loadImage(this.data.imageData);
      }
    },

    /**
     * 阻止事件冒泡
     */
    stopPropagation() {
      // 空函数，仅用于阻止事件冒泡
    }
  }
});