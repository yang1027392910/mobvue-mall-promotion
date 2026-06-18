<script setup lang="ts">
import type { RawFavoriteItem } from "@@/apis/favorite/type"
import type { ProductCardData } from "@/components/ProductCard/index.vue"
import { favoriteClickApi, getFavoriteListApi } from "@@/apis/favorite"
import { isLoggedIn } from "@@/utils/guest-access"
import { Icon } from "@iconify/vue"
import ProductCard from "@/components/ProductCard/index.vue"

const router = useRouter()
const loggedIn = computed(() => isLoggedIn())
const loading = ref(false)
const errorText = ref("")
const total = ref(0)
const products = ref<ProductCardData[]>([])

function toNumber(value: number | string | undefined, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function getFavoriteProduct(item: RawFavoriteItem) {
  return item.product || item
}

function normalizeProduct(item: RawFavoriteItem): ProductCardData {
  const product = getFavoriteProduct(item)

  return {
    id: toNumber(product.id ?? product.productId ?? item.productId),
    title: String(product.name ?? product.productName ?? product.title ?? ""),
    image: getAssetUrl(String(product.image ?? product.imageUrl ?? product.cover ?? "")),
    price: toNumber(product.phPrice ?? product.price),
    currency: "PHP",
    chinaCost: toNumber(product.chinaPrice),
    profitMargin: toNumber(product.profit),
    isFavorite: true
  }
}

async function getFavoriteList() {
  if (!loggedIn.value) return

  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getFavoriteListApi({
      page: 1,
      pageSize: 10
    })
    total.value = data.total
    products.value = data.list
      .map(normalizeProduct)
      .filter(item => item.id && item.title)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load favorites"
  } finally {
    loading.value = false
  }
}

function handleProductClick(product: ProductCardData) {
  router.push({
    path: "/product-card",
    query: {
      id: product.id
    }
  })
}

async function handleFavorite(product: ProductCardData) {
  await favoriteClickApi({
    productId: Number(product.id)
  })
  products.value = products.value.filter(item => item.id !== product.id)
  total.value = Math.max(total.value - 1, 0)
}

function handleLogin() {
  router.push("/login")
}

function handleBackHome() {
  router.push("/")
}

onMounted(() => {
  getFavoriteList()
})

watch(loggedIn, (value) => {
  if (value) getFavoriteList()
})
</script>

<template>
  <div class="favorites-page">
    <header class="favorites-topbar">
      <button class="back-home-button" type="button" aria-label="Back to home" @click="handleBackHome">
        <Icon icon="mingcute:left-line" />
      </button>
      <div class="favorites-topbar-title">
        Favorites
      </div>
    </header>

    <div v-if="!loggedIn" class="guest-guide">
      <van-icon class="guest-icon" name="star-o" />
      <div class="guest-title">
        Login to unlock this feature
      </div>
      <van-button class="guest-login-button" type="primary" round @click="handleLogin">
        Login
      </van-button>
    </div>

    <template v-else>
      <!-- <div class="favorites-header">
        <div class="favorites-count">
          {{ total }} items
        </div>
      </div> -->

      <van-loading
        v-if="loading"
        class="favorites-loading"
        color="#1677ff"
      />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button
          size="small"
          type="primary"
          @click="getFavoriteList"
        >
          Retry
        </van-button>
      </van-empty>

      <div v-else-if="products.length" class="favorites-grid">
        <ProductCard
          v-for="item in products"
          :key="item.id"
          :product="item"
          @click="handleProductClick"
          @favorite="handleFavorite"
        />
      </div>

      <van-empty v-else description="No favorites yet" />
    </template>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: calc(100vh - 56px);
  padding: 52px 14px 88px;
  background: #f7f9fc;
}

.favorites-topbar {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 20;
  width: 100%;
  max-width: 430px;
  height: 40px;
  display: grid;
  place-items: center;
  background: #ffffff;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.06);
  transform: translateX(-50%);
}

.back-home-button {
  position: absolute;
  left: 12px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 10px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  color: #111827;
  font-size: 22px;
  background: #ffffff;
}

.favorites-topbar-title {
  color: #111827;
  font-size: 16px;
  font-weight: 700;
}

.favorites-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
}

.favorites-title {
  color: #111827;
  font-size: 22px;
  font-weight: 700;
}

.favorites-count {
  color: #64748b;
  font-size: 13px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.favorites-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.guest-guide {
  min-height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
}

.guest-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #1677ff;
  font-size: 30px;
  background: #eef6ff;
}

.guest-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
}

.guest-login-button {
  min-width: 120px;
  height: 42px;
  font-weight: 700;
}
</style>
