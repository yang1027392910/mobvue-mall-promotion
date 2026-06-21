<script setup lang="ts">
import { isLoggedIn } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import { computed } from "vue"

const router = useRouter()
const route = useRoute()

const iconMap: Record<string, { icon: string, activeIcon: string }> = {
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

function getTabbarTarget(path: string) {
  if (!isLoggedIn() && ["/favorites", "/profile"].includes(path)) {
    return "/login"
  }

  return path
}
</script>

<template>
  <van-tabbar
    class="app-tabbar"
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
      :to="getTabbarTarget(item.path)"
      replace
    >
      <template #icon>
        <Icon
          :icon="route.path === item.path ? item.activeIcon : item.icon"
          width="25"
          height="25"
        />
      </template>
      {{ item.title }}
    </van-tabbar-item>
  </van-tabbar>
</template>

<style scoped>
.app-tabbar {
  --van-tabbar-background: #ffffff;
  --van-tabbar-item-active-background: #ffffff;
  --van-tabbar-height: 56px;

  border-top: 1px solid #eef2f7;
  box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.04);
}

.app-tabbar :deep(.van-tabbar-item) {
  color: #8a9ab3;
  font-size: 11px;
  font-weight: 600;
}

.app-tabbar :deep(.van-tabbar-item--active) {
  color: #1677ff;
  font-weight: 700;
}

.app-tabbar :deep(.van-tabbar-item__icon) {
  margin-bottom: 3px;
}

.app-tabbar :deep(.van-tabbar-item__icon svg) {
  width: 25px;
  height: 25px;
}
</style>
