const app = getApp();
const { postAPI } = require('../../services/api.js')

const getCurrentUserInfo = () => {
  if (app && typeof app.getUserInfo === 'function') {
    return app.getUserInfo() || {}
  }

  return app && app.userInfo ? app.userInfo : {}
}

Page({
  data: {
    content: '',
    images: [],
    selectedTopic: 1,
    topicList: [
      { id: 1, name: '读后感' },
      { id: 2, name: '科学家精神' },
      { id: 3, name: '健雄精神' },
      { id: 4, name: '活动打卡' }
    ]
  },

  onInputContent(e) {
    this.setData({ content: e.detail.value })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      success: res => {
        this.setData({
          images: this.data.images.concat(res.tempFiles.map(item => item.tempFilePath))
        })
      }
    })
  },

  delImage(e) {
    const idx = e.currentTarget.dataset.index
    let images = this.data.images
    images.splice(idx, 1)
    this.setData({ images })
  },

  selectTopic(e) {
    this.setData({ selectedTopic: e.currentTarget.dataset.id })
  },

  doSubmit() {
    const { content, images, selectedTopic } = this.data
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    let nickName = '健雄学子'

    const source = getCurrentUserInfo()

    if (typeof source.nickName === 'string' && source.nickName.trim()) {
      nickName = source.nickName.trim()
    } else if (typeof source.nickname === 'string' && source.nickname.trim()) {
      nickName = source.nickname.trim()
    }

    const finalAvatar = nickName.charAt(0) || '健'

    const tag = this.data.topicList.find(t => t.id === selectedTopic)?.name || ''
    const payload = {
      content: content.trim(),
      topicId: selectedTopic,
      tag,
      images,
      authorName: nickName,
      authorAvatar: finalAvatar
    }

    wx.showLoading({ title: '发布中', mask: true })
    postAPI.create(payload)
      .then(() => {
        this.successBack()
      })
      .catch(error => {
        wx.showToast({ title: error.message || '发布失败', icon: 'none' })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },

  successBack() {
    wx.showToast({ title: '发布成功', icon: 'success', duration: 800 });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 800);
  },

  goBack() {
    wx.navigateBack();
  }
});