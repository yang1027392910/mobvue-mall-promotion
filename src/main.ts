/* eslint-disable perfectionist/sort-imports */

// core
import { pinia } from "@/pinia"
import { router } from "@/router"
import { installPlugins } from "@/plugins"
import { preventDoubleTapZoom } from "@@/utils/prevent-double-tap-zoom"
import App from "@/App.vue"
import { Toast } from "vant"
// vant
import "@vant/touch-emulator"
import "vant/es/toast/style/index"
// css
import "normalize.css"
import "nprogress/nprogress.css"
import "@@/assets/styles/index.css"
import "virtual:uno.css"

// 创建应用实例
const app = createApp(App)

preventDoubleTapZoom()

// 安装插件（全局组件、自定义指令等）
installPlugins(app)

// 安装 pinia 和 router
app.use(pinia).use(router).use(Toast)

// router 准备就绪后挂载应用
router.isReady().then(() => {
  app.mount("#app")
})
