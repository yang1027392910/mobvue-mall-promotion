<script setup lang="ts">
import { Icon } from "@iconify/vue"
import { useRouter } from "vue-router"
import logo from "@/assets/home/logo.png"

interface FooterLink {
  label: string
  icon: string
  path?: string
  hash?: string
}

interface ContactLink extends FooterLink {
  icon: string
  className?: string
  href?: string
}

const router = useRouter()

const companyLinks: FooterLink[] = [
  { label: "About Us", icon: "mdi:account-outline", path: "/about-policies", hash: "#about-us" },
  { label: "How It Works", icon: "mdi:cog-outline", path: "/about-policies", hash: "#how-it-works" },
  { label: "Contact Us", icon: "mdi:headset", path: "/procurement-support" }
]

const supportLinks: FooterLink[] = [
  { label: "Privacy Policy", icon: "mdi:shield-check-outline", path: "/about-policies", hash: "#privacy-policy" },
  { label: "Terms of Service", icon: "mdi:file-document-outline", path: "/about-policies", hash: "#terms-of-service" }
]

const socialLinks = [
  { label: "Facebook", icon: "mdi:facebook", className: "is-facebook", path: "/procurement-support" },
  { label: "Messenger", icon: "mdi:facebook-messenger", className: "is-messenger", path: "/procurement-support" },
  { label: "WhatsApp", icon: "mdi:whatsapp", className: "is-whatsapp", path: "/procurement-support" }
]

const contactLinks: ContactLink[] = [
  { label: "Message Us", icon: "mdi:facebook-messenger", className: "is-messenger", path: "/procurement-support" },
  { label: "WhatsApp", icon: "mdi:whatsapp", className: "is-whatsapp", path: "/procurement-support" },
  { label: "support@china2ph.com", icon: "mdi:email-outline", href: "mailto:support@china2ph.com" },
  { label: "china2ph.com", icon: "mdi:web", href: "https://china2ph.com" }
]

function handleRoute(itemOrPath?: FooterLink | string) {
  if (!itemOrPath) return

  if (typeof itemOrPath === "string") {
    router.push(itemOrPath)
    return
  }

  if (!itemOrPath.path) return

  router.push({
    path: itemOrPath.path,
    hash: itemOrPath.hash
  })
}

function handleContactClick(item: ContactLink, event: MouseEvent) {
  if (!item.path) return
  event.preventDefault()
  router.push(item.path)
}
</script>

<template>
  <footer class="site-footer">
    <div class="footer-brand">
      <img class="footer-logo" :src="logo" alt="YiwuHub">

      <p class="brand-copy">
        Your trusted sourcing partner connecting Philippines businesses with quality Chinese factories.
      </p>
      <div class="social-list" aria-label="Social links">
        <button v-for="item in socialLinks" :key="item.label" class="social-button" :class="item.className" type="button" :aria-label="item.label" @click="handleRoute(item.path)">
          <Icon :icon="item.icon" />
        </button>
      </div>
    </div>

    <div class="footer-links">
      <div class="footer-group">
        <button v-for="item in companyLinks" :key="item.label" class="footer-link" type="button" @click="handleRoute(item)">
          <Icon class="footer-link__icon" :icon="item.icon" />
          <span>{{ item.label }}</span>
          <Icon class="footer-link__arrow" icon="mdi:chevron-right" />
        </button>
      </div>

      <div class="footer-group">
        <button v-for="item in supportLinks" :key="item.label" class="footer-link" type="button" @click="handleRoute(item)">
          <Icon class="footer-link__icon" :icon="item.icon" />
          <span>{{ item.label }}</span>
          <Icon class="footer-link__arrow" icon="mdi:chevron-right" />
        </button>
      </div>
    </div>

    <div class="footer-group contact-group">
      <a
        v-for="item in contactLinks"
        :key="item.label"
        class="contact-link"
        :class="item.className"
        :href="item.href || item.path"
        :target="item.href ? '_blank' : undefined"
        :rel="item.href ? 'noopener noreferrer' : undefined"
        @click="handleContactClick(item, $event)"
      >
        <Icon :icon="item.icon" />
        <span>{{ item.label }}</span>
      </a>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2026 YiwuHub. All rights reserved.</p>
      <p>CHINA TO PHILIPPINES, <span>BUSINESS MADE SIMPLE.</span></p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #263653;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #ffffff 72%, #f1f7ff 100%);
  border: 1px solid #e3ebf7;
  border-radius: 10px;
  box-shadow:
    0 14px 36px rgba(29, 67, 126, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.footer-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 18px;
  border-bottom: 1px solid #d7e0ed;
  text-align: center;
}

