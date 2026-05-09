Page({
  data: {
    currentEra: '1912',
    scrollToYear: '',
    eras: [
      { year: '1912' },
      { year: '1929' },
      { year: '1936' },
      { year: '1944' },
      { year: '1957' },
      { year: '1975' },
      { year: '1997' }
    ],
    events: [
      { id: 1, year: '1912', title: '诞生', content: '5月31日，吴健雄出生于江苏省太仓县浏河镇。父亲吴仲裔为她取名"健雄"，寓意健康、豪迈。' },
      { id: 2, year: '1929', title: '求学南京', content: '考入国立中央大学（南京大学前身）物理系，师从施士元教授。' },
      { id: 3, year: '1936', title: '远渡重洋', content: '赴美留学，入读加州大学伯克利分校，师从物理学家劳伦斯和塞格瑞。' },
      { id: 4, year: '1944', title: '参与曼哈顿计划', content: '加入哥伦比亚大学，参与曼哈顿计划中铀浓缩相关的重要研究工作。' },
      { id: 5, year: '1957', title: '宇称不守恒实验', content: '通过钴-60实验验证了李政道和杨振宁提出的宇称不守恒理论，震动物理学界。' },
      { id: 6, year: '1975', title: '首位女性物理学会主席', content: '当选美国物理学会首位女性会长，打破了又一个性别壁垒。' },
      { id: 7, year: '1997', title: '永恒', content: '2月16日在纽约辞世，骨灰安葬于故乡太仓浏河。先生精神，永存不朽。' }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  jumpToEra(e) {
    const year = e.currentTarget.dataset.year
    this.setData({
      currentEra: year,
      scrollToYear: year
    })
  }
})
