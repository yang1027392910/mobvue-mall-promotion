<script setup lang="ts">
import { installSeoHead } from "@/composables/useSeo"
import { useKeepAliveStore } from "@/pinia/stores/keep-alive"
import Footer from "./components/Footer.vue"
import NavBar from "./components/NavBar.vue"
import Tabbar from "./components/Tabbar.vue"

const route = useRoute()

const keepAliveStore = useKeepAliveStore()

const pageScroller = ref<HTMLElement | null>(null)

installSeoHead()

const showNavBar = computed(() => route.meta.layout?.navBar?.showNavBar)

const showTabbar = computed(() => route.meta.layout?.tabbar?.showTabbar)

const showFooter = computed(() => route.meta.layout?.footer === true)

let viewportResetTimer: number | undefined

function isDesktopViewport() {
  return window.matchMedia("(min-width: 768px)").matches
}

function resetDocumentViewport() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
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
    // iOS Safari may keep the visual viewport offset used to reveal a focused
    // login input while the keyboard is closing. Blur before changing pages so
    // that offset cannot be carried into the home layout.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    window.clearTimeout(viewportResetTimer)
    resetDocumentViewport()
    await nextTick()
    pageScroller.value?.scrollTo({ top: 0, left: 0 })
    requestAnimationFrame(() => {
      resetDocumentViewport()
    })
    // The iOS keyboard dismissal animation finishes after the route has
    // rendered, so perform one final root-viewport reset after that animation.
    viewportResetTimer = window.setTimeout(resetDocumentViewport, 350)
  }
)

onMounted(() => {
  window.addEventListener("wheel", handleWindowWheel, { passive: false })
})

onBeforeUnmount(() => {
  window.clearTimeout(viewportResetTimer)
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
  height: 100dvh;
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
    height: 100dvh;
    max-height: 100vh;
    max-height: 100dvh;
    max-width: 500px;
  }
}
</style>
