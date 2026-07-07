import { useHead } from "@vueuse/head"
import { computed, ref } from "vue"

const SITE_URL = "https://yiwuhub.com"
const PRODUCT_PATH = "/product"
const PRODUCT_LIST_PATH = "/product-list"
const SEARCH_PATH = "/search"

export interface ProductSeo {
  id?: number | string
  title?: string
  name?: string
  cover?: string
  image?: string
  seoTitle?: string
  metaDescription?: string
  seoKeywords?: string[] | string
  urlSlug?: string
}

export interface PageSeo {
  title: string
  description: string
  seoKeywords?: string[] | string
  keywords?: string[] | string
  url: string
}

interface ManagedSeo {
  title: string
  description: string
  keywords: string
  url: string
  image?: string
  type?: string
}

const managedSeo = ref<ManagedSeo | null>(null)

function getTrimmedValue(value: string | undefined) {
  return String(value || "").trim()
}

function getKeywords(value: string[] | string | undefined) {
  if (Array.isArray(value)) {
    return value.map(keyword => String(keyword).trim()).filter(Boolean).join(",")
  }

  return getTrimmedValue(value)
}

function getProductTitle(product: ProductSeo) {
  return getTrimmedValue(product.seoTitle) || getTrimmedValue(product.title) || getTrimmedValue(product.name)
}

function getProductImage(product: ProductSeo) {
  const image = getTrimmedValue(product.cover) || getTrimmedValue(product.image)
  if (!image) return ""
  if (/^https?:\/\//.test(image)) return image

  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || SITE_URL
  return `${imageBaseUrl.replace(/\/$/, "")}/${image.replace(/^\//, "")}`
}

function getProductCanonicalUrl(product: ProductSeo) {
  const slug = getTrimmedValue(product.urlSlug) || getTrimmedValue(String(product.id || ""))
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "")
  return `${SITE_URL}${PRODUCT_PATH}/${encodeURI(normalizedSlug)}`
}

function getProductKeywords(product: ProductSeo) {
  return getKeywords(product.seoKeywords)
}

function setMeta(name: string, content: string) {
  if (typeof document === "undefined") return

  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.name = name
    document.head.appendChild(meta)
  }

  meta.content = content
}

function setPropertyMeta(property: string, content: string) {
  if (typeof document === "undefined") return

  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)

  if (!meta) {
    meta = document.createElement("meta")
    meta.setAttribute("property", property)
    document.head.appendChild(meta)
  }

  meta.content = content
}

function setCanonical(href: string) {
  if (typeof document === "undefined") return

  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement("link")
    link.rel = "canonical"
    document.head.appendChild(link)
  }

  link.href = href
}

function syncPageSeo(seo: PageSeo) {
  const title = getTrimmedValue(seo.title)
  const description = getTrimmedValue(seo.description)
  const keywords = getKeywords(seo.seoKeywords ?? seo.keywords)
  const url = getTrimmedValue(seo.url)

  if (typeof document !== "undefined") document.title = title

  setMeta("description", description)
  setMeta("keywords", keywords)
  setMeta("twitter:title", title)
  setMeta("twitter:description", description)
  setCanonical(url)

  setPropertyMeta("og:title", title)
  setPropertyMeta("og:description", description)
  setPropertyMeta("og:url", url)
}

function syncProductSeo(product: ProductSeo) {
  const title = getProductTitle(product)
  const description = getTrimmedValue(product.metaDescription)
  const keywords = getProductKeywords(product)
  const image = getProductImage(product)
  const canonicalUrl = getProductCanonicalUrl(product)

  if (typeof document !== "undefined") document.title = title

  setMeta("description", description)
  setMeta("keywords", keywords)
  setMeta("twitter:card", "summary_large_image")
  setMeta("twitter:title", title)
  setMeta("twitter:description", description)
  setMeta("twitter:image", image)
  setCanonical(canonicalUrl)

  setPropertyMeta("og:title", title)
  setPropertyMeta("og:description", description)
  setPropertyMeta("og:type", "product")
  setPropertyMeta("og:url", canonicalUrl)
  setPropertyMeta("og:image", image)
}

