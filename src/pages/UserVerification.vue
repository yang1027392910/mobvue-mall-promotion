<script setup lang="ts">
import type { UserVerificationSubmitResponseData } from "@@/apis/userVerification/type"
import { getUserVerificationDetailApi, submitUserVerificationApi } from "@@/apis/userVerification"
import { showFailToast, showSuccessToast } from "vant"
import { computed, onMounted, reactive, ref } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/pinia/stores/user"

const router = useRouter()
const userStore = useUserStore()
const submitting = ref(false)
const detailLoading = ref(false)
const rejectionRemark = ref("")
const verificationStatus = computed(() => Number(userStore.userInfo.verificationStatus ?? -1))
const isReadOnly = computed(() => verificationStatus.value === 0 || verificationStatus.value === 1)

const form = reactive({
  fullName: "",
  contactNumber: "",
  email: "",
  address: "",
  city: ""
})

const errors = reactive({
  fullName: "",
  contactNumber: "",
  address: "",
  city: ""
})

function clearError(field: keyof typeof errors) {
  errors[field] = ""
}

function validateBasicInfo() {
  errors.fullName = form.fullName.trim() ? "" : "Full Name is required."
  errors.contactNumber = form.contactNumber.trim() ? "" : "Contact Number is required."
  errors.address = form.address.trim() ? "" : "Address is required."
  errors.city = form.city.trim() ? "" : "City is required."

  return !errors.fullName && !errors.contactNumber && !errors.address && !errors.city
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
  if (isReadOnly.value || submitting.value || detailLoading.value || !validateBasicInfo()) return

  submitting.value = true
  try {
    await submitUserVerificationApi({
      full_name: form.fullName.trim(),
      phone: form.contactNumber.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
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
        <span>{{ verificationStatus === 1 ? 'Your information has been verified.' : 'Your verification is being reviewed. Information cannot be edited.' }}</span>
      </div>

      <section class="form-card">
        <div class="section-heading">
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

        <van-button
          v-if="!isReadOnly"
          class="primary-button"
          block
          :loading="submitting"
          :disabled="detailLoading"
          loading-text="Submitting..."
          @click="handleSubmit"
        >
          Submit for Verification
        </van-button>
        <van-button v-else class="readonly-button" block disabled>
          {{ verificationStatus === 1 ? 'Verified' : 'Under Review' }}
        </van-button>

        <p class="security-note">
          <van-icon name="shield-o" />
          Your information is secure and will be reviewed within 1-2 days.
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.verification-page {
  width: 100%;
  max-width: 500px;
  min-height: 100vh;
  margin: 0 auto;
  color: #0f172a;
  background: #f5f7fb;
}

.verification-content {
  position: relative;
  z-index: 2;
  padding: 12px 12px 28px;
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

.form-card {
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
}

.form-card {
  padding: 18px 16px;
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

.primary-button {
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

.readonly-button {
  height: 48px;
  margin-top: 20px;
  border-radius: 12px;
  color: #1677ff;
  font-size: 14px;
  font-weight: 700;
  background: #eaf3ff;
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
