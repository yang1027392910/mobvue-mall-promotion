<script setup lang="ts">
import ProductCard, { type ProductCardData } from "@/components/ProductCard/index.vue"
import { getFavoriteProducts } from "@/mock/prudect"

const products: ProductCardData[] = getFavoriteProducts()

function handleProductClick(product: ProductCardData) {
  console.log("click product", product)
}

function handleFavorite(product: ProductCardData) {
  console.log("favorite product", product)
}
</script>

<template>
  <div class="favorites-page">
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
</style>
