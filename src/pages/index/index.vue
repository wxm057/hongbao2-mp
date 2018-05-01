<template>
  <view>
    <view class="normal" v-if="view === 'normal'">
      <image @click="scanCode" v-for="(item, index) in normal" :key="index" mode="aspectFill" :src="item" />
    </view>

    <view class="hongbao" v-if="view === 'hongbao'">
      <swiper class="zhuangbi" autoplay interval="3000" circular vertical>
        <swiper-item v-for="(item, index) in zhuangbi" :key="index">
          {{item.mail}} 在 {{item._gmtModified}} 领到
          <text class="zhuangbi__text">{{item.price}}</text>
          元{{item.application === 0 ? '美团' : '饿了么'}}大红包
        </swiper-item>
      </swiper>

      <view class="hello">您好 {{user.mail}} (uid: {{user.id}})</view>

      <view class="breadcrumb">
        <view class="breadcrumb__item">
          反馈问题
          <button class="breadcrumb__button" open-type="contact"></button>
        </view>
        <view class="breadcrumb__split">/</view>
        <view class="breadcrumb__item" @click="clickAlipay">
          复制支付宝红包码
          <button class="breadcrumb__button"></button>
        </view>
      </view>

      <view class="alert alert--info" v-if="userAvailable && userCookie">
        今日剩余：美团 {{userAvailable.meituan}}/{{userCookie.meituan.length * 5}} 次，饿了么
        {{userAvailable.ele}}/{{userCookie.ele.length * 5}} 次
      </view>
      <view class="alert alert--info" v-else>
        数据加载中，长时间没有响应请下拉刷新
      </view>

      <view class="alert alert--notice" v-for="(item, index) in notice" :key="index">{{item}}</view>

      <view class="getHongbao">
        <form @submit="submitHongbao">
          <input class="getHongbao__input" name="phone" type="number" :value="phone" maxlength="11" placeholder="请输入要领取最大红包的手机号码" />
          <textarea class="getHongbao__textarea" name="url" :value="url" placeholder="请输入美团、饿了么拼手气红包链接（具体规则请访问网页版查看相关的教程）" />
          <button :class="['getHongbao__get', {'getHongbao__get--disabled': !enableHongbao}]" form-type="submit">
            {{enableHongbao ? '领取手气最佳红包' : '正在领取红包...'}}
          </button>
          <view class="getHongbao__website" @click="clickWebsite">复制 https://www.mtdhb.com 用浏览器打开</view>
        </form>

        <view class="getHongbao__list">
          <view class="getHongbao__item" v-for="(item, index) in userReceiving" wx:key="index">
            <view class="getHongbao__itemTime">{{item._gmtModified}}</view>
            <view class="getHongbao__itemPrice">{{item.status === 1 ? item._price : 0}}</view>
            <view class="getHongbao__itemOther">
              <view class="getHongbao__itemPhone">{{item.application === 0 ? '美' : '饿'}} {{item._phone}}</view>
              <view :class="['getHongbao__itemMessage', {'getHongbao__itemMessage--success': item.status === 1}, {'getHongbao__itemMessage--fail': item.status !== 1 && item.status !== 0}]">
                {{item.status === 0 ? '正在领取红包...' : item.status === 1 ? '领取成功（请以实际到账金额为准）': item.message}}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="joinGroup">
        <view class="joinGroup__qq" @click="clickQQGroup">复制 QQ 群号 617166836</view>
        <view class="joinGroup__wx">
          <view>扫描下面二维码，邀请你进入微信群</view>
          <image class="joinGroup__wxQrcode" mode="aspectFit" src="/static/wechat.png" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import hongbao from '../../services/hongbao'
  import scanCode from '../../utils/scanCode'
  import storage from '../../utils/storage'
  import clipboard from '../../utils/clipboard'
  import timeout from '../../utils/timeout'

  export default {
    data () {
      return {
        normal: [
          'https://desk-fd.zol-img.com.cn/t_s960x600c5/g5/M00/03/04/ChMkJ1oJW4iIIAZJAAfcOXA1PHcAAiH8gHsUiYAB9xR139.jpg',
          'https://desk-fd.zol-img.com.cn/t_s960x600c5/g5/M00/03/04/ChMkJloJW36IGDpwAAd_V2iVa6wAAiH8gF1_xAAB39v037.jpg',
          'https://desk-fd.zol-img.com.cn/t_s960x600c5/g5/M00/03/04/ChMkJ1oJW5SIfKCrAAs6A-fVlFQAAiH8gJQcWwACzob837.jpg'
        ],
        view: '',
        user: null,
        zhuangbi: null,
        userAvailable: null,
        notice: null,
        userCookie: null,
        userReceiving: [],
        phone: '',
        url: '',
        enableHongbao: true
      }
    },
    async onLoad () {
      try {
        this.phone = await storage.getData('phone')
      } catch (e) {}
    },
    async onShow () {
      await this.getData()
    },
    async onPullDownRefresh () {
      await this.getData()
      wx.stopPullDownRefresh()
    },
    onShareAppMessage () {
      return {
        title: '一键最佳',
        path: '/page/index'
      }
    },
    methods: {
      async getData () {
        try {
          this.user = await hongbao.user()
          this.view = 'hongbao'
          try {
            const [zhuangbi, notice, userAvailable, userCookie, userReceiving] = await Promise.all([
              hongbao.zhuangbi(),
              hongbao.notice(),
              hongbao.userAvailable(),
              hongbao.userCookie(),
              hongbao.userReceiving()
            ])
            this.zhuangbi = zhuangbi
            this.notice = notice
            this.userAvailable = userAvailable
            this.userCookie = userCookie
            this.userReceiving = userReceiving
          } catch (e) {}
        } catch (e) {
          this.view = 'normal'
        }
      },
      async submitHongbao (event) {
        if (!this.enableHongbao) {
          return
        }
        const {url, phone} = event.target.value
        if (!url || !phone) {
          return wx.showModal({
            content: '请将信息填写完整',
            showCancel: false
          })
        }
        try {
          await storage.setData('phone', phone)
          this.enableHongbao = false
          this.url = ''
          const data = await hongbao.userReceiving({url, phone})
          this.userReceiving.unshift(data)
          await this.refreshUserReceiving()
        } catch (e) {
          console.error(e)
          this.enableHongbao = true
        }
      },
      async refreshUserReceiving () {
        const data = await hongbao.userRefresh(this.userReceiving[0].id)
        if (data.status === 0) {
          await timeout(5000)
          this.refreshUserReceiving()
        } else {
          this.userReceiving[0] = data
          this.enableHongbao = true
        }
      },
      async scanCode (event) {
        try {
          const {result} = await scanCode()
          if (hongbao.likeToken(result)) {
            await storage.setData('token', result)
            wx.redirectTo({url: '/page/index'})
          }
        } catch (e) {}
      },
      async clickAlipay () {
        await clipboard.setData('c7XYed92oO')
      },
      async clickQQGroup () {
        await clipboard.setData('617166836')
      },
      async clickWebsite () {
        await clipboard.setData('https://www.mtdhb.com')
      }
    }
  }
