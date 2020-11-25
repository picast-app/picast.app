import { openDB } from 'idb'

export default openDB<EchoDB>(self.location.hostname, 1, {
  upgrade(db) {
    db.createObjectStore('meta').put('UP_TO_DATE', 'updateStatus')
    db.createObjectStore('podcasts')
    db.createObjectStore('user').put({ subscriptions: [] }, 'local')
  },
})
