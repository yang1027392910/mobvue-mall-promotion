<script setup lang="ts">
import type { RawLogisticsSupplierItem } from "@@/apis/logisticsSupplier/type"
import { getLogisticsSupplierListApi } from "@@/apis/logisticsSupplier"
import { Icon } from "@iconify/vue"
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"

type ShippingMethod = "Sea Freight" | "Air Freight"
type FilterValue = "All" | ShippingMethod

interface LogisticsSupplier {
  id: number
  name: string
  logo: string
  shippingMethod: ShippingMethod
  deliveryTime: string
  unitPrice: string
  pricingMethod: string
  sort: number
  status: number
}

interface InfoItem {
  icon: string
  label: string
  value: string
}

const router = useRouter()
const activeFilter = ref<FilterValue>("All")
const suppliers = ref<LogisticsSupplier[]>([])
const loading = ref(false)
const errorText = ref("")

const filters: FilterValue[] = ["All", "Sea Freight", "Air Freight"]

const visibleSuppliers = computed(() => {
  return suppliers.value
    .filter(item => item.status === 1)
    .filter(item => activeFilter.value === "All" || item.shippingMethod === activeFilter.value)
    .sort((a, b) => a.sort - b.sort)
})

function normalizeShippingMethod(value: string): ShippingMethod {
  if (value === "海运" || value.toLowerCase().includes("sea")) return "Sea Freight"
  return "Air Freight"
}

