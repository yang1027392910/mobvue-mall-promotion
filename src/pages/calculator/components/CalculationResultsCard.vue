<script setup lang="ts">
import type { CalculatorResultRow } from "../types"
import { Icon } from "@iconify/vue"
import AnimatedNumber from "./AnimatedNumber.vue"

withDefaults(defineProps<{
  rows: CalculatorResultRow[]
  summaryRows: CalculatorResultRow[]
  footerNote?: string
  showLogisticsEntry?: boolean
}>(), {
  footerNote: "",
  showLogisticsEntry: false
})

const emit = defineEmits<{
  logisticsSuppliers: []
}>()
</script>

<template>
  <section class="section-card result-card">
    <h2 class="section-title">
      Calculation Results
    </h2>

    <div class="result-list">
      <div
        v-for="item in rows"
        :key="item.label"
        class="result-row"
      >
        <span class="result-label">
          {{ item.label }}
          <small v-if="item.note">{{ item.note }}</small>
        </span>
        <strong class="result-value">
          <AnimatedNumber
            v-if="item.numericValue !== undefined"
            :value="item.numericValue"
            :prefix="item.prefix"
            :suffix="item.suffix"
            :decimals="item.decimals"
          />
          <template v-else>
            {{ item.value }}
          </template>
        </strong>
      </div>
    </div>

    <div class="result-divider" />

    <div class="result-list result-list--summary">
      <div
        v-for="item in summaryRows"
        :key="item.label"
        class="result-row"
      >
        <span class="result-label">
          {{ item.label }}
          <small v-if="item.note">{{ item.note }}</small>
        </span>
        <strong class="result-value" :class="item.tone ? `result-value--${item.tone}` : ''">
          <AnimatedNumber
            v-if="item.numericValue !== undefined"
            :value="item.numericValue"
            :prefix="item.prefix"
            :suffix="item.suffix"
            :decimals="item.decimals"
          />
          <template v-else>
            {{ item.value }}
          </template>
        </strong>
      </div>
    </div>

    <div v-if="footerNote" class="result-note">
      {{ footerNote }}
    </div>

    <button
      v-if="showLogisticsEntry"
      class="logistics-entry"
      type="button"
      @click="emit('logisticsSuppliers')"
    >
      <span class="logistics-copy">
        <strong>View Logistics Suppliers</strong>
        <small>Find freight forwarders and get a better deal</small>
      </span>
      <Icon class="logistics-arrow" icon="material-symbols:chevron-right-rounded" />
    </button>
  </section>
</template>

<style scoped>
.section-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.result-card {
  margin-top: 5px;
  padding: 5px 12px;
}

.section-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  line-height: 24px;
  font-size: 14px;
}

.result-list {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.result-list--summary {
  margin-top: 16px;
}

.result-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.result-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.result-label small {
  display: block;
  margin-top: 3px;
  color: #a3aab6;
  font-size: 12px;
  font-weight: 600;
  line-height: 17px;
}

.result-value {
  color: #111827;
  font-size: 16px;
  font-weight: 800;
  line-height: 22px;
  text-align: right;
}

.result-value--primary {
  color: #2563ff;
}

.result-value--success {
  color: #16a34a;
}

.result-value--warning {
  color: #f59e0b;
}

.result-divider {
  height: 1px;
  margin-top: 18px;
  background: #edf0f4;
}

.result-note {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f6f8fb;
  color: #8a93a3;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.logistics-entry {
  width: 100%;
  min-height: 58px;
  margin-top: 14px;
  padding: 10px 12px 10px 14px;
  border: 1px solid #e5edff;
  border-radius: 12px;
  background: #f8fbff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  text-align: left;
}

.logistics-copy {
  min-width: 0;
}

.logistics-copy strong {
  display: block;
  color: #246bfe;
  font-size: 14px;
  font-weight: 800;
  line-height: 20px;
}

.logistics-copy small {
  display: block;
  margin-top: 2px;
  color: #8a93a3;
  font-size: 12px;
  font-weight: 600;
  line-height: 17px;
}

.logistics-arrow {
  flex: 0 0 auto;
  color: #246bfe;
  font-size: 24px;
}
</style>
