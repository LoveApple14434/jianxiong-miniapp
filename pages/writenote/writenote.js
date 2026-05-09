const { profileAPI } = require('../../services/api')
const { isUserLogin } = require('../../utils/util')

Page({
  data: {
    content: '',
    chapterTitle: '',
    publishing: false
  },

  onLoad(options) {
    this.setData({ chapterTitle: options.title || '未知章节' })
  },

  onInput(e) {
    this.setData({ content: e.detail.value })
  },

  goBack() {
    wx.navigateBack()
  },

  async publishNote() {
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请输入笔记内容', icon: 'none' })
      return
    }

    this.setData({ publishing: true })

    const newNote = {
      id: Date.now(),
      avatar: this.getUserAvatar(),
      name: this.getUserName(),
      time: '刚刚',
      content: content,
      likes: 0,
      isLiked: false
    }

    // 保存到本地存储
    const savedNotes = wx.getStorageSync('myNotes') || []
    const updatedNotes = [newNote, ...savedNotes]
    wx.setStorageSync('myNotes', updatedNotes)

    // 同时更新笔记计数
    const readingStats = wx.getStorageSync('readingStats') || { readChapters: 0, noteCount: 0, likeCount: 0 }
    readingStats.noteCount = updatedNotes.length
    wx.setStorageSync('readingStats', readingStats)

    // 如果已登录，同步到后端
    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myNotes: updatedNotes, readingStats })
      } catch (err) {
        console.error('发布笔记到后端失败:', err)
        wx.showToast({ title: '笔记已保存，但未同步到服务器', icon: 'none' })
      }
    }

    // 通过事件通道通知reading页面
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('notePublished', newNote)

    wx.showToast({ title: '发布成功', icon: 'success' })
    this.setData({ publishing: false })
    setTimeout(() => wx.navigateBack(), 500)
  },

  getUserAvatar() {
    const app = getApp()
    const userInfo = app.getAuthState ? app.getAuthState().userInfo : null
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName.charAt(0)
    }
    return '我'
  },

  getUserName() {
    const app = getApp()
    const userInfo = app.getAuthState ? app.getAuthState().userInfo : null
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName
    }
    return '我'
  }
})