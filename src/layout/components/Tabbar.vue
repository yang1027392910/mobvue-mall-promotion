<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { computed } from "vue"

const router = useRouter()
const route = useRoute()

const iconMap = {
  "home-o": {
    icon: "mdi:home-outline",
    activeIcon: "mdi:home"
  },
  "apps-o": {
    icon: "mdi:apps-box",
    activeIcon: "mdi:apps-box"
  },
  "calculator-o": {
    icon: "mdi:calculator-variant",
    activeIcon: "mdi:calculator-variant"
  },
  "star-o": {
    icon: "mdi:star-outline",
    activeIcon: "mdi:star"
  },
  "user-o": {
    icon: "mdi:account-circle-outline",
    activeIcon: "mdi:account-circle"
  }
}

const tabbarRoutes = computed(() => {
  const routes = router.getRoutes()
  return routes
    .filter(route => route.meta.layout?.tabbar?.showTabbar)
    .map((route) => {
      const iconKey = route.meta.layout?.tabbar?.icon as string
      const mapped = iconMap[iconKey] ?? {
        icon: iconKey,
        activeIcon: iconKey
      }

      return {
        title: route.meta.title,
        path: route.path,
        icon: mapped.icon,
        activeIcon: mapped.activeIcon
      }
    })
})
</script>

<template>
  <van-tabbar
    route
    fixed
    placeholder
    safe-area-inset-bottom
    active-color="#1677ff"
    inactive-color="#9aa3b8"
  >
    <van-tabbar-item
      v-for="item in tabbarRoutes"
      :key="item.path"
      :to="item.path"
      replace
    >
      <template #icon>
        <Icon
          :icon="route.path === item.path ? item.activeIcon : item.icon"
          width="22"
        />
      </template>
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>
