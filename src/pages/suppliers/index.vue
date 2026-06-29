<script setup lang="ts">
import type { RawSupplierItem } from "@@/apis/supplier/type"
import { getSupplierListApi } from "@@/apis/supplier"
import { Icon } from "@iconify/vue"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

interface SupplierItem {
  id: number
  name: string
  location: string
  products: string
  tag: string
  image: string
  status: number
  sort: number
}

const router = useRouter()
const suppliers = ref<SupplierItem[]>([])
const loading = ref(false)
const errorText = ref("")

const visibleSuppliers = computed(() => {
  return suppliers.value
    .filter(item => item.status === 1)
    .sort((a, b) => a.sort - b.sort)
})

function getDataList(data: RawSupplierItem[] | {
  data?: RawSupplierItem[]
  list?: RawSupplierItem[]
  records?: RawSupplierItem[]
  rows?: RawSupplierItem[]
  items?: RawSupplierItem[]
}) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.list)) return data.list
  if (Array.isArray(data.records)) return data.records
  if (Array.isArray(data.rows)) return data.rows
  return Array.isArray(data.items) ? data.items : []
}

function getAssetUrl(url?: string) {
  if (!url) return ""
  if (/^https?:\/\//.test(url)) return url

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}

function normalizeSupplier(item: RawSupplierItem): SupplierItem {
  const mainProducts = item.mainProducts ?? item.main_products ?? ""

  return {
    id: Number(item.id),
    name: String(item.name || "Unnamed Supplier"),
    location: item.city ? `${item.city}, China` : "China",
    products: String(mainProducts || "General Products"),
    tag: item.moq ? `minOrder ${item.moq}` : "Verified",
    image: getAssetUrl(item.logo),
    status: Number(item.status ?? 0),
    sort: Number(item.sort ?? 0)
  }
}

async function getSupplierList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getSupplierListApi({
      page: 1,
      pageSize: 50
    })
    suppliers.value = getDataList(data).map(normalizeSupplier)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load suppliers"
  } finally {
    loading.value = false
  }
}

function handleSupplierClick(supplier: SupplierItem) {
  router.push({
    path: `/supplier-details/${supplier.id}`
  })
}

onMounted(() => {
  getSupplierList()
})
</script>

<template>
  <div class="suppliers-page">
    <main class="supplier-content">
      <section class="verified-note">
        <span>
          <Icon icon="solar:shield-check-bold" />
        </span>
        <p>All suppliers are verified by YiwuHub. Contact information is available for verified users.</p>
      </section>

      <van-loading
        v-if="loading"
        class="supplier-loading"
        color="#0b6bff"
      />

      <van-empty
        v-else-if="errorText"
        image="error"
        :description="errorText"
      >
        <van-button
          size="small"
          type="primary"
          color="#0b6bff"
          @click="getSupplierList"
        >
          Retry
        </van-button>
      </van-empty>

      <section v-else-if="visibleSuppliers.length" class="supplier-list">
        <article
          v-for="supplier in visibleSuppliers"
          :key="supplier.id"
          class="supplier-card"
          @click="handleSupplierClick(supplier)"
        >
          <img v-if="supplier.image" :src="supplier.image" :alt="supplier.name">
          <div v-else class="supplier-image-fallback">
            <Icon icon="solar:buildings-3-bold-duotone" />
          </div>

          <div class="supplier-card__body">
            <h2>{{ supplier.name }}</h2>
            <div class="location-row">
              <Icon icon="solar:map-point-bold-duotone" />
              <span>{{ supplier.location }}</span>
            </div>
            <p>Main Products</p>
            <strong>{{ supplier.products }}</strong>
            <div class="supplier-tags">
              <span class="verified-tag">
                <Icon icon="solar:shield-check-bold" />
                Verified supplier
              </span>
              <span class="blue-tag">{{ supplier.tag }}</span>
            </div>
          </div>

          <Icon class="card-arrow" icon="mingcute:right-line" />
        </article>
      </section>

      <van-empty v-else description="No suppliers found" />
    </main>
  </div>
</template>

<style scoped>
.suppliers-page {
  min-height: 100vh;
  max-width: 500px;
  margin: 0 auto;
  padding-bottom: 22px;
  color: #07152f;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f7fe 52%, #ffffff 100%);
}

.suppliers-page,
.suppliers-page * {
  box-sizing: border-box;
}

.supplier-content {
  padding: 0 10px 0;
}

