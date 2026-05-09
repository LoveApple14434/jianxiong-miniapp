// pages/writenote/writenote.js
Page({
  data: {
    content: '',
    chapterTitle: ''
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

  publishNote() {
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请输入笔记内容', icon: 'none' })
      return
    }

    // 构建新笔记数据
    const newNote = {
      id: Date.now(),
      avatar: this.getUserAvatar(),
      name: this.getUserName(),
      time: '刚刚',
      content: content,
      likes: 0,
      isLiked: false
    }

    // 传给上一页（reading页）
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('notePublished', newNote)

    // ★ 新增：保存到“我的笔记”本地存储
    this.saveToMyNotes(newNote)

    wx.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  },

  // ★ 新增函数：保存笔记到个人列表
  saveToMyNotes(note) {
    let myNotes = wx.getStorageSync('myNotes') || []
    myNotes.unshift({
      ...note,
      chapterTitle: this.data.chapterTitle,
      createTime: new Date().toLocaleString()
    })
    wx.setStorageSync('myNotes', myNotes)
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