function getLogoUrl(logo: string) {
  if (!logo) return ""
  if (/^https?:\/\//.test(logo)) return logo

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || window.location.origin

  return `${imageBaseUrl.replace(/\/$/, "")}/${logo.replace(/^\//, "")}`
}

function normalizeSupplier(item: RawLogisticsSupplierItem): LogisticsSupplier {
  return {
    id: item.id,
    name: item.name,
    logo: getLogoUrl(item.logo),
    shippingMethod: normalizeShippingMethod(item.shippingMethod),
    deliveryTime: item.deliveryTime,
    unitPrice: String(item.unitPrice),
    pricingMethod: item.pricingMethod,
    sort: Number(item.sort) || 0,
    status: Number(item.status) || 0
  }
}

async function getLogisticsSupplierList() {
  loading.value = true
  errorText.value = ""

  try {
    const { data } = await getLogisticsSupplierListApi({
      page: 1,
      pageSize: 50
    })
    suppliers.value = data.list.map(normalizeSupplier)
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : "Failed to load logistics suppliers"
  } finally {
    loading.value = false
  }
}

function getInfoItems(item: LogisticsSupplier): InfoItem[] {
  return [
    {
      icon: "mdi:ferry",
      label: "Shipping Method",
      value: item.shippingMethod
    },
    {
      icon: "mdi:clock-time-four-outline",
      label: "Transit Time",
      value: item.deliveryTime
    },
    {
      icon: "mdi:tag-outline",
      label: "Unit Price",
      value: item.unitPrice
    },
    {
      icon: "mdi:scale-balance",
      label: "Pricing Method",
      value: item.pricingMethod
    }
  ]
}

function getLogoText(name: string) {
  return name
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function handleBack() {
  router.back()
}

onMounted(() => {
  getLogisticsSupplierList()
})
</script>

<template>
  <div class="logistics-page">
    <van-nav-bar
      class="logistics-nav"
      title="Logistics Suppliers"
      left-arrow
      fixed
      placeholder
      @click-left="handleBack"
    />

    <main class="logistics-content">
      <div class="filter-bar" aria-label="Shipping method filter">
        <button
          v-for="filter in filters"
          :key="filter"
          class="filter-button"
          :class="{ 'filter-button--active': activeFilter === filter }"
          type="button"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

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
          @click="getLogisticsSupplierList"
        >
          Retry
        </van-button>
      </van-empty>

      <section v-else-if="visibleSuppliers.length" class="supplier-list">
        <article
          v-for="supplier in visibleSuppliers"
          :key="supplier.id"
          class="supplier-card"
        >
          <header class="supplier-head">
            <div class="supplier-logo" aria-hidden="true">
              <img v-if="supplier.logo" :src="supplier.logo" :alt="supplier.name">
              <span v-else>{{ getLogoText(supplier.name) }}</span>
            </div>

            <div class="supplier-title">
              <h2>{{ supplier.name }}</h2>
              <!-- <span class="method-tag">{{ supplier.shippingMethod }}</span> -->
            </div>
          </header>

          <div class="supplier-metrics">
            <div
              v-for="info in getInfoItems(supplier)"
              :key="info.label"
              class="metric-item"
            >
              <Icon class="metric-icon" :icon="info.icon" />
              <!-- <div class="metric-label">
                {{ info.label }}
              </div> -->
              <div class="metric-value">
                {{ info.value }}
              </div>
            </div>
          </div>
        </article>
      </section>

      <van-empty v-else description="No logistics suppliers found" />
    </main>
  </div>
</template>

<style scoped>
.logistics-page {
  min-height: 100vh;
  max-width: 375px;
  margin: 0 auto;
  background: #f6f8fc;
  color: #071b3a;
}

.logistics-nav {
  --van-nav-bar-height: 50px;
  --van-nav-bar-background: #ffffff;
  --van-nav-bar-title-text-color: #071b3a;
  --van-nav-bar-title-font-size: 17px;
  --van-nav-bar-icon-color: #071b3a;
  --van-nav-bar-arrow-size: 21px;
  box-shadow: 0 1px 0 rgba(7, 27, 58, 0.08);
}

.logistics-nav :deep(.van-nav-bar__title) {
  font-weight: 700;
}

.logistics-content {
  min-height: calc(100vh - 56px);
  padding: 14px 0 28px;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0 15px 14px;
}

.filter-button {
  min-width: 0;
  height: 40px;
  border: 1px solid #e4eaf3;
  border-radius: 10px;
  background: #ffffff;
  color: #7a8699;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  box-shadow: 0 4px 10px rgba(20, 40, 80, 0.03);
}

.filter-button--active {
  border-color: transparent;
  background: linear-gradient(135deg, #0b6bff 0%, #42a5ff 100%);
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(11, 107, 255, 0.22);
}

.supplier-list {
  display: grid;
  gap: 8px;
  padding: 0 15px;
}

.supplier-loading {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.supplier-card {
  overflow: hidden;
  border-radius: 14px;
  background: #ffffff;
  padding: 5px;
  box-shadow: 0 6px 18px rgba(20, 40, 80, 0.08);
}

.supplier-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 5px 4px;
}

.supplier-logo {
  flex: 0 0 52px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 28% 24%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 34%),
    linear-gradient(145deg, #eaf3ff 0%, #d8e8ff 100%);
  color: #0b6bff;
  font-size: 15px;
  font-weight: 800;
}

.supplier-logo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.supplier-title {
  min-width: 0;
  flex: 1;
}

.supplier-title h2 {
  /* margin: 0 0 7px; */
  color: #071b3a;
  font-size: 14px;
  font-weight: 600;
  /* line-height: 22px; */
}

.method-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef6ff;
  color: #0b6bff;
  font-size: 12px;
  font-weight: 600;
}

.supplier-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid #edf1f7;
  background: linear-gradient(180deg, #fbfdff 0%, #ffffff 100%);
}

.metric-item {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 8px 4px;
  text-align: center;
}

.metric-item + .metric-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 18px;
  bottom: 18px;
  width: 1px;
  background: #eef2f8;
}

.metric-icon {
  width: 20px;
  height: 20px;
  margin-bottom: 7px;
  color: #0b6bff;
}

.metric-label {
  min-height: 28px;
  color: #7a8699;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
}

.metric-value {
  margin-top: 5px;
  max-width: 100%;
  color: #071b3a;
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
  overflow-wrap: anywhere;
}

.page-footer {
  padding: 24px 24px 0;
  text-align: center;
  color: #8a95a8;
}

.page-footer p {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.page-footer small {
  display: block;
  margin-top: 7px;
  font-size: 11px;
  line-height: 16px;
}

@media (min-width: 376px) {
  .logistics-page {
    box-shadow: 0 0 0 1px rgba(7, 27, 58, 0.04);
  }
}
</style>
