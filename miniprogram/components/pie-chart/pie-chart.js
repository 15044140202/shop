Component({
  properties: {
    // 饼图数据
    chartData: {
      type: Array,
      value: [],
      observer: function (newVal) {
        if (newVal.length > 0) {
          this.calculatePercentages();
          this.drawPieChart();
        }
      }
    },
    // 饼图直径
    diameter: {
      type: Number,
      value: 200
    },
    // 是否显示图例
    showLegend: {
      type: Boolean,
      value: true
    },
    // 是否显示百分比
    showPercentage: {
      type: Boolean,
      value: true
    }
  },

  data: {
    // 当前选中的扇区索引
    selectedIndex: -1,
    // 计算后的数据（包含百分比）
    calculatedData: []
  },

  lifetimes: {
    attached: function () {
      // 组件实例进入页面节点树时执行
      if (this.data.chartData.length > 0) {
        this.calculatePercentages();
        this.drawPieChart();
      }
    }
  },

  methods: {
    // 计算百分比
    calculatePercentages: function () {
      const { chartData } = this.data;
      const total = chartData.reduce((sum, item) => sum + item.amount, 0);

      const calculatedData = chartData.map(item => {
        const percentage = total === 0 ? (1 / chartData.length * 100).toFixed(1) : (item.amount / total * 100).toFixed(1);
        return {
          ...item,
          percentage: percentage,
          percentageText: `${percentage}%`
        };
      });

      this.setData({
        calculatedData: calculatedData
      });
    },

    // 绘制饼状图
    drawPieChart: function () {
      const { calculatedData, diameter, selectedIndex, showPercentage } = this.data;
      if (calculatedData.length === 0) return;

      const ctx = wx.createCanvasContext('pieChart', this);
      const centerX = diameter / 2;
      const centerY = diameter / 2;
      const radius = diameter / 2 - 10;

      // 计算总数
      const total = calculatedData.reduce((sum, item) => sum + item.amount, 0);

      // 绘制饼图
      let startAngle = -Math.PI / 2; // 从12点方向开始

      calculatedData.forEach((item, index) => {
        // 计算当前扇区的角度
        const percentage = total === 0 ? 1 / (calculatedData.length) : item.amount / total;
        const angle = percentage * 2 * Math.PI;

        // 设置颜色
        ctx.setFillStyle(item.color || '#cccccc');

        // 绘制扇区
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle, false);
        ctx.closePath();
        ctx.fill();

        // 如果当前扇区被选中，绘制高亮效果
        if (index === selectedIndex) {
          ctx.setStrokeStyle('#ffffff');
          ctx.setLineWidth(3);
          ctx.stroke();
        }

        // 绘制百分比文字
        if (showPercentage) {
          const midAngle = startAngle + angle / 2;
          const textRadius = radius * 0.7;
          const textX = centerX + Math.cos(midAngle) * textRadius;
          const textY = centerY + Math.sin(midAngle) * textRadius;

          ctx.setFontSize(10);
          ctx.setFillStyle('#ffffff');
          ctx.setTextAlign('center');
          ctx.setTextBaseline('middle');
          ctx.fillText(item.percentageText, textX, textY);
        }

        // 更新起始角度
        startAngle += angle;
      });

      ctx.draw();
    },

    // 点击扇区
    onSectorTap: function (e) {
      const { index } = e.currentTarget.dataset;
      this.setData({
        selectedIndex: index === this.data.selectedIndex ? -1 : index
      }, () => {
        this.drawPieChart();
      });

      // 触发点击事件
      this.triggerEvent('sectorTap', {
        index: index,
        data: this.data.calculatedData[index]
      });
    },

    // 点击图例
    onLegendTap: function (e) {
      const { index } = e.currentTarget.dataset;
      this.setData({
        selectedIndex: index === this.data.selectedIndex ? -1 : index
      }, () => {
        this.drawPieChart();
      });
    }
  }
});