.footer-logo {
  width: 128px;
  height: auto;
  object-fit: contain;
}

.brand-copy {
  margin: 14px 0 18px;
  max-width: 360px;
  color: #263653;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.48;
}

.social-list {
  display: flex;
  align-items: center;
  gap: 22px;
}

.social-button {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  color: #2b73f7;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #edf4ff 0%, #e7f0ff 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  font-size: 25px;
}

.social-button.is-messenger {
  color: #1684ff;
}

.social-button.is-whatsapp {
  color: #10bb59;
  background: linear-gradient(180deg, #e8f9ee 0%, #ddf6e8 100%);
}

.footer-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.footer-group h2 {
  margin: 0 0 10px;
  color: #061d4b;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 1px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 22px;
  row-gap: 14px;
  padding: 20px 22px 21px;
  border-bottom: 1px solid #d7e0ed;
}

.footer-link {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 0;
  color: #071b4a;
  border: 0;
  background: transparent;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.25;
  text-align: left;
}

.footer-link__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-right: 11px;
  color: #2d73ff;
}

.footer-link span {
  min-width: 0;
  flex: 1 1 auto;
  overflow-wrap: anywhere;
}

.footer-link__arrow {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  margin-left: 8px;
  color: #2d73ff;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 13px;
  color: #263653;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.contact-group {
  gap: 0;
  padding: 10px 10px 12px;
  border-bottom: 1px solid #d7e0ed;
}

.contact-link svg {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  padding: 9px;
  color: #1684ff;
  border-radius: 50%;
  background: #edf4ff;
}

.contact-link.is-whatsapp svg {
  color: #04b84d;
  background: #e2f8e9;
}

.contact-link + .contact-link {
  border-top: 1px dashed #dbe5f2;
}

.footer-bottom {
  padding: 18px 14px 20px;
  background: linear-gradient(180deg, rgba(244, 249, 255, 0.36) 0%, rgba(232, 243, 255, 0.84) 100%);
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  color: #263653;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
}

.footer-bottom p + p {
  margin-top: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 3px;
}

.footer-bottom span {
  color: #2d73ff;
}

@media (max-width: 420px) {
  .footer-logo {
    width: 118px;
  }

  .footer-brand {
    padding: 15px 12px 17px;
  }

  .brand-copy {
    margin: 13px 0 17px;
    font-size: 13px;
  }

  .social-list {
    gap: 20px;
  }

  .social-button {
    width: 42px;
    height: 42px;
    font-size: 24px;
  }

  .footer-links,
  .contact-group {
    padding-right: 16px;
    padding-left: 16px;
  }

  .footer-links {
    column-gap: 12px;
    padding-top: 18px;
    padding-bottom: 19px;
  }

  .footer-group {
    gap: 8px;
  }

  .footer-link {
    font-size: 11px;
  }

  .footer-link__icon {
    width: 18px;
    height: 18px;
    margin-right: 8px;
  }

  .footer-link__arrow {
    width: 18px;
    height: 18px;
    margin-left: 6px;
  }

  .contact-link {
    gap: 5px;
    font-size: 11px;
  }

  .contact-link svg {
    width: 35px;
    height: 35px;
  }

  .footer-bottom p {
    font-size: 11px;
  }

  .footer-bottom p + p {
    font-size: 11px;
    letter-spacing: 2px;
  }
}
</style>
