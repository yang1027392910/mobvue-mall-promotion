import VConsole from "vconsole"

export function installConsole() {
  const isDebugMode = import.meta.env.MODE === "debug" || new URLSearchParams(window.location.search).get("debug") === "true"
  import.meta.env.VITE_CONSOLE === "true" && isDebugMode && new VConsole()
}
