<script setup lang="ts">
import type { ProductCardData } from "@/components/ProductCard/index.vue"
import { isLoggedIn } from "@@/utils/guest-access"
import ProductCard from "@/components/ProductCard/index.vue"
import { getFavoriteProducts } from "@/mock/prudect"

const router = useRouter()
const loggedIn = computed(() => isLoggedIn())
const products: ProductCardData[] = getFavoriteProducts()

function handleProductClick(product: ProductCardData) {
  console.log("click product", product)
}

function handleFavorite(product: ProductCardData) {
  console.log("favorite product", product)
}

function handleLogin() {
  router.push("/login")
}
</script>

<template>
  <div class="favorites-page">
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
      <div class="favorites-header">
        <div class="favorites-title">
          Favorites
        </div>
        <div class="favorites-count">
          {{ products.length }} items
        </div>
      </div>

      <div class="favorites-grid">
        <ProductCard
          v-for="item in products"
          :key="item.id"
          :product="item"
          @click="handleProductClick"
          @favorite="handleFavorite"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.favorites-page {
  min-height: calc(100vh - 56px);
  padding: 18px 14px 88px;
  background: #f7f9fc;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
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
