// pages/writenote/writenote.js
Page({
  data: {
    content: '',
    chapterTitle: ''
  },

  onLoad(options) {
    // 接收从reading页传递过来的章节标题
    this.setData({ chapterTitle: options.title || '未知章节' })
  },

  // 监听输入
  onInput(e) {
    this.setData({ content: e.detail.value })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 发布笔记
  publishNote() {
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请输入笔记内容', icon: 'none' })
      return
    }

    // 构建新笔记数据
    const newNote = {
      id: Date.now(), // 用时间戳作为唯一id
      avatar: this.getUserAvatar(), // 获取用户头像文字
      name: this.getUserName(), // 获取用户昵称
      time: '刚刚',
      content: content,
      likes: 0,
      isLiked: false // 新增点赞状态字段
    }

    // 通过事件通道将新笔记传递给reading页
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.emit('notePublished', newNote)

    // 提示发布成功并返回
    wx.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  },

  // 获取用户头像文字（这里用默认值，实际可从全局状态获取）
  getUserAvatar() {
    const app = getApp()
    const userInfo = app.getAuthState ? app.getAuthState().userInfo : null
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName.charAt(0)
    }
    return '我'
  },

  // 获取用户昵称
  getUserName() {
    const app = getApp()
    const userInfo = app.getAuthState ? app.getAuthState().userInfo : null
    if (userInfo && userInfo.nickName) {
      return userInfo.nickName
    }
    return '我'
  }
})