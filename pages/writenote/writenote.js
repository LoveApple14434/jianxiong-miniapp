const { profileAPI } = require('../../services/api.js')
const { isUserLogin, getLoginInfo } = require('../../utils/util')

const getCurrentUserInfo = () => {
  const app = getApp()

  if (app && typeof app.getUserInfo === 'function') {
    const userInfo = app.getUserInfo()
    if (userInfo && (userInfo.nickName || userInfo.nickname)) {
      return userInfo
    }
  }

  const loginInfo = getLoginInfo()
  return loginInfo && loginInfo.userInfo ? loginInfo.userInfo : null
}

Page({
  data: {
    content: '',
    chapterTitle: '',
    publishing: false
  },

  onLoad(options) {
    this.setData({ chapterTitle: decodeURIComponent(options.title || '未知章节') })
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
      chapterId: this.getChapterId(), // 添加章节ID
      chapterTitle: this.data.chapterTitle, // 添加章节标题
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

    if (isUserLogin()) {
      try {
        await profileAPI.saveData({ myNotes: updatedNotes, readingStats })
      } catch (err) {
        console.error('发布笔记到后端失败:', err)
        wx.showToast({ title: '已保存到本地，服务器同步失败', icon: 'none' })
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
    const userInfo = getCurrentUserInfo()
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName.charAt(0)
    }
    if (userInfo && userInfo.nickname) {
      return userInfo.nickname.charAt(0)
    }
    return '匿'
  },

  getUserName() {
    const userInfo = getCurrentUserInfo()
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName
    }
    if (userInfo && userInfo.nickname) {
      return userInfo.nickname
    }
    return '匿名'
  },

  getChapterId() {
    // 从章节标题生成一个简单的ID
    return this.data.chapterTitle.replace(/[^\w\u4e00-\u9fa5]/g, '').substring(0, 10)
  }
})