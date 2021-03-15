export async function getSubscription<T extends boolean = false>(
  stringify?: T
): Promise<null | (T extends true ? string : PushSubscription)> {
  try {
    const sw = await navigator.serviceWorker.ready
    const sub = await sw.pushManager.getSubscription()
    return sub && stringify ? JSON.stringify(sub) : (sub as any)
  } catch (e) {
    return null
  }
}
