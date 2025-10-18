Component({
  properties: {},
  data: {
    show: false,
    content: '',
    focus: false
  },
  methods: {
    show() {
      this.setData({
        show: true,
        focus: true
      });
    },
    
    hide() {
      this.setData({
        show: false,
        content: '',
        focus: false
      });
    },
    
    handleInput(e) {
      this.setData({
        content: e.detail.value
      });
    },
    
    submit() {
      if (this.data.content.trim()) {
        this.triggerEvent('submit', {
          content: this.data.content
        });
        this.hide();
      }
    }
  }
});