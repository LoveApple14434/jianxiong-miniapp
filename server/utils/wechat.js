const https = require('https')
const crypto = require('crypto')

const config = require('../config')

const sha1 = value => crypto.createHash('sha1').update(String(value)).digest('hex')

const requestJson = url => new Promise((resolve, reject) => {
  https
    .get(url, res => {
      let body = ''

      res.on('data', chunk => {
        body += chunk
      })

      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (error) {
          reject(error)
        }
      })
    })
    .on('error', reject)
})

const buildMockSession = code => {
  const digest = sha1(`${code}:${config.wechatAppId || 'mock'}`)

  return {
    openid: `mock_${digest.slice(0, 28)}`,
    session_key: sha1(`session:${digest}`),
    unionid: `mock_union_${digest.slice(0, 20)}`,
    mock: true
  }
}

const exchangeCodeForSession = async code => {
  if (!code) {
    throw new Error('缺少微信登录凭证')
  }

  if (config.wechatAppId && config.wechatAppSecret) {
    const url = new URL('https://api.weixin.qq.com/sns/jscode2session')
    url.searchParams.set('appid', config.wechatAppId)
    url.searchParams.set('secret', config.wechatAppSecret)
    url.searchParams.set('js_code', code)
    url.searchParams.set('grant_type', 'authorization_code')

    const response = await requestJson(url.toString())

    if (response && !response.errcode && response.openid) {
      return {
        ...response,
        mock: false
      }
    }

    if (!config.mockLogin) {
      const message = response && response.errmsg ? response.errmsg : '微信凭证换取失败'
      throw new Error(message)
    }
  }

  if (!config.mockLogin) {
    throw new Error('未配置微信小程序 AppID / AppSecret，无法完成登录')
  }

  return buildMockSession(code)
}

module.exports = {
  exchangeCodeForSession
}