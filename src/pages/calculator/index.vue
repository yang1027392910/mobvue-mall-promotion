<script setup lang="ts">
import type { CalculatorInputRow, CalculatorResultRow, CalculatorTab, CalculatorTabOption } from "./types"
import { Icon } from "@iconify/vue"
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import BottomActions from "./components/BottomActions.vue"
import CalculationResultsCard from "./components/CalculationResultsCard.vue"
import InputInformationCard from "./components/InputInformationCard.vue"
import ModeTabs from "./components/ModeTabs.vue"
import WeightShippingInputCard from "./components/WeightShippingInputCard.vue"

type ShippingMethod = "air" | "sea"
type BillingMethod = "weight" | "cbm"

interface CalculatorViewData {
  inputs: CalculatorInputRow[]
  results: CalculatorResultRow[]
  summaries: CalculatorResultRow[]
}

interface CalculationResult {
  productCost: number
  shippingCost: number
  otherFees: number
  salesAmount: number
  totalCost: number
  estimatedProfit: number
  profitMargin: number
}

const route = useRoute()
const router = useRouter()

const isProfileWeightOnly = computed(() => route.query.from === "profile")
const activeTab = ref<CalculatorTab>(isProfileWeightOnly.value || route.query.mode === "weight" ? "weight" : "product")
const productName = ref(String(route.query.productName || "Product"))
const moq = ref(Number(route.query.moq || route.query.quantity || 10))
const quantity = ref(Math.max(Number(route.query.quantity || moq.value), moq.value))
const unitCost = ref(String(route.query.unitCost || "3000"))
const sellingPrice = ref(String(route.query.sellingPrice || "60000"))
const shippingCost = ref(String(route.query.shippingCost || "15000"))
const otherFees = ref(String(route.query.otherFees || "500"))
const shippingMethod = ref<ShippingMethod>("sea")
const billingMethod = ref<BillingMethod>("weight")
const shippingMeasureValue = ref("")
const seaWeightRate = ref("150")
const seaCbmRate = ref("7000")
const airRate = ref("500")
const staticShippingCost = ref(0)

const result = ref<CalculationResult>({
  productCost: 0,
  shippingCost: 0,
  otherFees: 0,
  salesAmount: 0,
  totalCost: 0,
  estimatedProfit: 0,
  profitMargin: 0
})

const tabs: CalculatorTabOption[] = [
  { label: "By Product", value: "product" },
  { label: "By Weight", value: "weight" }
]

const calculatorData: Record<CalculatorTab, CalculatorViewData> = {
  product: {
    inputs: [
      { label: "Product Name", value: "Product", unit: "", locked: true, sectionTitle: "Product Information" },
      { label: "MOQ", value: "10 pcs", unit: "", locked: true },
      { label: "Unit Cost", value: "3000", unit: "PHP", locked: true },
      { label: "Quantity", control: "stepper", numericValue: 10, min: 10, unit: "pcs", helper: "MOQ: 10 pcs", sectionTitle: "Calculation Settings", dividerBefore: true },
      { label: "Selling Price", value: "60000", unit: "PHP" },
      { label: "Shipping Cost", value: "15000", unit: "PHP" },
      { label: "Other Fees", value: "500", unit: "PHP" }
    ],
    results: [
      { label: "Product Cost", numericValue: 0, prefix: "₱", decimals: 2, note: "Unit Cost × Quantity" },
      { label: "Shipping Cost", numericValue: 0, prefix: "₱", decimals: 2 },
      { label: "Other Fees", numericValue: 0, prefix: "₱", decimals: 2 }
    ],
    summaries: [
      { label: "Total Cost", numericValue: 0, prefix: "₱", decimals: 2, note: "Product Cost + Shipping Cost + Other Fees", tone: "primary" },
      { label: "Sales Amount", numericValue: 0, prefix: "₱", decimals: 2, tone: "success" },
      { label: "Estimated Profit", numericValue: 0, prefix: "₱", decimals: 2, tone: "success" },
      { label: "Profit Margin", numericValue: 0, suffix: "%", decimals: 2, tone: "warning" }
    ]
  },
  weight: {
    inputs: [
      { label: "Total Weight", placeholder: "Enter Weight", unit: "KG" },
      { label: "Shipping Rate", placeholder: "Enter Shipping Rate", unit: "PHP/KG" },
      { label: "Product Value", placeholder: "Enter Product Value", unit: "CNY" },
      { label: "Exchange Rate", placeholder: "8.00", unit: "PHP", helper: "1 CNY = 8 PHP" },
      { label: "Other Fees", placeholder: "Enter Other Fees", unit: "PHP" }
    ],
    results: [
      { label: "Product Cost", numericValue: 24000, prefix: "₱", decimals: 2, note: "¥3000 × 8" },
      { label: "Shipping Cost", numericValue: 15000, prefix: "₱", decimals: 2, note: "100 × 150" },
      { label: "Other Fees", numericValue: 500, prefix: "₱", decimals: 2 }
    ],
    summaries: [
      { label: "Total Cost", numericValue: 39500, prefix: "₱", decimals: 2, tone: "primary" },
      { label: "Estimated Profit", numericValue: 20500, prefix: "₱", decimals: 2, tone: "success" },
      { label: "Profit Margin", numericValue: 34.17, suffix: "%", decimals: 2, tone: "warning" }
    ]
  }
}

