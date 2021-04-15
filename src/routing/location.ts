import history from './history'

const formatLocation = (v: typeof history['location']) => ({ ...v, hash: '' })

const location = formatLocation(history.location)
history.listen(v => Object.assign(location, v))

export default location
