<script setup lang="ts">
import { Icon } from "@iconify/vue"

type ShippingMethod = "air" | "sea"
type BillingMethod = "weight" | "cbm"

const props = defineProps<{
  shippingMethod: ShippingMethod
  billingMethod: BillingMethod
  totalValue: string
  rateValue: string
}>()

const emit = defineEmits<{
  "update:shippingMethod": [value: ShippingMethod]
  "update:billingMethod": [value: BillingMethod]
  "update:totalValue": [value: string]
  "update:rateValue": [value: string]
  "calculate": []
}>()

const shippingOptions: Array<{ label: string, value: ShippingMethod }> = [
  { label: "Air Freight", value: "air" },
  { label: "Sea Freight", value: "sea" }
]

const billingOptions: Array<{ label: string, value: BillingMethod }> = [
  { label: "By Weight (KG)", value: "weight" },
  { label: "By Volume (CBM)", value: "cbm" }
]
</script>

<template>
  <section class="section-card input-card">
    <!-- <h2 class="section-title">
      Input Information
    </h2> -->

    <div class="option-group">
      <span class="option-label">Shipping Method</span>
      <div class="option-buttons">
        <button
          v-for="option in shippingOptions"
          :key="option.value"
          class="option-button"
          :class="{ 'option-button--active': props.shippingMethod === option.value }"
          type="button"
          @click="emit('update:shippingMethod', option.value)"
        >
          <span>{{ option.label }}</span>
          <Icon
            v-if="props.shippingMethod === option.value"
            class="option-check"
            icon="material-symbols:check-circle-rounded"
          />
        </button>
      </div>
    </div>

    <div v-if="props.shippingMethod === 'sea'" class="option-group">
      <span class="option-label">Billing Method</span>
      <div class="option-buttons">
        <button
          v-for="option in billingOptions"
          :key="option.value"
          class="option-button"
          :class="{ 'option-button--active': props.billingMethod === option.value }"
          type="button"
          @click="emit('update:billingMethod', option.value)"
        >
          <span>{{ option.label }}</span>
          <Icon
            v-if="props.billingMethod === option.value"
            class="option-check"
            icon="material-symbols:check-circle-rounded"
          />
        </button>
      </div>
    </div>

    <div v-if="props.shippingMethod === 'air'" class="info-strip">
      Air freight is generally calculated by actual weight.
    </div>

    <div class="input-list">
      <div class="input-row">
        <label class="input-label">
          {{ props.shippingMethod === "sea" && props.billingMethod === "cbm" ? "Total Volume (CBM)" : "Total Weight" }}
        </label>
        <div class="input-control">
          <div class="field-wrap field-wrap--editable">
            <van-field
              class="value-field"
              :model-value="props.totalValue"
              :placeholder="props.shippingMethod === 'sea' && props.billingMethod === 'cbm' ? 'Enter CBM' : 'Enter Weight'"
              input-align="right"
              @update:model-value="value => emit('update:totalValue', String(value))"
            />
          </div>
          <span class="input-unit">
            {{ props.shippingMethod === "sea" && props.billingMethod === "cbm" ? "CBM" : "KG" }}
          </span>
        </div>
      </div>

      <div class="input-row">
        <label class="input-label">Shipping Rate</label>
        <div class="input-control">
          <div class="field-wrap field-wrap--editable">
            <van-field
              class="value-field"
              :model-value="props.rateValue"
              input-align="right"
              @update:model-value="value => emit('update:rateValue', String(value))"
            />
          </div>
          <span class="input-unit">
            {{ props.shippingMethod === "sea" && props.billingMethod === "cbm" ? "PHP/CBM" : "PHP/KG" }}
          </span>
        </div>
        <div class="input-helper">
          Market rate, editable
        </div>
      </div>
    </div>

    <van-button class="calculate-button" block @click="emit('calculate')">
      Calculate
    </van-button>
  </section>
</template>

<style scoped>
.section-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
}

.input-card {
  padding: 10px 12px 10px;
}

.section-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 800;
  line-height: 24px;
  font-size: 14px;
}

/* .option-group {
  margin-top: 10px;
} */

.option-label {
  display: block;
  margin-bottom: 10px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
}

.option-buttons {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.option-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 28px 0 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #8a93a3;
  font-size: 13px;
  font-weight: 800;
}

.option-button--active {
  border-color: #246bfe;
  background: #eef5ff;
  color: #246bfe;
}

.option-check {
  position: absolute;
  right: 9px;
  color: #246bfe;
  font-size: 18px;
}

.info-strip {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #eef5ff;
  color: #246bfe;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.input-list {
  margin-top: 14px;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  min-height: 50px;
  gap: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.input-row:last-child {
  border-bottom: 0;
}

.input-label {
  flex: 1;
  min-width: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
}

.input-control {
  flex: 0 0 184px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.field-wrap {
  flex: 1;
  min-width: 0;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.field-wrap--editable:focus-within {
  border-color: #246bfe;
  box-shadow: 0 0 0 3px rgba(36, 107, 254, 0.08);
}

.value-field {
  flex: 1;
  min-width: 0;
  padding: 0;
  background: transparent;
}

.value-field :deep(.van-cell) {
  padding: 0;
  background: transparent;
}

.value-field :deep(.van-field__control) {
  height: 30px;
  color: #111827;
  font-size: 15px;
  font-weight: 700;
  padding: 0 10px;
}

.value-field :deep(.van-field__control::placeholder) {
  color: #a3aab6;
  font-weight: 600;
}

.input-unit {
  flex: 0 0 auto;
  color: #8a93a3;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  white-space: nowrap;
}

.input-helper {
  flex: 0 0 184px;
  margin-left: auto;
  margin-top: -6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  text-align: right;
  white-space: nowrap;
}

.calculate-button {
  height: 35px;
  margin-top: 12px;
  border: 0;
  border-radius: 12px;
  background: #2563ff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 12px 24px rgba(37, 99, 255, 0.24);
}

@media (max-width: 360px) {
  .input-control,
  .input-helper {
    flex-basis: 170px;
  }

  .option-button {
    font-size: 12px;
  }
}
</style>
