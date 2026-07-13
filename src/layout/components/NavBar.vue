<script setup lang="ts">
import { Icon } from "@iconify/vue"

const route = useRoute()

const router = useRouter()

const title = computed(() => {
  if (route.name === "ProductList" && route.query.categoryName) {
    return String(route.query.categoryName)
  }

  return route.meta.title
})

const showLeftArrow = computed(() => route.meta.layout?.navBar?.showLeftArrow)
const showRightShare = computed(() => route.meta.layout?.navBar?.showRightShare)
const showRightCustom = computed(() => route.meta.layout?.navBar?.showRightCustom)
const showRightSearch = computed(() => route.meta.layout?.navBar?.showRightSearch)
function onClickLeft() {
  if (window.history.state?.back)
    history.back()
  else
    router.replace("/")
}
function handleShare() {
  router.push("/invite-friends")
}
function handleCustom() {
  router.push("/procurement-support")
}
function handleSearch() {
  router.push("/search")
}
</script>

<template>
  <van-nav-bar
    class="app-navbar"
    :title="title"
    :left-arrow="showLeftArrow"
    fixed
    placeholder
    safe-area-inset-top
    @click-left="onClickLeft"
  >
    <template #right>
      <button v-if="showRightSearch" class="share-icon" type="button" aria-label="Search" @click="handleSearch">
        <Icon icon="basil:search-solid" />
      </button>
      <button v-if="showRightShare" class="share-icon" type="button" aria-label="Share supplier" @click="handleShare">
        <Icon icon="solar:share-bold" />
      </button>
      <button v-if="showRightCustom" class="share-icon" type="button" aria-label="Share supplier" @click="handleCustom">
        <Icon icon="mdi:customer-service" />
      </button>
    </template>
  </van-nav-bar>
</template>

<style scoped>
.share-icon {
  width: 32px;
  height: 32px;
  border: 0;
  display: grid;
  place-items: center;
  padding: 0;
  color: #1677ff;
  background: transparent;
  font-size: 22px;
}

@media (min-width: 768px) {
  :global(.app-navbar.van-nav-bar--fixed) {
    left: 50%;
    width: 500px;
    transform: translateX(-50%);
  }
}
</style>