</script>

<style lang="less">
  page,
  view,
  input,
  textarea {
    box-sizing: border-box;
  }

  .normal {
    image {
      width: 100%;
      display: block;
      margin-bottom: 8px;
    }
  }

  .hongbao {
    font-size: 15px;
    padding: 20px 15px;
    overflow-x: hidden;
    color: rgba(0, 0, 0, .65);
  }

  .zhuangbi {
    color: rgb(91, 171, 96);
    height: 30px;
    line-height: 30px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &__text {
      color: rgb(221, 35, 35);
    }
  }

  .hello {
    color: rgba(0, 0, 0, .85);
    font-weight: bold;
  }

  .breadcrumb {
    display: flex;
    align-items: center;

    &__item {
      position: relative;
      color: #40a9ff;
      padding: 15px 0;
    }

    &__split {
      padding: 0 8px;
      color: rgba(0, 0, 0, .45);
    }

    &__button {
      opacity: 0;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
    }
  }

  .alert {
    margin-bottom: 15px;
    border-radius: 4px;
    padding: 8px 15px;
    font-size: 14px;

    &--info {
      border: 1px solid #91d5ff;
      background-color: #e6f7ff;
    }

    &--notice {
      border: 1px solid #ffe58f;
      background-color: #fffbe6;
    }
  }

  .getHongbao {
    &__input,
    &__textarea {
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      width: 100%;
      color: #333;
    }

    &__input {
      line-height: 1;
      height: 40px;
      padding: 0 12px;
    }

    &__textarea {
      padding: 12px;
      line-height: 1.5;
      margin: 15px 0;
    }

    &__website {
      font-size: 14px;
      text-align: center;
      margin-bottom: 15px;
      color: #40a9ff;
    }

    &__list {
      border-bottom: 1px dotted #ccc;
    }

    &__item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-top: 1px dotted #ccc;
      text-align: center;
    }

    &__itemTime {
      font-family: Aarial;
      width: 50px;
    }

    &__get {
      color: #fff;
      background-color: #1890ff;
      border-color: #1890ff;
      border: 1px solid transparent;
      padding: 12px;
      height: auto;
      border-radius: 4px;
      line-height: 1;
      margin-bottom: 15px;
      font-size: 15px;

      &--disabled {
        opacity: 0.7;
      }
    }

    &__itemPrice {
      width: 80px;
      padding: 0 20px;
    }

    &__itemOther {
      text-align: left;
      flex: 1;
    }

    &__itemMessage {
      &--success {
        color: rgb(91, 171, 96);
      }

      &--fail {
        color: rgb(221, 35, 35);
      }
    }
  }

  .joinGroup {
    &__qq {
      font-size: 14px;
      margin: 15px 0;
      text-align: center;
      color: #40a9ff;
    }

    &__wx {
      text-align: center;
      font-size: 14px;
    }

    &__wxQrcode {
      width: 220px;
      height: 220px;
      display: block;
      margin: 5px auto 0;
    }
  }
</style>
