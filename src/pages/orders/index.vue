<script setup lang="ts">
import { formatOrderDate, formatOrderMoney, orderStatuses, orderTotal } from "@@/apis/orders/normalize"
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useOrdersStore } from "@/pinia/stores/orders"
import { useUserStore } from "@/pinia/stores/user"
import "./orders.css"

const router = useRouter()
const orders = useOrdersStore()
const user = useUserStore()
watch(() => user.token, () => {
  if (user.token) orders.fetchList()
}, { immediate: true })
const activeStatus = ref<typeof orderStatuses[number]>("All")
const filteredOrders = computed(() => orders.orders.filter(order => activeStatus.value === "All" || order.statusGroup === activeStatus.value))
</script>

<template>
  <div class="orders-page">
    <van-nav-bar title="My Orders" left-arrow @click-left="router.push('/profile')" />
    <main class="orders-container">
      <div class="order-filters" role="group" aria-label="Filter orders by status">
        <button v-for="status in orderStatuses" :key="status" class="order-filter" :class="{ active: activeStatus === status }" :aria-pressed="activeStatus === status" @click="activeStatus = status">
          {{ status }}
        </button>
      </div>
      <div v-if="orders.listLoading && !orders.orders.length" class="orders-container">
        <van-loading color="#0860ff">
          Loading your orders...
        </van-loading>
      </div>
      <van-empty v-else-if="orders.listError && !orders.orders.length" :description="orders.listError">
        <van-button type="primary" @click="orders.fetchList()">
          Retry
        </van-button>
      </van-empty>
      <div v-else-if="filteredOrders.length" class="order-list">
        <button v-for="order in filteredOrders" :key="order.id" class="order-panel order-list-card" @click="router.push({ path: '/order-details', query: { id: order.id } })">
          <div class="order-card-header">
            <strong>#{{ order.orderNo }}</strong><span class="order-status" :class="order.statusGroup.toLowerCase()">{{ order.status }}</span>
          </div>
          <time class="order-date" :datetime="order.createdAt">{{ formatOrderDate(order.createdAt) }}</time>
          <div class="order-preview">
            <div class="order-thumbnails">
              <div v-for="(image, index) in order.productImages.slice(0, 2)" :key="index" class="order-thumbnail">
                <van-image :src="image" alt="Product" fit="cover" width="100%" height="100%" />
              </div>
            </div>
            <span v-if="order.productImages.length > 2" class="order-thumbnail-count">+{{ order.productImages.length - 2 }}</span>
            <div class="order-preview-info">
              <span>{{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }}</span><strong>{{ formatOrderMoney(orderTotal(order)) }}</strong>
            </div>
            <van-icon class="order-chevron" name="arrow" />
          </div>
        </button>
      </div>
      <van-empty v-else description="No orders with this status yet" />
      <p v-if="orders.listError && orders.orders.length" role="alert">
        {{ orders.listError }}
      </p>
      <van-button v-if="orders.hasMore" block plain type="primary" :loading="orders.listLoading" @click="orders.fetchList(true)">
        Load more orders
      </van-button>
      <van-button v-else-if="orders.listError && orders.orders.length" block plain type="primary" @click="orders.fetchList()">
        Retry
      </van-button>
    </main>
  </div>
</template>
