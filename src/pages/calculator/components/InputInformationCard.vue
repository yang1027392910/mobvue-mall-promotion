<script setup lang="ts">
import type { CalculatorInputRow } from "../types"
import { Icon } from "@iconify/vue"

defineProps<{
  rows: CalculatorInputRow[]
}>()

const emit = defineEmits<{
  updateStepper: [label: string, value: number]
  updateField: [label: string, value: string]
  calculate: []
}>()
</script>

<template>
  <section class="section-card input-card">
    <h2 class="section-title">
      Input Information
    </h2>

    <div class="input-list">
      <template
        v-for="item in rows"
        :key="item.label"
      >
        <div v-if="item.dividerBefore" class="input-divider" />
        <!-- <div v-if="item.sectionTitle" class="input-section-label">
          {{ item.sectionTitle }}
        </div> -->
        <div class="input-row" :class="{ 'input-row--locked': item.locked }">
          <label class="input-label">
            <span>{{ item.label }}</span>
            <Icon
              v-if="item.locked"
              class="label-lock-icon"
              icon="material-symbols:lock-outline"
            />
          </label>
          <div class="input-control">
            <template v-if="item.control === 'stepper'">
              <van-stepper
                class="quantity-stepper"
                :model-value="item.numericValue"
                :min="item.min || 1"
                integer
                button-size="28"
                input-width="54"
                @update:model-value="value => emit('updateStepper', item.label, Number(value))"
              />
            </template>
            <div
              v-else
              class="field-wrap"
              :class="{
                'field-wrap--locked': item.locked,
                'field-wrap--editable': item.editable,
                'field-wrap--product-info': item.locked,
              }"
            >
              <van-field
                class="value-field"
                :model-value="item.value"
                :placeholder="item.placeholder"
                :readonly="!item.editable"
                :input-align="item.locked ? 'left' : 'right'"
                @update:model-value="value => emit('updateField', item.label, String(value))"
              />
            </div>
            <span v-if="item.unit" class="input-unit">{{ item.unit }}</span>
          </div>
          <div v-if="item.helper" class="input-helper">
            {{ item.helper }}
          </div>
        </div>
      </template>
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

.input-list {
  margin-top: 16px;
}

.input-section-label {
  margin: 10px 0 4px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
}

.input-section-label:first-child {
  margin-top: 0;
}

.input-divider {
  height: 1px;
  margin: 12px 0 10px;
  background: #eef2f7;
}

.input-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.input-control {
  flex: 0 0 164px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.input-row--locked .input-control {
  flex-basis: 164px;
  justify-content: flex-end;
}

.input-row--locked {
  min-height: 40px;
}

.input-row--locked .field-wrap {
  height: 32px;
}

.input-row--locked .value-field :deep(.van-field__control) {
  height: 30px;
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

.field-wrap--locked {
  background: #f5f7fa;
  cursor: not-allowed;
}

.field-wrap--locked :deep(.van-field__control) {
  cursor: not-allowed;
}

.field-wrap--editable:focus-within {
  border-color: #2563ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 255, 0.08);
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

.label-lock-icon {
  flex: 0 0 auto;
  color: #9ca3af;
  font-size: 16px;
}

.quantity-stepper {
  flex: 1;
  min-width: 0;
}

.quantity-stepper :deep(.van-stepper__minus),
.quantity-stepper :deep(.van-stepper__plus),
.quantity-stepper :deep(.van-stepper__input) {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.quantity-stepper :deep(.van-stepper__minus) {
  border-radius: 10px 0 0 10px;
}

.quantity-stepper :deep(.van-stepper__plus) {
  border-radius: 0 10px 10px 0;
  color: #2563ff;
}

.quantity-stepper :deep(.van-stepper__input) {
  margin: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.input-helper {
  flex: 0 0 164px;
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
</style>
