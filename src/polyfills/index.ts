import WeakRef from './weakRef'
import FinalizationRegistry from './finalizationRegistry'

if (!('WeakRef' in globalThis)) (globalThis as any).WeakRef = WeakRef
if (!('FinalizationRegistry' in globalThis))
  (globalThis as any).FinalizationRegistry = FinalizationRegistry
