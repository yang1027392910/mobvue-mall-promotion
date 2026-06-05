<script setup lang="ts">
import { computed, ref } from "vue"
import { getTrendingProducts } from "@/mock/prudect"

interface ProductItem {
  id: number
  name: string
  image: string
  score: string
  cost: string
  price: string
  profit: string
}

const activeTab = ref("today")
const searchValue = ref("")

const tabs = [
  { title: "Today", name: "today" },
  { title: "This Week", name: "week" },
  { title: "This Month", name: "month" },
  { title: "New Alerts", name: "alerts" }
]

const products: ProductItem[] = getTrendingProducts()

const filteredProducts = computed(() => {
  const keyword = searchValue.value.trim().toLowerCase()
  if (!keyword) {
    return products
  }
  return products.filter(item => item.name.toLowerCase().includes(keyword))
})
</script>

<template>
  <div class="page-home">
    <div class="home-header">
      <div class="home-title-row">
        <div class="home-title">
          Trending Products
        </div>
        <van-icon name="bell-o" class="home-icon" />
      </div>
      <van-search
        v-model:value="searchValue"
        placeholder="Search products or keywords"
        shape="round"
        background="#FFF"
        clearable
        class="home-search"
      />
    </div>

    <van-tabs
      v-model:active="activeTab"
      class="home-tabs"
      color="#1677ff"
      inactive-color="#9aa3b8"
      line-width="24"
      sticky
      swipeable
    >
      <van-tab
        v-for="tab in tabs"
        :title="tab.title"
        :name="tab.name"
        :key="tab.name"
      />
    </van-tabs>

    <div class="product-list">
      <div
        v-for="(item, index) in filteredProducts"
        :key="item.id"
        class="product-card"
      >
        <div class="product-card-left">
          <div class="product-image-wrap">
            <img class="product-image" :src="item.image" :alt="item.name">
            <span class="product-rank">#{{ index + 1 }}</span>
          </div>
        </div>
        <div class="product-card-right">
          <div class="product-name">
            {{ item.name }}
          </div>
          <div class="product-meta">
            <div class="meta-row">
              <span class="meta-label">TikTok Score</span>
              <span class="meta-value">{{ item.score }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">China Cost</span>
              <span class="meta-value">{{ item.cost }}</span>
            </div>
          </div>
          <div class="product-footer">
            <div class="product-footer-item">
              <span class="footer-label">PH Price</span>
              <span class="footer-value">{{ item.price }}</span>
            </div>
            <div class="product-footer-item">
              <span class="footer-label">Profit</span>
              <span class="footer-value profit">{{ item.profit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-home {
  min-height: calc(100vh - 56px);
  padding: 20px 20px 88px;
  background: #ffffff;
}
.home-header {
  margin-bottom: 16px;
}
.home-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.home-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}
.home-icon {
  color: #1677ff;
  font-size: 22px;
}
.home-search {
  width: 100%;
}
.home-tabs {
  margin-bottom: 16px;
}
.product-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.product-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.08);
  border: 1px solid #eef4ff;
}
.product-card-left {
  flex-shrink: 0;
}
.product-image-wrap {
  position: relative;
  width: 108px;
  height: 108px;
  border-radius: 20px;
  background: #f5f8ff;
  overflow: hidden;
}
.product-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-rank {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1677ff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}
.product-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.product-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 1.4;
}
.product-meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
  font-size: 13px;
}
.meta-label {
  color: #64748b;
}
.meta-value {
  color: #0f172a;
  font-weight: 700;
}
.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.product-footer-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.footer-label {
  color: #64748b;
  font-size: 12px;
}
.footer-value {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}
.profit {
  color: #1677ff;
}
</style>