const currentData = computed(() => {
  if (activeTab.value !== "product") return calculatorData.weight

  return {
    ...calculatorData.product,
    inputs: calculatorData.product.inputs.map((item) => {
      switch (item.label) {
        case "Product Name":
          return { ...item, value: productName.value, locked: true }
        case "MOQ":
          return { ...item, value: `${moq.value} pcs`, locked: true }
        case "Unit Cost":
          return { ...item, value: unitCost.value, locked: true }
        case "Quantity":
          return { ...item, numericValue: quantity.value, min: moq.value, helper: `MOQ: ${moq.value} pcs` }
        case "Selling Price":
          return { ...item, value: sellingPrice.value, editable: true }
        case "Shipping Cost":
          return { ...item, value: shippingCost.value, editable: true }
        case "Other Fees":
          return { ...item, value: otherFees.value, editable: true }
        default:
          return item
      }
    }),
    results: calculatorData.product.results.map((item) => {
      switch (item.label) {
        case "Product Cost":
          return { ...item, numericValue: result.value.productCost }
        case "Shipping Cost":
          return { ...item, numericValue: result.value.shippingCost }
        case "Other Fees":
          return { ...item, numericValue: result.value.otherFees }
        default:
          return item
      }
    }),
    summaries: calculatorData.product.summaries.map((item) => {
      switch (item.label) {
        case "Total Cost":
          return { ...item, numericValue: result.value.totalCost }
        case "Sales Amount":
          return { ...item, numericValue: result.value.salesAmount }
        case "Estimated Profit":
          return { ...item, numericValue: result.value.estimatedProfit }
        case "Profit Margin":
          return { ...item, numericValue: result.value.profitMargin }
        default:
          return item
      }
    })
  }
})

const currentShippingRate = computed(() => {
  if (shippingMethod.value === "air") return airRate.value
  return billingMethod.value === "cbm" ? seaCbmRate.value : seaWeightRate.value
})

const shippingFormulaNote = computed(() => {
  if (shippingMethod.value === "sea" && billingMethod.value === "cbm") return "Volume × Rate"
  return "Weight × Rate"
})

const shippingResultRows = computed<CalculatorResultRow[]>(() => [
  {
    label: "Shipping Cost",
    numericValue: staticShippingCost.value,
    prefix: "PHP ",
    decimals: 2,
    note: shippingFormulaNote.value
  }
])

const shippingSummaryRows = computed<CalculatorResultRow[]>(() => [
  {
    label: "Total Shipping Cost",
    numericValue: staticShippingCost.value,
    prefix: "PHP ",
    decimals: 2,
    tone: "primary"
  }
])

