<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import productImage from "@/assets/profile/product.png"

const router = useRouter()

const isFavorite = ref(false)

const product = {
  name: "Foldable Storage Box with Lid",
  image: productImage,
  imageCount: "1/6",
  tiktokScore: 95,
  description: "Multi-functional storage box, foldable design, saves space, perfect for home organization.",
  chinaCost: "¥8.50",
  phPrice: "₱199",
  profit: "₱100+",
  profitMargin: "54%",
  params: [
    { icon: "cart-o", label: "MOQ", value: "50 pcs" },
    { icon: "logistics", label: "Weight", value: "850g" },
    { icon: "expand-o", label: "Size", value: "40*30*24 cm" },
    { icon: "send-gift-o", label: "Shipping", value: "Sea Freight / Air Freight" },
    { icon: "apps-o", label: "Category", value: "Home & Living / Storage" },
    { icon: "fire-o", label: "Trend", value: "🔥 Trending (Rising)" }
  ]
}

function handleBack() {
  router.back()
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value
}

function handleCalculateProfit() {
  router.push({
    path: "/calculator",
    query: {
      productName: product.name,
      phPrice: product.phPrice
    }
  })
}
</script>

<template>
  <div class="product-detail-page">
    <van-nav-bar
      title="Product Details"
      left-arrow
      fixed
      placeholder
      class="detail-nav"
      @click-left="handleBack"
    >
      <template #right>
        <button class="nav-icon-button" type="button" aria-label="Share">
          <van-icon name="share-o" />
        </button>
        <button class="nav-icon-button" type="button" aria-label="Favorite" @click="toggleFavorite">
          <van-icon :name="isFavorite ? 'like' : 'heart-o'" />
        </button>
      </template>
    </van-nav-bar>

    <main class="detail-content">
      <section class="image-section">
        <img class="product-image" :src="product.image" :alt="product.name">
        <div class="image-count">
          {{ product.imageCount }}
        </div>
      </section>

      <section class="basic-section">
        <h1 class="product-name">
          {{ product.name }}
        </h1>
        <div class="score-row">
          <van-icon name="fire-o" />
          <span>TikTok Score {{ product.tiktokScore }}</span>
        </div>
        <p class="product-description">
          {{ product.description }}
        </p>
      </section>

      <section class="profit-card">
        <div class="price-grid">
          <div class="price-item">
            <div class="price-label">
              China Cost
            </div>
            <div class="price-value cost">
              {{ product.chinaCost }}
            </div>
          </div>
          <div class="price-item">
            <div class="price-label">
              PH Price
            </div>
            <div class="price-value ph">
              {{ product.phPrice }}
            </div>
          </div>
          <div class="price-item">
            <div class="price-label">
              Profit
            </div>
            <div class="price-value profit">
              {{ product.profit }}
            </div>
          </div>
        </div>
        <div class="margin-row">
          <span>Profit Margin</span>
          <strong>{{ product.profitMargin }}</strong>
        </div>
      </section>

      <section class="params-card">
        <div
          v-for="item in product.params"
          :key="item.label"
          class="param-row"
        >
          <div class="param-left">
            <van-icon :name="item.icon" />
            <span>{{ item.label }}</span>
          </div>
          <div class="param-value">
            {{ item.value }}
          </div>
        </div>
      </section>
    </main>

    <div class="bottom-bar">
      <van-button
        class="bottom-button favorite-action"
        plain
        icon="heart-o"
        color="#2563eb"
        @click="toggleFavorite"
      >
        Add to Favorites
      </van-button>
      <van-button class="bottom-button calculate-action" type="primary" color="#2563eb" @click="handleCalculateProfit">
        Calculate Profit
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.product-detail-page {
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  background: #ffffff;
  color: #111827;
}

.detail-nav :deep(.van-nav-bar__title) {
  color: #111827;
  font-weight: 700;
}

.detail-nav :deep(.van-icon) {
  color: #111827;
}

.nav-icon-button {
  width: 30px;
  height: 30px;
  border: 0;
  background: transparent;
  color: #111827;
  font-size: 20px;
  display: inline-grid;
  place-items: center;
  padding: 0;
}

.detail-content {
  padding-bottom: 92px;
  background: #f7f9fc;
}

.image-section {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
}

.product-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-count {
  position: absolute;
  right: 14px;
  bottom: 14px;
  min-width: 44px;
  height: 26px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  display: grid;
  place-items: center;
  padding: 0 10px;
}

.basic-section,
.profit-card,
.params-card {
  margin: 12px 16px 0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.basic-section {
  padding: 16px;
}

.product-name {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.score-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  color: #ff5a1f;
  font-size: 14px;
  font-weight: 700;
}

.product-description {
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 21px;
}

.profit-card {
  padding: 16px;
}

.price-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.price-item {
  min-width: 0;
  text-align: center;
}

.price-label {
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
}

.price-value {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 800;
  line-height: 24px;
}

.price-value.cost {
  color: #ef4444;
}

.price-value.ph {
  color: #2563eb;
}

.price-value.profit {
  color: #16a34a;
}

.margin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
  color: #6b7280;
  font-size: 14px;
}

.margin-row strong {
  color: #16a34a;
  font-size: 18px;
}

.params-card {
  overflow: hidden;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid #eef2f7;
}

.param-row:last-child {
  border-bottom: 0;
}

.param-left {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.param-left .van-icon {
  color: #2563eb;
  font-size: 18px;
}

.param-value {
  min-width: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  text-align: right;
}

.bottom-bar {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 20;
  width: 100%;
  max-width: 430px;
  height: 64px;
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.08);
}

.bottom-button {
  height: 44px;
  border-radius: 12px;
  font-weight: 700;
}

.favorite-action {
  background: #ffffff;
}
</style>
