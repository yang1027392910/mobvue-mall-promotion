<script setup lang="ts">
import { useKeepAliveStore } from "@/pinia/stores/keep-alive"
import Footer from "./components/Footer.vue"
import NavBar from "./components/NavBar.vue"
import Tabbar from "./components/Tabbar.vue"

const route = useRoute()

const keepAliveStore = useKeepAliveStore()

const pageScroller = ref<HTMLElement | null>(null)

const showNavBar = computed(() => route.meta.layout?.navBar?.showNavBar)

const showTabbar = computed(() => route.meta.layout?.tabbar?.showTabbar)

const showFooter = computed(() => route.meta.layout?.footer === true)

function isDesktopViewport() {
  return window.matchMedia("(min-width: 768px)").matches
}

function handleWindowWheel(event: WheelEvent) {
  const scroller = pageScroller.value
  if (!scroller || !isDesktopViewport()) return

  if (scroller.scrollHeight <= scroller.clientHeight) return

  event.preventDefault()
  scroller.scrollBy({
    top: event.deltaY,
    left: event.deltaX,
    behavior: "auto"
  })
}

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    pageScroller.value?.scrollTo({ top: 0, left: 0 })
    window.scrollTo({ top: 0, left: 0 })
  }
)

onMounted(() => {
  window.addEventListener("wheel", handleWindowWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.removeEventListener("wheel", handleWindowWheel)
})
</script>

<template>
  <div class="app-layout" un-h-full un-flex un-flex-col>
    <NavBar v-if="showNavBar" />
    <div ref="pageScroller" class="page-scroller" un-flex-1 un-overflow-y-auto un-overflow-x-hidden>
      <!-- key 采用 route.path 和 route.fullPath 有着不同的效果，大多数时候 path 更通用 -->
      <router-view v-slot="{ Component }">
        <keep-alive :include="keepAliveStore.cachedRoutes">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </router-view>
      <Footer v-if="showFooter" />
    </div>
    <Tabbar v-if="showTabbar" />
  </div>
</template>

<style scoped>
.app-layout {
  height: 100%;
  min-height: 0;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
  background: var(--mobvue-body-bg-color);
}

.page-scroller {
  height: 0;
  min-height: 0;
  overscroll-behavior: contain;
}

@media (min-width: 768px) {
  .app-layout {
    height: 100vh;
    max-height: 100vh;
    max-width: 500px;
  }
}
</style>
