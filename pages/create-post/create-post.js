const app = getApp();

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

    let nickName = "健雄学子";
    let avatarUrl = "";

    const source = app.userInfo || {};

    if (typeof source.nickName === 'string' && source.nickName.trim()) {
      nickName = source.nickName.trim();
    } else if (typeof source.nickname === 'string' && source.nickname.trim()) {
      nickName = source.nickname.trim();
    }


    if (typeof source.avatarUrl === 'string' && source.avatarUrl.trim()) {
      avatarUrl = source.avatarUrl.trim();
    } else if (typeof source.avatar === 'string' && source.avatar.trim()) {
      avatarUrl = source.avatar.trim();
    }

    const finalAvatar = avatarUrl ? avatarUrl : nickName.charAt(0);


    const newPost = {
      id: Date.now(),
      avatar: finalAvatar,
      name: nickName,
      time: '刚刚',
      topicId: selectedTopic,
      tag: this.data.topicList.find(t => t.id === selectedTopic).name,
      content: content,
      images: images,
      likes: 0,
      comments: 0
    };

    try {
      let posts = wx.getStorageSync('allPosts') || [];
      posts.unshift(newPost);
      wx.setStorageSync('allPosts', posts);
    } catch (e) {
      wx.setStorageSync('allPosts', [newPost]);
    }

    this.successBack();
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