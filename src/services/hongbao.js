import timeout from '../utils/timeout'
import request from '../utils/request'
import clipboard from '../utils/clipboard'
import storage from '../utils/storage'

function add0 (value) {
  return ('00' + value).slice(-2)
}

function handleReceiving (data) {
  if (!data) {
    return null
  }
  const notArray = !Array.isArray(data)
  if (notArray) {
    data = [data]
  }
  data.forEach(item => {
    const date = new Date(item.gmtModified)
    item._gmtModified = `${add0(date.getMonth() + 1)}-${add0(date.getDate())} ${add0(date.getHours())}:${add0(date.getMinutes())}:${add0(date.getSeconds())}`
    item._phone = item.phone.replace(/(\d{3})(\d{4})(\d{3})/, '$1****$3')
    item._price = item.price || 0
  })
  return notArray ? data[0] : data.slice(0, 5)
}

export default {
  async userReceiving (data) {
    data = await this.request(data ? {url: '/user/receiving', method: 'POST', data} : {url: '/user/receiving'})
    return handleReceiving(data)
  },
  async userRefresh (receivingId) {
    const data = await this.request({url: '/user/refresh', method: 'POST', data: {receivingId}})
    return handleReceiving(data)
  },
  async userCookie () {
    const data = await this.request({url: '/user/cookie'})
    return {
      meituan: data.filter(item => item.application === 0),
      ele: data.filter(item => item.application === 1)
    }
  },
  userAvailable () {
    return this.request({url: '/user/available'})
  },
  notice () {
    return this.request({url: '/notice.json'})
  },
  async zhuangbi () {
    const data = await this.request({url: '/zhuangbi'})
    data.forEach(item => {
      const date = new Date(item.gmtModified)
      item._gmtModified = `${add0(date.getHours())}:${add0(date.getMinutes())}:${add0(date.getSeconds())}`
    })
    return data
  },
  async request (options = {}) {
    try {
      if (options.url.indexOf('https') !== 0) {
        options.url = `https://mtdhb.z.xxooweb.com${options.url}`
      }
      options.header = options.header || {}
      options.header['x-user-token'] = this._token
      const res = await request(options)
      if (res.code === 0) {
        return res.data || {}
      }
      if (options.url.indexOf('/user') !== -1) {
        wx.showModal({
          content: res.message,
          showCancel: false
        })
      }
      return Promise.reject(res)
    } catch (e) {
      console.error(e)
      await timeout(3000)
      return this.request(options)
    }
  },
  likeToken (value) {
    return /^[0-9A-Z]{128}$/.test(value)
  },
  async user () {
    if (this._user) {
      return this._user
    }

    const getUser = async token => {
      try {
        if (!this.likeToken(token)) {
          return
        }
        this._token = token
        const user = await this.request({url: '/user'})
        if (user.locked) {
          return wx.showModal({
            content: '您的账号已被封禁',
            showCancel: false
          })
        }
        user._mail = user.mail.split('@')[0].slice(0, 4) + '****'
        this._user = user
        storage.setData('token', token)
        return user
      } catch (e) {
        console.error(e)
      }
    }

    try {
      const user = await getUser(await clipboard.getData()) || await getUser(await storage.getData('token'))
      if (user) {
        return user
      }
    } catch (e) {}
    return Promise.reject()
  }
}
