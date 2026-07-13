/** 项目标题 */
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE ?? "MobVue"

/** 动态标题 */
const dynamicTitle = ref<string>("")

/** 设置标题 */
function setTitle(title?: unknown) {
  const pageTitle = String(title || "").trim()
  dynamicTitle.value = pageTitle
    ? pageTitle.includes("china2ph") ? pageTitle : `${pageTitle} | china2ph`
    : VITE_APP_TITLE
}

// 监听标题变化
watch(dynamicTitle, (value, oldValue) => {
  if (document && value !== oldValue) {
    document.title = value
  }
})

/** 标题 Composable */
export function useTitle() {
  return { setTitle }
}
