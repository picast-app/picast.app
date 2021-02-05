import Store from './store'
import bufferInstance from 'utils/instantiationBuffer'

const store = bufferInstance(Store, Store.create())

export default store
