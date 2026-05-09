Component({
  properties: {
    year: { type: String, value: '' },
    title: { type: String, value: '' },
    content: { type: String, value: '' },
    position: { type: String, value: 'left' }
  },

  data: {
    visible: false
  },

  lifetimes: {
    detached() {
      this._disconnectObserver()
    }
  },

  // 监听所在页面的生命周期
  pageLifetimes: {
    show() {
      // 每次进入页面都重置并重新观察，确保动画常驻
      this._resetAndObserve()
    },
    hide() {
      // 离开页面时断开观察并重置状态
      this._disconnectObserver()
      this.setData({ visible: false })
    }
  },

  methods: {
    _resetAndObserve() {
      this._disconnectObserver()
      this.setData({ visible: false })

      // 等一帧让隐藏状态生效后再开始观察
      setTimeout(() => {
        this._observer = this.createIntersectionObserver({
          thresholds: [0.15]
        })
        this._observer.relativeToViewport({ bottom: -60 }).observe('.tl-item', (res) => {
          if (res.intersectionRatio > 0.1 && !this.data.visible) {
            this.setData({ visible: true })
            this._disconnectObserver()
          }
        })
      }, 50)
    },

    _disconnectObserver() {
      if (this._observer) {
        this._observer.disconnect()
        this._observer = null
      }
    }
  }
})
