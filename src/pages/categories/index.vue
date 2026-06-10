<script setup lang="ts">
import type { CategoryItem, RawCategoryItem } from "@@/apis/categories/type"
import { getCategoryListApi } from "@@/apis/categories"
import { useRouter } from "vue-router"

const router = useRouter()
const categoryList = ref<CategoryItem[]>([])
const loading = ref(false)
const errorText = ref("")

function normalizeCategory(item: RawCategoryItem): CategoryItem {
  return {
    id: Number(item.id ?? item.categoryId ?? 0),
    name: String(item.name ?? item.categoryName ?? ""),
    icon: item.icon || ""
  }
}

function getCategoryIcon(icon?: string) {
  if (!icon) return "apps-o"
  if (/^https?:\/\//.test(icon)) return icon
  return `http://localhost:3000${icon.startsWith("/") ? icon : `/${icon}`}`
}

async function getCategoryList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getCategoryListApi()
    categoryList.value = data.map(normalizeCategory).filter(item => item.id && item.name)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load categories"
  } finally {
    loading.value = false
  }
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

onMounted(() => {
  getCategoryList()
})
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

    <van-loading
      v-if="loading"
      class="categories-loading"
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
        @click="getCategoryList"
      >
        Retry
      </van-button>
    </van-empty>

    <van-empty
      v-else-if="!categoryList.length"
      description="No categories"
    />

    <div
      v-else
      class="category-grid"
    >
      <div
        v-for="item in categoryList"
        :key="item.id"
        class="category-item"
        @click="handleCategoryClick(item)"
      >
        <div class="category-icon">
          <van-icon :name="getCategoryIcon(item.icon)" />
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
