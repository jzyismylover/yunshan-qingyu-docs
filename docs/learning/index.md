## 环境准备

Vue3 + Vite + Typescript

node 版本在 14 版本以上

[git bash 配置作为默认控制台](https://zhuanlan.zhihu.com/p/421493074)



## 界面逻辑

![image-20220520090154165](/framework.png)


### 全局分析

![image-20220520090459406](/hot-words.png)

![image-20220520090527391](/active-user.png)



:information_source: 全局分析里面有很多个模块，每个模块的模版，数据，样式其实都是隔离的，所以我们倾向于是把每一个模块都抽象为是一个组件，曾经在面试的时候有面试官问过我，组件是什么？为什么我们需要组件？其实我没有回答得很好，我觉得组件其实是一个模块的拆分，里面的数据可能依赖于外部传递，也可能内部有自己实现的逻辑。[知乎](https://zhuanlan.zhihu.com/p/33999571) 



#### 主要逻辑

- 全局分析的组件主要在 components/common 下，每一个文件夹内部又抽取了一个 item.vue 和 index.vue，因为其实像上面活跃用户它是由多个元素的。

```html
<!-- 对应 item.vue -->
<template>
  <div class="card--body">
    <img :src="data.logo" alt="">
    <div class="content">
      <div class="name">{{ data.user }}</div>
      <div class="blogs">发帖数 &nbsp;{{ data.creates }}</div>
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ActiveCardItem',
  props: {
    data: {
      required: true,
      type: Object
    }
  },
  setup () {
    const ellipsis = ref(true)

    return {
      ellipsis
    }
  }
})
</script>
```

```html
<!-- index.vue -->
<template>
  <div>
    <div id="active_user" class="model--title">活跃用户</div>
    <div class="chart">
      <card-item v-for="item in activeUsers" :key="item.id" :data="item" />
    </div>
  </div>
</template>

```

在 index.vue 通过获取数据然后通过 v-for 渲染 item.vue，这样的好处在于数据获取的逻辑就隔离在了 index.vue， 视图渲染逻辑就隔离在 item.vue 两者通过组件通信的方式进行信息传递，逻辑可能会更加清晰一些，当然其实放在一起也是没问题的，每个人都有每个人不同的组织思路，其实最后能够完成任务怎么实现都是可以的。



:exclamation: 在我们写好了这些业务组件以后，怎么样把它放到全局分析上去呢？我们需要考虑一个问题：数据获取的逻辑到底是放在每个组件里面还是说统一由父组件传递进去？

```html
<!-- 全局分析 index.vue -->      
<div class="container">
        <a-row :gutter="10">
          <!-- 热点词汇 -->
          <a-col :span="24">
            <wordcloud v-if="isShow" :wordcloud-data="wordCloudData" />
          </a-col>
          <!-- 活跃用户 -->
          <a-col :span="24">
            <active-user v-if="isShow" :active-users="activeUserData" />
          </a-col>
          <!-- 热点新闻 -->
          <a-col :span="24">
            <daily-hot v-if="isShow" :hot-news="hotNews" />
          </a-col>
          <!-- 博主分析 -->
          <a-col :span="24">
            <blog-analyse v-if="isShow" :ranking="rankingData" :school-pie-data="schoolPieData" :school-table-data="schoolTableData"/>
          </a-col>
        </a-row>
</div>
```

其实两种方式都是可以的，只是说后面处理的方式不一样，那我两种方法都说下：



1. 统一由父组件传递进去

```ts
  const initData = async () => {
    Promise.all([getUsers(), getHotNews(), getWordCloud(), useBloggerAnalyse()] ).then(dataLists => {
      activeUserData.value = dataLists[0] // 更新活跃用户数据
      hotNews.value = dataLists[1] // 更新热点新闻数据
      wordCloudData.value = dataLists[2] // 更新词云数据
      rankingData.value = (dataLists[3] as any)[0]
      schoolPieData.value = (dataLists[3] as any)[1]
      schoolTableData.value = (dataLists[3] as any)[1]
      setTimeout(() => {
        isShow.value = true
      }, 1500)
    })
  }
```

使用 initData 函数获取所有组件的数据，然后像上面代码中通过 v-bind 的方式去绑定数据进行父子组件通信。我在项目中使用的是这样方式，原因应该有两个：

:wink: 第一：可以控制组件什么时候显示，也就是说我可以通过在每个组件上设置一个 isShow 的值，只有当数据全部加载完成以后才进行视图的展示，否则就显示加载动画。(主要)

:wink: 第二：如果需要根据时间/ 关键字获取数据的话可以统一在 initData 内部加 (次要)



2. 每个子组件单独获取数据

```html
<div class="container">
        <a-row :gutter="10">
          <!-- 热点词汇 -->
          <a-col :span="24">
            <wordcloud />
          </a-col>
          <!-- 活跃用户 -->
          <a-col :span="24">
            <active-user />
          </a-col>
          <!-- 热点新闻 -->
          <a-col :span="24">
            <daily-hot />
          </a-col>
          <!-- 博主分析 -->
          <a-col :span="24">
            <blog-analyse/>
          </a-col>
        </a-row>
      </div>
```

对应的 HTML 代码应该就是这样的，然后在 wordcloud 组件里面获取 wordcloud 数据，在 active-user 里面获取 active-user 数据.....，至于说怎么根据时间 / 关键字去更新数据的话可以通过 [ref](https://www.javascriptc.com/vue3js/api/special-attributes.html#ref) 引用到子组件，然后调用子组件的方式顺便传递数据。

```html
<a-col :span="24">
   <wordcloud ref="wordcloud"/>
</a-col>
<a-col :span="24">
  <active-user ref="activeUser"/>
</a-col>
...
<script>
export default defineComponent({
  setup() {
      const wordcloud = ref()
      const activeUser = ref()
      ...
      const onGetData = (type, time) => {
          wordcloud.value.getData(type, time)
          activeUser.value.getData(type, time)
          ....
      }
  }  
})
</>
```

:information_source: 这样也是可以的，但是我觉得有一个最大的缺点就是父组件难以控制子组件是否显示。比如说 wordcloud 的数据很快就加载完了，但是 activeUser 的数据还是没有的，那么此时页面就会有个空白的情况，我们可以给每个组件都设定一个 loading 的逻辑也是可以的，但是相对来说就没有那么方便吧。但是奈何这种方式其实更容易理解，所以实际中使用哪一种其实也没有特别限制，根据需求去切换其实就好了。



### 热点聚集

![image-20220520105732218](/hoT-news.png)

选择“平台”和“时间” 都可以实现数据的切换，那是怎么做的呢？

```html
    <!-- 时间选择 -->
    <a-select v-model:value="timeslot" :options="option" @change="onTimeChange" class="select"></a-select>
    <a-tabs v-model:activeKey="platform" animated @change="onPlatformChange">
      <a-tab-pane key="1" tab="知乎">
        <div class="chart">
          <card-item v-for="item in cardData" :key="item.id" :data="item" @click="onPageRedirct(item.id)"   class="item" />
        </div>
      </a-tab-pane>
    </a-tabs>
```

```ts
  const onTimeChange = (value: string) => {
    console.log('on time change')
    onChange(value, null)
  }

  const onPlatformChange = (value: string) => {
    console.log('platform change')
    onChange(null, value)
  }

  const onChange = async (time?:string|null, platform?:string|null) => {
    console.log(time, platform)
    cardData.value = []
    // 重新进行数据的赋值
    cardData.value = await XRequest({ url: API.hotSpot, param: { time, platform } })
  }
```

#### 主要逻辑

:information_source: 本质上是通过监听 select 选择框和 tabs 的触发事件，也就是上面的 onTimeChange 和 onPlatfromChange(ant-desigin-vue 提供的 change 事件)。每次触发的时候将对应的参数传递到获取数据的函数那里重新请求数据。



### 每周报表 & 专题分析

>  两个模块放在一起讲是因为它们其实是类似的，因为其实都是表格然后基于不同的条件进行数据的筛选

<img src="/weekly-report.png" alt="image-20220520151300897" style="zoom:67%;" />



#### 主要的逻辑

1. 点击查看的时候传递时间序列(开始事件-结束时间)给后台，然后后台根据时间检索对应的数据返回给我们。具体的数据获取逻辑和全局分析里面是类似的。

```js
const initData = async (startTime, endTime) => {
    Promise.all([getUsers(startTime, endTime), getHotNews(startTime, endTime), getWordCloud(startTime, endTime), useBloggerAnalyse(startTime, endTime)] ).then(dataLists => {
      activeUserData.value = dataLists[0] // 更新活跃用户数据
      hotNews.value = dataLists[1] // 更新热点新闻数据
      wordCloudData.value = dataLists[2] // 更新词云数据
      rankingData.value = (dataLists[3] as any)[0]
      schoolPieData.value = (dataLists[3] as any)[1]
      schoolTableData.value = (dataLists[3] as any)[1]
      setTimeout(() => {
        isShow.value = true
      }, 1500)
    })
  }
```

:key: 其实 initData 这个函数就是全局分析里面的那个 initData，只不过我们传递了开始时间和结束时间两个参数进去而已，所以这也是为什么在代码里面把这个 initData 函数放到 controller 里面的原因，因为这个是可以复用的。

:wink: 那对于专题分析来说，传递进去的数据可能就是开始时间，结束时间，关键字，initData 依然可以不变呀！

:exclamation: 那如果模块不一样了怎么办，那就简单了，重新写个和 initData 类似的函数不就可以了嘛。



2. 新建报表 / 新建分析

```js
const reportState = reactive({
      name: '',
      date: []
})
const setConfirm = () => {
    // 把 reportState 的数据传递给后台即可
}
```



### 信息检索





## Composition Api

>  controller 里面的 .ts 文件。目的也是为了逻辑可复用和抽离。





```js
// 抽取热点聚集平台切换的逻辑到 src/controllers/hotspot/useCard.ts
const onTimeChange = (value: string) => {
    console.log('on time change')
    onChange(value, null)
  }

  /* 平台序列 */
  const platform = ref('1')
  const onPlatformChange = (value: string) => {
    console.log('platform change')
    onChange(null, value)
  }

  /* 时间切换 & 平台切换 双重处理 */
  const onChange = async (time?:string|null, platform?:string|null) => {
    console.log(time, platform)
    cardData.value = []
    cardData.value = await XRequest({ url: API.hotSpot, param: { time, platform } })
  }
```

:star 一般 composition api 抽取出来的函数以 use + 'xxxx' 来命名表示是内部抽取逻辑。

```js
export function useCard () {}
export function useOverview() {}
...

// 在组件引用的时候
const { } = useCard()
const { } = useOverview() 
```





## 工具函数

:::tip

其实也就是 utils 里面的函数，这些函数写好一次以后是可以直接搬到别的项目里面用的，这也是为什么它们叫工具函数的原因。

:::



### axios

>  请求工具函数，封装好了以后导出一个函数实例，可以通过传递不同的参数来实现不同的网络请求，封装的目的是为了使得函数整体的复用性更强。

```js
// axios.ts 
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'
import { HEADERS } from './headers'

export const http: AxiosInstance = axios.create({
  /* baseURL: import.meta.env.MODE === 'development'
    ? '/prod'
    : '/prod' */
  headers: {
    'Content-Type': HEADERS.JSON
  }
})

/* 请求拦截配置(针对当前项目一般是 application/json) */
http.interceptors.request.use((config: AxiosRequestConfig) => {
  // 添加 token 传递和验证
  return config
})

/* 响应拦截配置(针对当前项目存在一些不同的 responseType) */
http.interceptors.response.use((response: AxiosResponse) => {
  // 拦截响应信息进行相应的重定向处理
  // console.log(response);
  // return response.data.data
  return response.data.res.data
})

```

- 上面其实主要就是创建了一个 axios 实例。然后对实例进行初始化的配置，比如一个 baseURL，拦截器等。

```ts
// src/utils/axios/index.ts
export function XRequest (properties: RequestParam) {
  let data: { params?: any; data?: any; } = {}
  const { url, method = 'get', param, headers, options } = properties

  return new Promise((resolve: (value: any) => void, reject) => {
    if (options?.isToken) { // 配置 token
      http.defaults.headers.common.Authorization = `Bearer 	${localStorage.getItem('token')}` || ''
    }

    if (method === 'get') {
      data = { params: param }
    } else if (method === 'delete') {
      data = { params: param }
    } else if (method === 'post' || method === 'put') {
      data = { data: JSON.stringify(param) }
    }

    // 实际的请求方法
    http({
      url,
      method,
      ...data
    }).then((response: AxiosResponse) => {
      /* console.info(response) */
      const res_data: IResponse = response
      if (res_data) {
        resolve(res_data)
      }
    }).catch((err: AxiosError) => {
      reject(err)
    })
  })
}
```

- XRequest 方法其实就是我们最后封装导出的请求函数，可以看到它内部是对我们传入参数进行了处理，如果是 get 方法.....，如果是 post方法 ....， 如果需要 token 验证......。所以我们可以通过传递不同的参数控制最后请求的行为来达到不同的目的。内部的 http 其实就是我们刚刚创建的 axios 实例，每次请求其实都是用 axios 实例去请求。

>  :exclamation: 里面有一个可优化的点，我们每次导入 http 的时候，都得去创建一个 axios 实例，那其实带来的是资源的浪费，因为其实都是一个 axios 嘛，那我们可不可以判断 axios 是否创建了，创建了就直接复用原来的就好了，这是一个可以考虑去优化的点（设计模式中的单例模式）



上面的配置其实都是根据不同的项目动态变化的，比如对于我们当前的项目来说，需要我们传递的 Content-Type 是 mutipart/form-data 也就是 form-data 数据。

```js
// 那我就加入这个判断 -- 判断是否是需要我们传递 form-data 类型的数据  
if (options?.isFile) {
      const contentType = headers && headers['Content-Type']
      const formData = new FormData()
      for (const item in param) { // 添加参数进 入 formData 中
        formData.append(item, param[item])
      }
      data = { data: formData }
    }
```





### storage

> localStorage 缓存身份验证码

```ts
type StorageItem = {
  content: string,
  lastTime: number
}

/**
 * @class 本地localStorage 封装
 */

export class LocalStorge {
  limit = 60 * 60 * 24 * 1000 // 一天

  /* 获得缓存内容 */
  getLocalItem (key: string) {
    const nowTime = +new Date()
    const keyword = localStorage.getItem(key)!

    if (keyword === null) { /* 不存在 content */
      return 0
    }

    const item = JSON.parse(keyword) as StorageItem
    if (nowTime - item?.lastTime >= this.limit) { /* content 过期 */
      this.deleteLocalItem(key)
      return 1
    } else {
      return item.content
    }
  }

  /* 设置缓存内容 */
  setLocalItem (key: string, content: string) {
    const item: StorageItem = {
      content: content,
      lastTime: +new Date()
    }
    localStorage.setItem(
      key,
      JSON.stringify(item)
    )
  }

  /* 删除缓存内容 */
  deleteLocalItem (key: string) {
    localStorage.removeItem(key)
  }
}

```



> localStorage 是持久性的存储，持久性指的是如果不手动去清除的话它就一直都在，这其实是不好的，因此有必要设定一个有效期来判断一个存储内容块的合法性。



上面的逻辑主要是在 setLocalItem 的时候，将 content 和 lastTime 打包一起存进去，lastTime 指的是存进入的时间，然后在 getItem 的时候用当前时间 - 上次存进去的时间(nowTime - lastTime)的值与 limit (有效时间范围) 进行对比，如果在这个范围内的话，那么我们就认为这个缓存是有效的，否则就提示用户缓存过期然后清除掉当前的缓存(重置的过程)。

:smile: 其实记住密码我觉得也是这么做的，最简单的就是点击记住密码以后存入缓存，每次到登录页的时候去看看缓存有没有用户名和密码，当然这样很不安全，因为密码是可以在开发者工具被人看到的。(配合后台实现的方法更优：缓存记住密码这个布尔值，自动请求接口)





### usePage

> 封装路由跳转函数

- [vue-router RouteLocationRaw 介绍](https://router.vuejs.org/zh/api/#routelocationraw)

```ts
import { RouteLocationRaw } from 'vue-router'
import { PageEnum } from '@/enum/pageEnum'
import router from '../router'

export type RouteLocationRawEx = Omit<RouteLocationRaw, 'path'> & { path: PageEnum };

/**
 * @function 自定义Vue-Router导航函数
 * @returns {Function} go
 */
export function useGo (): Function {
  const { push, replace } = router
  function go (opt : string | RouteLocationRawEx, isReplace = false) {
    if (typeof opt === 'string') {
      isReplace ? replace(opt) : push(opt)
    } else {	
      const o = opt as RouteLocationRaw
      isReplace ? replace(o) : push(o)
    }
  }
  return go
}

export function useBack (): void {
  const { back } = router
  back()
}

```

Vue-Router 的路由跳转的方法其实有两种

1. push  保留历史记录
2. replace  不保留历史记录

push：

```js
// 正常我们路由跳转的方式
const router = useRouter()
router.push('/home/overview') // 方式一：传递 path 字符串
router.push({ name: 'Home' }) // 方式二：传递一个路由项对象
```

上面的 opt 其实做了一个这样子的判断，根据不同类型的 opt 就以不同的写法/方式去跳转.

- 不同策略传递的结果

```js
go({ path: '/test', query: { name: 'yes' } }) // http://localhost:3000?name=yes
go({ name: 'Test', params: { name: 'yes' } }) // http://localhost:3000/yes
```



### useCurrentInstance

> 获得根实例，从而拿到诸如全局变量等信息

```js
export function useCurrentInstance () {
  const { appContext } = getCurrentInstance() as ComponentInternalInstance
  const proxy = appContext.config.globalProperties
  return {
    proxy
  }
}

```



> 函数的作用是获取全局挂载的属性或者方法



因为我们也知道在 vue3 其实是移除了原型这个概念，所以没办法像以前一样将一些东西挂载到原型上

```js
app.config.globalProperties.xxx = xxx //  新的方式
```

:question: 那怎么在组件中获取这些变量呢 

```js
const { proxy } = useCurrentInstance()
proxy.xxx // 就可以访问了
```





### useEcharts

```typescript
// src/utils/useEcharts 
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { PieChart } from 'echarts/charts'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import * as echarts from 'echarts/core'

echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout
])

export default echarts
```

:question: 为什么要把 echarts 抽取出来呢？因为我们需要按需引入 echarts 内部的组件，比如我们当前用到了饼图，直方图，折线图，那么我们就需要引用里面的组件，如果在不同地方引入的话其实相对来说还是挺麻烦的，倒不如我们整个 echarts 实例放到一个文件里面，在这个文件内引入需要的组件然后导出那么不就各个地方都可以使用了！！！



## 跨域问题

- 浏览器限制不同协议，域名，端口的主机之间进行通信，由此产生了跨域。那么跨域导致的结果是什么？

![image-20220520084233278](/migration.png)

图片的意思就是说当我们访问 http://120.77.245.193/blog-system.... 这个资源路径的时候，被限制了，其实这个限制是浏览器的限制，它提示我们可以使用 CORS(跨域资源共享) 来解决

### 后台处理(反向代理)

1. 改变 apache / nginx 的配置文件支持 CORS 
2. 后台返回的时候加上对应的返回标头给浏览器


### 前端处理(正向代理)

1. 通过脚手架虚拟一个代码服务器

   ```js
   // vite.config.ts 添加    
   server: {
         proxy: {
           '^/api/.*': {
             target: 'http://120.25.158.199:8001',
             changeOrigin: true,
             secure: true,
             rewrite: (path) => path.replace(/^\/api/, '')
           }
         },
   },
   ```

   然后在我们写请求接口的时候，默认使用 /api 前缀，项目启动的时候，本地服务器会拦截到我们的网络请求并将请求转接到代理服务器上，代理服务器通过不断的 ip 寻址找到我们需要请求的远程服务器，然后帮我们发送请求接受请求。

## 开发环境 mock

插件：`vite-plugin-mock` 

vite-plugin-mock 其实是一个在 vite 中集成 mock 的插件。传统的 mock 其实需要在每个地方把 mock 方法导入注册一遍，工序较为烦琐，而 vite-plugin-mock 作为一个脚手架层级支持的插件，使用上无论是在开发还是生产阶段都十分便捷。

- 内部以特定的结构组成，但 mock 的语法与 mockjs 一致。

```tsx
import { MockMethod } from 'vite-plugin-mock'

export default [
  {
    url: '/api/get/analyses',
    method: 'get',
    response () {
      return {
        code: 200,
        'data|50': [{
          id: '@integer(1, 100)',
          keyword: '@csentence(5, 10)',
          startTime: '@date',
          endTime: '@date',
          nowTime: new Date().toLocaleDateString().split('/').join('-')
        }]
      }
    }
  }
] as MockMethod[]
```



项目开发初期没有后台介入数据无法正常显示，基于插件的特性，配置 mock 拦截在生产环境生效。在 `vite.config.ts` 增加插件配置，配置的关键在于是否开启生产环境的 mock，如果开启了，那么就会在生产阶段执行 injectCode 里面的代码。

```tsx
viteMockServe({
   ignore: /^\_/,
    mockPath: 'mock', // mock 地址
    localEnabled: localEnable, // 开发环境是否开启 mock
    prodEnabled: productEnable, // 生产环境是否开启 mock
    supportTs: true, // 监听 .ts 文件(与此带来的后果是无法监听 .js 文件)
    injectCode: `
       import { setupProdMockServer } from '../mock/_setupMockProdServer';
        setupProdMockServer();
      `,
}),
```



```tsx
// mock/_setupMockProdServer.ts
import { createProdMockServer } from 'vite-plugin-mock/es/createProdMockServer'

const modules = import.meta.globEager('./**/*.ts')
const mockModules: any[] = []

// 加载 & 排除模块
Object.keys(modules).forEach(item => {
  if (item.includes('/_')) {
    return undefined
  }
  mockModules.push(...modules[item].default)
})

export function setupProdMockServer () {
  createProdMockServer(mockModules)
}

```

`_setupMockProdServer` 其实是利用了 vite 提供检索文件的 api，检索 mock 文件夹内的所有文件，然后通过 `createProdMockServer` 注册 mock 列表，完成在生产环境的应用。






## 应用部署
由于路由模式使用的是 history 模式，因此回退或者刷新页面难免会出现找不到资源路径的情况，而当时刷新页面的时候 `/yunshan-qingyu/home/overview` 浏览器会向服务器请求这个资源，但是服务器内其实并没有这个资源路径，因为对应来说在 Vue 应用里面我们是使用 JS 来进行路由导航的，渲染页面的过程为内部处理，这也是 SPA 的特性。

> 构建结束会把 `main.ts` 里面的内容合并为一个 chunk 包在 html 中进行引入，
```html {11}
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="referrer" content="no-referrer" />
  <link rel="icon" href="/yunshan-qingyu/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>云山晴雨</title>
  <script type="module" crossorigin src="/yunshan-qingyu/assets/index.210becc0.js"></script>
  <link rel="modulepreload" href="/yunshan-qingyu/assets/vendor.9d0a82a1.js">
  <link rel="stylesheet" href="/yunshan-qingyu/assets/vendor.82c3829d.css">
  <link rel="stylesheet" href="/yunshan-qingyu/assets/index.bfce105e.css">
</head>

<body>
  <div id="app"></div>
</body>

</html>
```
:::tip
解决的方法其实就是我们去修改 http 服务器的配置文件对当前无法匹配的路径进行重定向。
:::

对于 apache 服务器，新建一个 .htaccess 文件在服务根目录下(可以到 http.conf 查看当前挂载的根目录在哪)，然后使用 IfModule 来重写定向规则。大概的思路就是指定一个 base，指定一个重定向终点文件 `index.html`
```
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
</IfModule>
```





## 功能亮点



### 输入框级联

？？？





## 补充知识


### Object 的序列化

```js
const obj = {
    name: 'wyl',
    age: 20
}
console.log(obj.toString()) // 输出的是 [object Object]

const obj = {
    name: 'wyl',
    age: 20,
    toString() {
        return 'wyl'
    }
}
console.log(obj.toString()) // 输出的是 wyl
```

![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/10/20/16de9512eaf1158a~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

对象转为原始类型

- 如果[Symbol.toPrimitive](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive)方法，优先调用再返回

> valueOf 和 toString 的优先级随着转换类型的不同而不同

- [valueOf()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)，如果转换为原始类型，则返回
- toString()，如果转换为原始类型，则返回
- 如果都没有返回原始类型，会报错

```js
const a = {
    name: 'wyl',
    age: 20,
    [Symbol.toPrimitive](hint) {// hint 就是当前需要转化的类型
        if(hint === 'number') {// 如果当前需要转化的是 number
            return 10
        } else if(hint === 'string') { // 如果当前需要转化的是string
            return 'wyl'
        }
    },
    valueOf() {
        return 1
    },
    toString() {
        return '10'
    }
}

console.log(+a) // 10
console.log(String(a)) // wyl
```

针对上面的输出结果，我们可以看到 Symbol.toPrimitive 的优先级是最高的，无论是字符串还是数值，都会优先调用。而对于 valueOf 和 toString。

- 如果是转化为字符串的话，则优先调用 toString
- 如果是转化为数值的话，则优先调用 valueOf
- 具体的效果可以 通过把 Symbol.toPrimitive 注释掉看看



### 类型判断



#### [instanceof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/instanceof) 

> 判断一个变量是否是另一个变量的原型



#### [typeof](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/typeof) 

> 判断基础类型



#### [Object.prototype.toString](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString)

> 精确判断变量的类型

```js
// Boolean 类型，tag 为 "Boolean"
Object.prototype.toString.call(true);            // => "[object Boolean]"

// Number 类型，tag 为 "Number"
Object.prototype.toString.call(1);               // => "[object Boolean]"

// String 类型，tag 为 "String"
Object.prototype.toString.call("");              // => "[object String]"

// Array 类型，tag 为 "String"
Object.prototype.toString.call([]);              // => "[object Array]"

// Function 类型， tag 为 "Function"
Object.prototype.toString.call(function(){});    // => "[object Function]"

// Error 类型（包含子类型），tag 为 "Error"
Object.prototype.toString.call(new Error());     // => "[object Error]"

// RegExp 类型，tag 为 "RegExp"
Object.prototype.toString.call(/\d+/);           // => "[object RegExp]"

// Date 类型，tag 为 "Date"
Object.prototype.toString.call(new Date());      // => "[object Date]"

// 其他类型，tag 为 "Object"
Object.prototype.toString.call(new class {});    // => "[object Object]"
```

```js
// 总结一下我们可以抽取一个精确判断变量类型的方法
function toRawType(param) {
	return Object.prototype.toString.call(param).slice(8, -1)
}

console.log(toRawType([])) // Array
console.log(toRawType({})) // Object
```

fighting fighting !!!!
![](/cute.jpg)