export function installSeoHead() {
  useHead(computed(() => {
    if (!managedSeo.value) return {}

    const seo = managedSeo.value

    return {
      title: seo.title,
      meta: [
        { name: "description", content: seo.description },
        { name: "keywords", content: seo.keywords },
        { property: "og:title", content: seo.title },
        { property: "og:description", content: seo.description },
        { property: "og:type", content: seo.type || "website" },
        { property: "og:url", content: seo.url },
        { property: "og:image", content: seo.image || "" },
        { name: "twitter:card", content: seo.image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: seo.title },
        { name: "twitter:description", content: seo.description },
        { name: "twitter:image", content: seo.image || "" }
      ],
      link: [
        { rel: "canonical", href: seo.url }
      ]
    }
  }))
}

export function setManagedSeo(seo: ManagedSeo) {
  managedSeo.value = seo
  if (typeof document !== "undefined") document.title = seo.title

  setMeta("description", seo.description)
  setMeta("keywords", seo.keywords)
  setMeta("twitter:card", seo.image ? "summary_large_image" : "summary")
  setMeta("twitter:title", seo.title)
  setMeta("twitter:description", seo.description)
  setMeta("twitter:image", seo.image || "")
  setCanonical(seo.url)

  setPropertyMeta("og:title", seo.title)
  setPropertyMeta("og:description", seo.description)
  setPropertyMeta("og:type", seo.type || "website")
  setPropertyMeta("og:url", seo.url)
  setPropertyMeta("og:image", seo.image || "")
}

export function useSeo() {

  function setProductSeo(product: ProductSeo) {
    const title = getProductTitle(product)
    const description = getTrimmedValue(product.metaDescription)
    const keywords = getProductKeywords(product)
    const image = getProductImage(product)
    const canonicalUrl = getProductCanonicalUrl(product)

    setManagedSeo({
      title,
      description,
      keywords,
      image,
      type: "product",
      url: canonicalUrl
    })
    syncProductSeo(product)
  }

  function setPageSeo(seo: PageSeo) {
    setManagedSeo({
      title: getTrimmedValue(seo.title),
      description: getTrimmedValue(seo.description),
      keywords: getKeywords(seo.seoKeywords ?? seo.keywords),
      url: getTrimmedValue(seo.url)
    })
    syncPageSeo(seo)
  }

  function setSearchSeo(value?: string) {
    const keyword = getTrimmedValue(value)

    if (!keyword) {
      setPageSeo({
        title: "Search China Wholesale Products | YiwuHub",
        description: "Search wholesale products from verified China suppliers for Philippines buyers.",
        seoKeywords: "China products, wholesale search, Yiwu suppliers, Philippines sourcing",
        url: `${SITE_URL}${SEARCH_PATH}`
      })
      return
    }

    setPageSeo({
      title: `Search "${keyword}" | YiwuHub`,
      description: `Find ${keyword} from verified China suppliers. Compare factory prices and source wholesale products for the Philippines.`,
      keywords: `${keyword}, wholesale ${keyword}, China supplier, Philippines import`,
      url: `${SITE_URL}${SEARCH_PATH}?keyword=${encodeURIComponent(keyword)}`
    })
  }

  function setProductListSeo(categoryName?: string) {
    const name = getTrimmedValue(categoryName) || "China Wholesale Products"

    setPageSeo({
      title: `${name} Wholesale Products | YiwuHub`,
      description: `Find ${name} wholesale products from verified China suppliers. Compare factory prices, Philippine selling prices, and estimated profit opportunities.`,
      keywords: `${name} wholesale, ${name} China suppliers, Philippines import, China wholesale products`,
      url: `${SITE_URL}${PRODUCT_LIST_PATH}`
    })
  }

  return {
    setPageSeo,
    setProductListSeo,
    setProductSeo,
    setSearchSeo
  }
}
