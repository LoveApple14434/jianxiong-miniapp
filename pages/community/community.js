Page({
  data: {
    currentTopic: 0,
    topics: [
      { id: 0, name: '全部' },
      { id: 1, name: '读后感' },
      { id: 2, name: '科学家精神' },
      { id: 3, name: '健雄精神' },
      { id: 4, name: '活动打卡' }
    ],

    // 所有帖子，每条帖子通过 topicId 归属一个分区
    allPosts: [
      // --- 读后感分区 ---
      {
        id: 1, avatar: '张', name: '张三', time: '2小时前',
        topicId: 1, tag: '读后感',
        content: '今天读完第三章，吴健雄在哥伦比亚大学的实验经历太震撼了。一个人在深夜的实验室里反复验证，这份对科学的执着真的让人肃然起敬。',
        images: ['img1', 'img2'], likes: 24, comments: 6
      },
      {
        id: 5, avatar: '赵', name: '赵六', time: '6小时前',
        topicId: 1, tag: '读后感',
        content: '第五章关于宇称不守恒实验的描写太精彩了，读的时候手心都在出汗，仿佛自己也站在实验室里等待结果。',
        images: [], likes: 42, comments: 9
      },
      // --- 科学家精神分区 ---
      {
        id: 2, avatar: '李', name: '李四', time: '5小时前',
        topicId: 2, tag: '科学家精神',
        content: '分享一段关于宇称不守恒实验的纪录片片段，看完才真正理解这个实验的伟大之处。先生用最精确的实验推翻了物理学界几十年的"常识"。',
        images: [], likes: 56, comments: 12
      },
      {
        id: 6, avatar: '孙', name: '孙七', time: '昨天',
        topicId: 2, tag: '科学家精神',
        content: '吴健雄先生曾说"科学是没有国界的，但科学家是有祖国的"。在那个年代，她选择用科学报国，这种精神值得我们每一个人学习。',
        images: ['img1'], likes: 71, comments: 15
      },
      // --- 健雄精神分区 ---
      {
        id: 7, avatar: '周', name: '周八', time: '3小时前',
        topicId: 3, tag: '健雄精神',
        content: '作为健雄书院的学生，每次走过书院的走廊看到先生的照片，都会提醒自己：严谨、勇气、坚持——这就是健雄精神。',
        images: [], likes: 33, comments: 5
      },
      {
        id: 8, avatar: '吴', name: '吴九', time: '1天前',
        topicId: 3, tag: '健雄精神',
        content: '今天参加了书院组织的座谈会，听老师讲述先生当年在实验室的故事，特别是她作为女性物理学家面对的种种不公，却从未放弃的精神，深受触动。',
        images: ['img1', 'img2'], likes: 48, comments: 11
      },
      // --- 活动打卡分区 ---
      {
        id: 3, avatar: '王', name: '王五', time: '昨天',
        topicId: 4, tag: '活动打卡',
        content: '打卡第七天！坚持读《吴健雄传》，每天一章。先生说"在科学面前，没有性别之分"，这句话激励着无数女性科研工作者。',
        images: ['img1'], likes: 38, comments: 8
      },
      {
        id: 4, avatar: '陈', name: '陈十', time: '3天前',
        topicId: 4, tag: '活动打卡',
        content: '打卡第四天，今天读了第二章，先生在中央大学的求学经历让我感慨万千。同为南大学子，何其有幸能在同一片土地上追寻她的足迹。',
        images: [], likes: 29, comments: 4
      }
    ],

    // 当前展示的帖子（过滤后）
    filteredPosts: []
  },

  onLoad() {
    this.filterPosts(0)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  switchTopic(e) {
    const topicId = e.currentTarget.dataset.id
    this.setData({ currentTopic: topicId })
    this.filterPosts(topicId)
  },

  filterPosts(topicId) {
    const all = this.data.allPosts
    if (topicId === 0) {
      // "全部"标签：显示所有帖子，按时间排序（id越大越新）
      this.setData({ filteredPosts: all.slice().sort((a, b) => b.id - a.id) })
    } else {
      // 按 topicId 过滤出对应分区
      const filtered = all.filter(post => post.topicId === topicId)
      this.setData({ filteredPosts: filtered.sort((a, b) => b.id - a.id) })
    }
  },

  createPost() {
    wx.showToast({ title: '发帖功能开发中', icon: 'none' })
  }
})
