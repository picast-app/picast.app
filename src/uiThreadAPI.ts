const api = {
  alert: (msg?: any) => {
    window.alert(msg)
  },
}
export type API = typeof api
export default api
