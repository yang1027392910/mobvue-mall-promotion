<script setup lang="ts">
import type { UserVerificationSubmitResponseData } from "@@/apis/userVerification/type"
import type { UploaderFileListItem } from "vant"
import { getUserVerificationDetailApi, submitUserVerificationApi, uploadFileApi } from "@@/apis/userVerification"
import { showFailToast, showSuccessToast } from "vant"
import { computed, onMounted, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

type BusinessType = "" | "Online Seller" | "Physical Store" | "Wholesaler" | "Distributor" | "Other"

const router = useRouter()
const userStore = useUserStore()
const step = ref(0)
const showBusinessTypePicker = ref(false)
const storePhotos = ref<UploaderFileListItem[]>([])
const submitting = ref(false)
const detailLoading = ref(false)
const rejectionRemark = ref("")
const verificationStatus = computed(() => Number(userStore.userInfo.verificationStatus ?? -1))
const isReadOnly = computed(() => verificationStatus.value === 0 || verificationStatus.value === 1)

const businessTypeOptions = [
  { text: "Online Seller", value: "Online Seller" },
  { text: "Physical Store", value: "Physical Store" },
  { text: "Wholesaler", value: "Wholesaler" },
  { text: "Distributor", value: "Distributor" },
  { text: "Other", value: "Other" }
]

const form = reactive({
  fullName: "",
  contactNumber: "",
  email: "",
  address: "",
  city: "",
  companyName: "",
  businessType: "" as BusinessType,
  storeDescription: ""
})

const errors = reactive({
  fullName: "",
  contactNumber: "",
  address: "",
  city: "",
  companyName: "",
  businessType: "",
  storeDescription: "",
  storePhotos: ""
})

function clearError(field: keyof typeof errors) {
  errors[field] = ""
}

function handleBack() {
  if (step.value > 0) {
    step.value -= 1
    return
  }

  router.back()
}

function validateBasicInfo() {
  errors.fullName = form.fullName.trim() ? "" : "Full Name is required."
  errors.contactNumber = form.contactNumber.trim() ? "" : "Contact Number is required."
  errors.address = form.address.trim() ? "" : "Address is required."
  errors.city = form.city.trim() ? "" : "City is required."

  return !errors.fullName && !errors.contactNumber && !errors.address && !errors.city
}

function validateBusinessInfo() {
  errors.companyName = form.companyName.trim() ? "" : "Shop / Company Name is required."
  errors.businessType = form.businessType ? "" : "Business Type is required."
  errors.storeDescription = form.storeDescription.trim() ? "" : "Store Description is required."
  errors.storePhotos = storePhotos.value.length ? "" : "Please upload at least one store photo."

  return !errors.companyName
    && !errors.businessType
    && !errors.storeDescription
    && !errors.storePhotos
}

function handleNext() {
  if (isReadOnly.value) {
    step.value += 1
    return
  }
  if (step.value === 0 && !validateBasicInfo()) return
  if (step.value === 1 && !validateBusinessInfo()) return
  step.value += 1
}

function handleBusinessTypeConfirm({ selectedOptions }: { selectedOptions: Array<{ text: string, value: string }> }) {
  if (isReadOnly.value) return
  form.businessType = (selectedOptions[0]?.value || "") as BusinessType
  clearError("businessType")
  showBusinessTypePicker.value = false
}

function parseStorePhotos(value?: string[] | string) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter(item => typeof item === "string" && item)
  } catch {
    // Keep compatibility with comma-separated photo paths.
  }

  return value.split(",").map(item => item.trim()).filter(Boolean)
}

function getPhotoUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path
  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ""
  return `${imageBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
}

function getPreviewPhotoUrl(photo: UploaderFileListItem) {
  return photo.objectUrl || photo.content || photo.url || ""
}

function getUploadedPhotoUrl(data: string | {
  url?: string
  path?: string
  fileUrl?: string
  file_url?: string
}) {
  if (typeof data === "string") return data
  return data.url || data.path || data.fileUrl || data.file_url || ""
}

function isRejectedVerification(detail: UserVerificationSubmitResponseData) {
  const status = detail.review_status ?? detail.audit_status ?? detail.status
  const normalizedStatus = String(status ?? "").trim().toLowerCase()
  return [
    "-1",
    "2",
    "3",
    "not_approved",
    "not approved",
    "rejected",
    "reject",
    "failed",
    "failure"
  ].includes(normalizedStatus)
}

function fillVerificationForm(detail: UserVerificationSubmitResponseData) {
  form.fullName = detail.full_name || detail.fullName || ""
  form.contactNumber = detail.phone || ""
  form.email = detail.email || userStore.email || ""
  form.address = detail.address || ""
  form.city = detail.city || ""
  const shopName = detail.shop_name || detail.shopName || ""
  const businessType = detail.business_type || detail.businessType || ""
  const storeDescription = detail.store_description || detail.storeDescription || ""
  const storePhotoValue = detail.store_photos || detail.storePhotos

  form.companyName = shopName
  form.businessType = (businessTypeOptions.some(item => item.value === businessType)
    ? businessType
    : "Other") as BusinessType
  form.storeDescription = storeDescription
  storePhotos.value = parseStorePhotos(storePhotoValue).map(url => ({
    url: getPhotoUrl(url),
    status: "done"
  }))
  rejectionRemark.value = detail.remark || ""
}

function getUserIdFromToken() {
  try {
    const payload = userStore.token.split(".")[1] || userStore.token.split(".")[0]
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const decodedPayload = JSON.parse(atob(normalizedPayload))
    return Number(decodedPayload.id ?? decodedPayload.userId ?? decodedPayload.user_id ?? decodedPayload.sub ?? 0)
  } catch {
    return 0
  }
}

async function loadRejectedVerification() {
  if (verificationStatus.value === -1) return

  if (!userStore.id) {
    await userStore.getInfo()
  }
  const userId = userStore.id || getUserIdFromToken()
  if (!userId) {
    showFailToast("Unable to get the current user ID.")
    return
  }

  detailLoading.value = true
  try {
    const { data } = await getUserVerificationDetailApi(userId)
    if (data) {
      const detailStatus = Number(data.review_status ?? data.audit_status ?? data.status)
      if (Number.isFinite(detailStatus)) {
        userStore.setUserInfo({ verificationStatus: detailStatus })
      }
      fillVerificationForm(data)
      if (isRejectedVerification(data) && !rejectionRemark.value) {
        rejectionRemark.value = "Please update your information and submit it again."
      }
    }
  } catch {
    // No previous verification record: keep the form empty.
  } finally {
    detailLoading.value = false
  }
}

async function handleSubmit() {
  if (isReadOnly.value || submitting.value || !validateBasicInfo() || !validateBusinessInfo()) return

  const photos = storePhotos.value
    .map(item => item.file)
    .filter((file): file is File => file instanceof File)
  const existingPhotos = storePhotos.value
    .filter(item => !item.file && item.url)
    .map(item => String(item.url))

  if (!photos.length && !existingPhotos.length) {
    showFailToast("Please reselect the store photos.")
    return
  }

  submitting.value = true
  try {
    const uploadedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const { data } = await uploadFileApi(photo)
        const url = getUploadedPhotoUrl(data)
        if (!url) throw new Error("The upload API did not return a photo URL.")
        return url
      })
    )
    const photoUrls = [...existingPhotos, ...uploadedPhotos]

    await submitUserVerificationApi({
      full_name: form.fullName.trim(),
      phone: form.contactNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      shop_name: form.companyName.trim(),
      business_type: form.businessType,
      store_description: form.storeDescription.trim(),
      store_photos: photoUrls,
      remark: ""
    })
    await userStore.getInfo()
    showSuccessToast({
      message: "Verification submitted successfully.",
      duration: 1500,
      forbidClick: true,
      onClose: () => {
        router.replace("/profile")
      }
    })
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : "Verification submission failed.")
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRejectedVerification()
})
</script>

<template>
  <div class="verification-page">
    <!-- <header class="verification-hero">
      <div class="hero-icon">
        <van-icon name="shield-o" />
      </div>
      <div>
        <h1>Supplier Verification</h1>
        <p>Complete your business profile to unlock more supplier services.</p>
      </div>
    </header> -->

    <main class="verification-content">
      <van-loading v-if="detailLoading" class="detail-loading" color="#1677ff">
        Loading verification...
      </van-loading>

      <div v-if="rejectionRemark" class="rejection-notice">
        <van-icon name="warning-o" />
        <div>
          <strong>Verification was not approved</strong>
          <p>{{ rejectionRemark }}</p>
        </div>
      </div>

      <div v-if="isReadOnly" class="readonly-notice">
        <van-icon name="clock-o" />
        <span>Your verification is being reviewed. Information cannot be edited.</span>
      </div>

      <section class="progress-card">
        <div
          v-for="(item, index) in ['Basic Info', 'Business Info', 'Review']"
          :key="item"
          class="progress-item"
          :class="{ active: step >= index }"
        >
          <div class="progress-dot">
            <van-icon v-if="step > index" name="success" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span>{{ item }}</span>
        </div>
      </section>

      <section v-if="step === 0" class="form-card">
        <div class="section-heading">
          <span>Step 1</span>
          <h2>Basic Information</h2>
          <p>Tell us how we can identify and contact you.</p>
        </div>

        <div class="form-group">
          <label>Full Name <em>*</em></label>
          <van-field
            v-model.trim="form.fullName"
            :readonly="isReadOnly"
            :class="{ 'field-invalid': errors.fullName }"
            placeholder="Enter your full name"
            @update:model-value="clearError('fullName')"
          />
          <p v-if="errors.fullName" class="field-error">
            {{ errors.fullName }}
          </p>
        </div>
        <div class="form-group">
          <label>Contact Number <em>*</em></label>
          <van-field
            v-model.trim="form.contactNumber"
            :readonly="isReadOnly"
            type="tel"
            inputmode="tel"
            :class="{ 'field-invalid': errors.contactNumber }"
            placeholder="Enter your contact number"
            @update:model-value="clearError('contactNumber')"
          />
          <p v-if="errors.contactNumber" class="field-error">
            {{ errors.contactNumber }}
          </p>
        </div>
        <div class="form-group">
          <label>Email <small>Optional</small></label>
          <van-field
            v-model.trim="form.email"
            :readonly="isReadOnly"
            type="email"
            inputmode="email"
            placeholder="Enter your email address"
          />
        </div>
        <div class="form-group">
          <label>Address <em>*</em></label>
          <van-field
            v-model.trim="form.address"
            :readonly="isReadOnly"
            :class="{ 'field-invalid': errors.address }"
            placeholder="Enter your address"
            @update:model-value="clearError('address')"
          />
          <p v-if="errors.address" class="field-error">
            {{ errors.address }}
          </p>
        </div>
        <div class="form-group">
          <label>City <em>*</em></label>
          <van-field
            v-model.trim="form.city"
            :readonly="isReadOnly"
            :class="{ 'field-invalid': errors.city }"
            placeholder="Enter your city"
            @update:model-value="clearError('city')"
          />
          <p v-if="errors.city" class="field-error">
            {{ errors.city }}
          </p>
          <p class="field-help">
            Philippines users only
          </p>
        </div>

        <van-button class="primary-button" block @click="handleNext">
          Next Step
        </van-button>
      </section>

      <section v-else-if="step === 1" class="form-card">
        <div class="section-heading">
          <span>Step 2</span>
          <h2>Business Information</h2>
          <p>Share a few details about your shop or company.</p>
        </div>

        <div class="form-group">
          <label>Shop / Company Name <em>*</em></label>
          <van-field
            v-model.trim="form.companyName"
            :readonly="isReadOnly"
            :class="{ 'field-invalid': errors.companyName }"
            placeholder="Enter shop or company name"
            @update:model-value="clearError('companyName')"
          />
          <p v-if="errors.companyName" class="field-error">
            {{ errors.companyName }}
          </p>
        </div>
        <div class="form-group">
          <label>Business Type <em>*</em></label>
          <van-field
            v-model="form.businessType"
            readonly
            is-link
            :class="{ 'field-invalid': errors.businessType }"
            placeholder="Select business type"
            @click="!isReadOnly && (showBusinessTypePicker = true)"
          />
          <p v-if="errors.businessType" class="field-error">
            {{ errors.businessType }}
          </p>
        </div>
        <div class="form-group">
          <label>Store Description <em>*</em></label>
          <van-field
            v-model.trim="form.storeDescription"
            :readonly="isReadOnly"
            class="description-field"
            type="textarea"
            rows="4"
            maxlength="200"
            show-word-limit
            :class="{ 'field-invalid': errors.storeDescription }"
            placeholder="Describe your products and business"
            @update:model-value="clearError('storeDescription')"
          />
          <p v-if="errors.storeDescription" class="field-error">
            {{ errors.storeDescription }}
          </p>
        </div>
        <div class="form-group">
          <label>Store Photos <em>*</em></label>
          <van-uploader
            v-model="storePhotos"
            :disabled="isReadOnly"
            :deletable="!isReadOnly"
            class="store-uploader"
            accept="image/*"
            multiple
            :max-count="4"
            :max-size="8 * 1024 * 1024"
            @oversize="showFailToast('Each photo must be smaller than 8 MB.')"
            @update:model-value="clearError('storePhotos')"
          >
            <div class="upload-trigger">
              <van-icon name="photograph" />
              <strong>Add Photo</strong>
              <span>Up to 4 photos</span>
            </div>
          </van-uploader>
          <p v-if="errors.storePhotos" class="field-error">
            {{ errors.storePhotos }}
          </p>
        </div>

        <div class="button-row">
          <van-button class="secondary-button" block @click="step = 0">
            Previous
          </van-button>
          <van-button class="primary-button" block @click="handleNext">
            Next Step
          </van-button>
        </div>
      </section>

      <section v-else class="form-card review-card">
        <div class="section-heading">
          <span>Step 3</span>
          <h2>Review Information</h2>
          <p>Please confirm that the information below is correct.</p>
        </div>

        <div class="review-section">
          <h3>Basic Information</h3>
          <div class="review-row">
            <span>Full Name</span>
            <strong>{{ form.fullName }}</strong>
          </div>
          <div class="review-row">
            <span>Contact Number</span>
            <strong>{{ form.contactNumber }}</strong>
          </div>
          <div class="review-row">
            <span>Email</span>
            <strong>{{ form.email || "Not provided" }}</strong>
          </div>
          <div class="review-row">
            <span>Address</span>
            <strong>{{ form.address }}</strong>
          </div>
          <div class="review-row">
            <span>City</span>
            <strong>{{ form.city }}, Philippines</strong>
          </div>
        </div>

        <div class="review-section">
          <h3>Business Information</h3>
          <div class="review-row">
            <span>Shop / Company Name</span>
            <strong>{{ form.companyName }}</strong>
          </div>
          <div class="review-row">
            <span>Business Type</span>
            <strong>{{ form.businessType }}</strong>
          </div>
          <div class="review-description">
            <span>Store Description</span>
            <p>{{ form.storeDescription }}</p>
          </div>
        </div>

        <div class="review-section">
          <h3>Store Photos</h3>
          <div class="review-photos">
            <img
              v-for="(photo, index) in storePhotos"
              :key="index"
              :src="getPreviewPhotoUrl(photo)"
              :alt="`Store photo ${index + 1}`"
            >
          </div>
        </div>

        <div class="button-row">
          <van-button class="secondary-button" block @click="step = 1">
            Previous
          </van-button>
          <van-button
            v-if="!isReadOnly"
            class="primary-button"
            block
            :loading="submitting"
            loading-text="Submitting..."
            @click="handleSubmit"
          >
            Submit for Verification
          </van-button>
          <van-button v-else class="readonly-button" block disabled>
            Under Review
          </van-button>
        </div>

        <p class="security-note">
          <van-icon name="shield-o" />
          Your information is secure and will be reviewed within 1-2 days.
        </p>
      </section>
    </main>

    <van-popup v-model:show="showBusinessTypePicker" position="bottom" round>
      <van-picker
        title="Business Type"
        :columns="businessTypeOptions"
        @confirm="handleBusinessTypeConfirm"
        @cancel="showBusinessTypePicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped>
.verification-page {
  width: 100%;
  max-width: 375px;
  min-height: 100vh;
  margin: 0 auto;
  color: #0f172a;
  background: #f5f7fb;
}

.verification-hero {
  min-height: 148px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 20px 42px;
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #6a35ff 100%);
}

.hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  font-size: 26px;
  background: rgba(255, 255, 255, 0.18);
}

.verification-hero h1 {
  margin: 0;
  font-size: 21px;
  line-height: 28px;
}

.verification-hero p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  line-height: 18px;
}

.verification-content {
  position: relative;
  z-index: 2;
  margin-top: -10px;
  padding: 0 12px 28px;
}

.detail-loading {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 12px;
  background: #ffffff;
}

.rejection-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 12px;
  color: #c2410c;
  background: #fff7ed;
}

.rejection-notice > .van-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  font-size: 19px;
}

.rejection-notice strong {
  display: block;
  font-size: 13px;
  line-height: 19px;
}

.rejection-notice p {
  margin: 4px 0 0;
  color: #9a3412;
  font-size: 11px;
  line-height: 17px;
}

.readonly-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  border-radius: 12px;
  padding: 11px 12px;
  color: #1677ff;
  font-size: 11px;
  line-height: 17px;
  background: #eaf3ff;
}

.readonly-notice .van-icon {
  flex: 0 0 auto;
  font-size: 18px;
}

.progress-card,
.form-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.progress-card {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 15px 10px;
}

.progress-card::before {
  position: absolute;
  top: 29px;
  right: 19%;
  left: 19%;
  height: 2px;
  background: #e2e8f0;
  content: "";
}

.progress-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 600;
}

.progress-dot {
  width: 28px;
  height: 28px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #94a3b8;
  background: #ffffff;
}

.progress-item.active {
  color: #1677ff;
}

.progress-item.active .progress-dot {
  border-color: #1677ff;
  color: #ffffff;
  background: #1677ff;
}

.form-card {
  margin-top: 12px;
  padding: 18px 16px;
}

.section-heading > span {
  color: #1677ff;
  font-size: 11px;
  font-weight: 700;
}

.section-heading h2 {
  margin: 4px 0 0;
  font-size: 19px;
  line-height: 26px;
}

.section-heading p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.form-group {
  margin-top: 16px;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.form-group label em {
  color: #ef4444;
  font-style: normal;
}

.form-group label small {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 500;
}

.form-group :deep(.van-field) {
  min-height: 44px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
}

.form-group :deep(.van-field:focus-within) {
  border-color: #1677ff;
  background: #ffffff;
}

.form-group :deep(.van-field.field-invalid) {
  border-color: #ef4444;
  background: #fffafa;
}

.form-group :deep(.description-field) {
  align-items: flex-start;
}

.field-error {
  margin: 5px 2px 0;
  color: #ef4444;
  font-size: 11px;
  line-height: 16px;
}

.field-help {
  margin: 6px 2px 0;
  color: #64748b;
  font-size: 11px;
}

.primary-button,
.secondary-button {
  height: 48px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.primary-button {
  margin-top: 20px;
  border: 0;
  color: #ffffff;
  background: linear-gradient(135deg, #1677ff 0%, #1f5cff 100%);
}

.secondary-button {
  margin-top: 20px;
  border-color: #cbd5e1;
  color: #475569;
  background: #ffffff;
}

.readonly-button {
  height: 48px;
  margin-top: 20px;
  border-radius: 12px;
  color: #1677ff;
  font-size: 14px;
  font-weight: 700;
  background: #eaf3ff;
}

.button-row {
  display: grid;
  grid-template-columns: 34% minmax(0, 1fr);
  gap: 10px;
}

.store-uploader :deep(.van-uploader__preview-image),
.store-uploader :deep(.van-uploader__preview) {
  width: 78px;
  height: 78px;
  border-radius: 10px;
}

.upload-trigger {
  width: 78px;
  height: 78px;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #1677ff;
  background: #f5f9ff;
}

.upload-trigger .van-icon {
  font-size: 22px;
}

.upload-trigger strong {
  margin-top: 4px;
  font-size: 11px;
}

.upload-trigger span {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 9px;
}

.review-section {
  margin-top: 16px;
  overflow: hidden;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  padding: 12px;
}

.review-section h3 {
  margin: 0 0 8px;
  color: #1677ff;
  font-size: 13px;
}

.review-row {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.review-row:last-child {
  border-bottom: 0;
}

.review-row span,
.review-description span {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 11px;
}

.review-row strong {
  min-width: 0;
  color: #0f172a;
  font-size: 12px;
  text-align: right;
  overflow-wrap: anywhere;
}

.review-description {
  padding-top: 8px;
}

.review-description p {
  margin: 6px 0 0;
  color: #334155;
  font-size: 12px;
  line-height: 18px;
  white-space: pre-wrap;
}

.review-photos {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}

.review-photos img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 9px;
  object-fit: cover;
}

.security-note {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
  margin: 14px 4px 0;
  color: #64748b;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.security-note .van-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #1677ff;
}
</style>
