<script setup lang="ts">
import type { CategoryItem, RawCategoryItem } from "@@/apis/categories/type"
import { getCategoryListApi } from "@@/apis/categories"
import { Icon } from "@iconify/vue"
import { useRouter } from "vue-router"
import bcRightImage from "@/assets/categories/bc-r.png"

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

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${icon.replace(/^\//, "")}`
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

function handleBackHome() {
  router.push("/")
}

onMounted(() => {
  getCategoryList()
})
</script>

<template>
  <div class="categories-page">
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
        <div class="category-content">
          <div class="category-name">
            {{ item.name }}
          </div>
        </div>
        <span class="category-arrow">
          <van-icon name="arrow" />
        </span>
      </div>
    </div>

    <section v-if="!loading && !errorText" class="trusted-card">
      <div class="trusted-icon">
        <van-icon name="shield-o" />
      </div>
      <div class="trusted-content">
        <h2>Trusted Suppliers</h2>
        <p>All categories are sourced from verified suppliers in China.</p>
      </div>
      <van-icon class="trusted-bg-icon" name="shield-o" />
    </section>
  </div>
</template>

<style scoped>
.categories-page {
  /* min-height: 100vh; */
  padding: 0 0 96px;
  background: #f6f8fc;
}

.categories-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  background: #f6f8fc;
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
  color: #071b3a;
  font-size: 22px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(20, 40, 80, 0.08);
}

.categories-topbar-title {
  color: #071b3a;
  font-size: 16px;
  font-weight: 700;
  line-height: 40px;
}

.categories-header {
  position: relative;
  /* min-height: 150px; */
  padding: 20px 15px 0;
  overflow: hidden;
}

.categories-heading-copy {
  position: relative;
  z-index: 1;
  max-width: 245px;
}

.categories-heading-copy h1 {
  padding: 12x 0 1px;
  margin: 0;
  color: #071b3a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.15;
}

.categories-heading-copy p {
  margin: 8px 0 0;
  color: #6b7890;
  font-size: 15px;
  line-height: 21px;
}

.categories-hero-image {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 0;
  width: 128px;
  height: 128px;
  object-fit: contain;
  pointer-events: none;
}

.category-stat-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  margin: 12px 15px 0;
  /* padding: 0 10px; */
  border-radius: 18px;
  /* background: #ffffff; */
  color: #071b3a;
  font-size: 16px;
  font-weight: 700;
  /* box-shadow: 0 8px 24px rgba(20, 40, 80, 0.06); */
}

.category-stat-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #ffffff;
  font-size: 20px;
  background: linear-gradient(135deg, #0b6bff, #3d8bff);
}

.categories-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 10px 10px 0;
}

.category-item {
  position: relative;
  min-width: 0;
  height: 60px;
  display: flex;
  align-items: center;
  overflow: hidden;
  border-radius: 18px;
  background: #ffffff;
  padding: 0 5px;
  box-shadow: 0 8px 24px rgba(20, 40, 80, 0.07);
  cursor: pointer;
}

.category-icon {
  /* flex: 0 0 56px; */
  width: 40px;
  height: 75px;
  border-radius: 16px;
  /* background: #eef6ff; */
  color: #0b6bff;
  font-size: 16px;
  display: grid;
  place-items: center;
}

.category-icon :deep(.van-icon__image) {
  width: 38px;
  height: 38px;
  /* object-fit: contain; */
}

.category-content {
  min-width: 0;
  flex: 1;
  margin-left: 12px;
  padding-right: 24px;
}

.category-name {
  color: #071b3a;
  font-size: 15px;
  font-weight: 600;
  /* line-height: 22px; */
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.category-count {
  margin-top: 4px;
  color: #7a8699;
  font-size: 13px;
  line-height: 18px;
}

.category-arrow {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #8a96aa;
  font-size: 16px;
  /* background: #f2f6fc; */
  transform: translateY(-50%);
}

.category-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  line-height: 14px;
}

.category-tag--hot {
  background: #fff0e8;
  color: #ff6b00;
}

.category-tag--trending {
  background: #eaf8f0;
  color: #16a05d;
}

.trusted-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 12px;
  padding: 10px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, #eaf3ff 0%, #f7fbff 100%);
  box-shadow: 0 8px 24px rgba(20, 40, 80, 0.06);
}

.trusted-icon {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #0b6bff;
  font-size: 24px;
  background: #ffffff;
}

.trusted-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.trusted-content h2 {
  margin: 0;
  color: #071b3a;
  font-size: 14px;
  font-weight: 600;
  /* line-height: 21px; */
}

.trusted-content p {
  margin: 4px 0 0;
  color: #6b7890;
  font-size: 13px;
  line-height: 19px;
}

.trusted-bg-icon {
  position: absolute;
  right: 10px;
  bottom: -18px;
  color: rgba(11, 107, 255, 0.08);
  font-size: 92px;
}

@media (max-width: 360px) {
  .category-grid {
    margin-right: 15px;
    margin-left: 15px;
  }

  .category-item {
    padding: 12px;
  }

  .category-icon {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }

  .category-name {
    font-size: 15px;
  }
}
</style>