.supplier-hero {
  position: relative;
  min-height: 112px;
  overflow: hidden;
  border-radius: 8px;
  padding: 21px 18px;
  background:
    radial-gradient(circle at 72% 20%, rgba(255, 255, 255, 0.9), transparent 28%),
    linear-gradient(135deg, #eaf4ff 0%, #d7e9ff 53%, #edf6ff 100%);
  box-shadow: 0 10px 22px rgba(42, 91, 160, 0.1);
}

.supplier-hero__copy {
  position: relative;
  z-index: 2;
  width: 58%;
}

.supplier-hero h1 {
  margin: 0;
  color: #0b1430;
  font-size: 16px;
  font-weight: 600;
  line-height: 28px;
}

.supplier-hero h1 span {
  color: #1267f4;
}

.supplier-hero p {
  margin: 10px 0 0;
  color: #33466a;
  font-size: 12.5px;
  font-weight: 700;
  line-height: 19px;
}

.supplier-hero__art {
  position: absolute;
  right: 15px;
  bottom: 0;
  width: 145px;
  height: 105px;
}

.warehouse {
  position: absolute;
  left: 0;
  bottom: 11px;
  color: #8ec8ff;
  font-size: 67px;
  filter: drop-shadow(0 10px 14px rgba(39, 103, 179, 0.16));
}

.container {
  position: absolute;
  right: 22px;
  bottom: 14px;
  width: 58px;
  height: 73px;
  border: 2px solid #0f58c7;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: linear-gradient(90deg, #0e57d8, #1676ff);
  box-shadow: 0 13px 22px rgba(11, 87, 206, 0.24);
}

.container span + span {
  border-left: 1px solid rgba(255, 255, 255, 0.26);
}

.box-stack {
  position: absolute;
  right: 0;
  bottom: 10px;
  width: 62px;
  height: 44px;
}

.box-stack i {
  position: absolute;
  width: 25px;
  height: 23px;
  border: 1px solid rgba(132, 83, 28, 0.2);
  border-radius: 2px;
  background: linear-gradient(135deg, #d99b55, #f2c68a);
  box-shadow: inset 0 7px rgba(255, 255, 255, 0.18);
}

.box-stack i:nth-child(1) {
  left: 0;
  bottom: 0;
}

.box-stack i:nth-child(2) {
  left: 20px;
  bottom: 0;
}

.box-stack i:nth-child(3) {
  left: 10px;
  bottom: 20px;
}

.verified-note {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 10px;
  align-items: center;
  margin-top: 8px;
  border: 1px solid #e5edf8;
  border-radius: 10px;
  padding: 10px 13px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 20px rgba(28, 70, 130, 0.06);
}

.verified-note span {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: linear-gradient(135deg, #176cff, #2d7cff);
  font-size: 22px;
}

.verified-note p {
  margin: 0;
  color: #10203f;
  font-size: 10.8px;
  font-weight: 800;
  line-height: 17px;
}

.supplier-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.supplier-loading {
  display: flex;
  justify-content: center;
  padding: 52px 0;
}

.supplier-card {
  position: relative;
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr) 18px;
  gap: 0;
  align-items: center;
  border: 1px solid #e8eef8;
  border-radius: 9px;
  padding: 9px 8px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(23, 54, 104, 0.06);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.supplier-card:active {
  transform: scale(0.985);
  box-shadow: 0 4px 12px rgba(23, 54, 104, 0.08);
}

.supplier-card img,
.supplier-image-fallback {
  width: 86px;
  height: 86px;
  border-radius: 6px;
  display: block;
  background: #edf3fb;
}

.supplier-card img {
  object-fit: cover;
}

.supplier-image-fallback {
  display: grid;
  place-items: center;
  color: #1267f4;
  font-size: 40px;
}

.supplier-card__body {
  min-width: 0;
  margin-left: 10px;
}

.supplier-card h2 {
  margin: 0 0 7px;
  overflow: hidden;
  color: #081733;
  font-size: 14.5px;
  font-weight: 900;
  line-height: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  color: #506080;
  font-size: 10.8px;
  font-weight: 700;
  line-height: 14px;
}

.location-row svg {
  width: 13px;
  height: 13px;
  flex: 0 0 auto;
  color: #52698f;
}

.location-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplier-card p {
  margin: 9px 0 1px;
  color: #53637f;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 12px;
}

.supplier-card strong {
  display: block;
  overflow: hidden;
  color: #101d39;
  font-size: 10.8px;
  font-weight: 900;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.supplier-tags {
  display: flex;
  min-width: 0;
  gap: 7px;
  flex-wrap: nowrap;
  justify-content: space-around;
  margin-top: 8px;
  overflow: hidden;
}

.supplier-tags span {
  min-width: 0;
  min-height: 20px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.verified-tag {
  flex: 0 0 auto;
  color: #06a75d;
  background: #eafbf1;
}

.verified-tag svg {
  width: 12px;
  height: 12px;
}

.blue-tag {
  flex: 1 1 auto;
  color: #075eff;
  background: #edf4ff;
}

.card-arrow {
  width: 18px;
  height: 18px;
  margin-left: 5px;
  color: #60708f;
}
</style>
