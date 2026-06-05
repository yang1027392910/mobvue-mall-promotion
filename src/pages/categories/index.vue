<script setup lang="ts">
import { useRouter } from "vue-router"
import { categoryList } from "@/mock/prudect"

interface CategoryItem {
  id: number
  name: string
  icon: string
}

const router = useRouter()

const iconMap: Record<string, string> = {
  "women-wear": "manager-o",
  "men-wear": "friends-o",
  shoes: "cart-o",
  bags: "bag-o",
  beauty: "flower-o",
  jewelry: "diamond-o",
  "kids-baby": "smile-o",
  "home-living": "wap-home-o",
  toys: "gift-o",
  stationery: "notes-o",
  electronics: "phone-o",
  sports: "fire-o",
  automotive: "logistics",
  "pet-supplies": "like-o",
  food: "shop-o",
  others: "apps-o"
}

function handleCategoryClick(category: CategoryItem) {
  router.push({
    path: "/product-list",
    query: {
      categoryId: category.id,
      categoryName: category.name
    }
  })
}
</script>

<template>
  <div class="categories-page">
    <div class="categories-header">
      <div class="categories-title">
        Categories
      </div>
      <div class="categories-subtitle">
        {{ categoryList.length }} product types
      </div>
    </div>

    <div class="category-grid">
      <div
        v-for="item in categoryList"
        :key="item.id"
        class="category-item"
        @click="handleCategoryClick(item)"
      >
        <div class="category-icon">
          <van-icon :name="iconMap[item.icon] || 'apps-o'" />
        </div>
        <div class="category-name">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  min-height: calc(100vh - 56px);
  padding: 18px 14px 88px;
  background: #f7f9fc;
}

.categories-header {
  margin-bottom: 16px;
}

.categories-title {
  color: #111827;
  font-size: 22px;
  font-weight: 700;
}

.categories-subtitle {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.category-item {
  min-width: 0;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  cursor: pointer;
}

.category-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #eef6ff;
  color: #1677ff;
  font-size: 22px;
  display: grid;
  place-items: center;
}

.category-name {
  width: 100%;
  margin-top: 10px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
