Component({
  properties: {
    title: { type: String, value: '' },
    showMore: { type: Boolean, value: false },
    moreText: { type: String, value: '更多' }
  },
  methods: {
    onMoreTap() {
      this.triggerEvent('more')
    }
  }
})