function toNumber(value: number | string | undefined) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function calculateProfit() {
  quantity.value = Math.max(toNumber(quantity.value), moq.value)

  const productCost = toNumber(unitCost.value) * quantity.value
  const currentShippingCost = toNumber(shippingCost.value)
  const currentOtherFees = toNumber(otherFees.value)
  const salesAmount = toNumber(sellingPrice.value) * quantity.value
  const totalCost = productCost + currentShippingCost + currentOtherFees
  const estimatedProfit = salesAmount - totalCost
  const profitMargin = salesAmount > 0 ? (estimatedProfit / salesAmount) * 100 : 0

  result.value = {
    productCost,
    shippingCost: currentShippingCost,
    otherFees: currentOtherFees,
    salesAmount,
    totalCost,
    estimatedProfit,
    profitMargin
  }
}

function calculateShipping() {
  staticShippingCost.value = toNumber(shippingMeasureValue.value) * toNumber(currentShippingRate.value)
}

function handleShippingMethodUpdate(value: ShippingMethod) {
  shippingMethod.value = value
  if (value === "air") {
    billingMethod.value = "weight"
  }
  calculateShipping()
}

function handleBillingMethodUpdate(value: BillingMethod) {
  billingMethod.value = value
  calculateShipping()
}

function handleShippingRateUpdate(value: string) {
  if (shippingMethod.value === "air") {
    airRate.value = value
    return
  }

  if (billingMethod.value === "cbm") {
    seaCbmRate.value = value
    return
  }

  seaWeightRate.value = value
}

function handleLogisticsSuppliers() {
  router.push("/logistics-suppliers")
}

function handleBack() {
  router.back()
}

function handleCustomerService() {
  router.push("/procurement-support")
}

function handleStepperUpdate(label: string, value: number) {
  if (label === "Quantity") {
    quantity.value = Math.max(value, moq.value)
  }
}

function handleFieldUpdate(label: string, value: string) {
  if (label === "Selling Price") {
    sellingPrice.value = value
    return
  }

  if (label === "Shipping Cost") {
    shippingCost.value = value
    return
  }

  if (label === "Other Fees") {
    otherFees.value = value
  }
}

onMounted(() => {
  calculateProfit()
  calculateShipping()
})
</script>

<template>
  <div class="calculator-page">
    <main class="calculator-content">
      <ModeTabs v-if="!isProfileWeightOnly" v-model="activeTab" :tabs="tabs" />
      <InputInformationCard
        v-if="activeTab === 'product'"
        :rows="currentData.inputs"
        @update-stepper="handleStepperUpdate"
        @update-field="handleFieldUpdate"
        @calculate="calculateProfit"
      />
      <WeightShippingInputCard
        v-else
        :shipping-method="shippingMethod"
        :billing-method="billingMethod"
        :total-value="shippingMeasureValue"
        :rate-value="currentShippingRate"
        @update:shipping-method="handleShippingMethodUpdate"
        @update:billing-method="handleBillingMethodUpdate"
        @update:total-value="value => shippingMeasureValue = value"
        @update:rate-value="handleShippingRateUpdate"
        @calculate="calculateShipping"
      />
      <CalculationResultsCard
        :rows="activeTab === 'product' ? currentData.results : shippingResultRows"
        :summary-rows="activeTab === 'product' ? currentData.summaries : shippingSummaryRows"
        :footer-note="activeTab === 'weight' ? 'Market reference rate only. Actual cost may vary by forwarder and destination.' : ''"
        :show-logistics-entry="activeTab === 'weight'"
        @logistics-suppliers="handleLogisticsSuppliers"
      />
      <BottomActions
        v-if="activeTab === 'product'"
        @customer-support="handleCustomerService"
        @logistics-suppliers="handleLogisticsSuppliers"
      />
    </main>
  </div>
</template>

<style scoped>
.calculator-page {
  min-height: 100vh;
  max-width: 375px;
  margin: 0 auto;
  background: #ffffff;
  color: #111827;
}

.history-button {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #2563ff;
  font-size: 23px;
  display: inline-grid;
  place-items: center;
  padding: 0;
}

.calculator-content {
  padding: 12px 16px 28px;
}
</style>
