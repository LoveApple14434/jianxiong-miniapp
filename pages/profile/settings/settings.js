Page({
  data: {
    form: {
      nickName: '健雄学子',
      avatarText: '健',
      readDays: 12
    }
  },

  onShow() {
    const profileInfo = wx.getStorageSync('profileInfo') || this.data.form

    this.setData({
      form: profileInfo
    })
  },

  onNickNameInput(e) {
    this.setData({
      'form.nickName': e.detail.value
    })
  },

  onAvatarTextInput(e) {
    this.setData({
      'form.avatarText': e.detail.value
    })
  },

  saveProfile() {
    const nickName = this.data.form.nickName.trim()
    const avatarText = this.data.form.avatarText.trim()

    if (!nickName) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      })
      return
    }

    if (!avatarText) {
      wx.showToast({
        title: '请输入头像文字',
        icon: 'none'
      })
      return
    }

    const profileInfo = {
      ...this.data.form,
      nickName,
      avatarText: avatarText.slice(0, 1)
    }

    wx.setStorageSync('profileInfo', profileInfo)

    this.setData({
      form: profileInfo
    })

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },

  resetDefaultData() {
    wx.showModal({
      title: '恢复默认数据',
      content: '将恢复个人中心的默认昵称、笔记、收藏、进度和徽章数据。',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('profileInfo')
          wx.removeStorageSync('myNotes')
          wx.removeStorageSync('myFavorites')
          wx.removeStorageSync('readingProgress')
          wx.removeStorageSync('readingStats')

          this.setData({
            form: {
              nickName: '健雄学子',
              avatarText: '健',
              readDays: 12
            }
          })

          wx.showToast({
            title: '已恢复默认',
            icon: 'none'
          })
        }
      }
    })
  }
})
