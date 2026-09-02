import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'

initializeApp()

const db = getFirestore()
const BATCH_LIMIT = 450

export const resetBusDeparted = onSchedule(
  {
    schedule: '0 0,13 * * *',
    timeZone: 'Asia/Jerusalem',
    region: 'europe-west1',
  },
  async () => {
    const schools = await db.collection('schools').get()
    let updated = 0

    for (const school of schools.docs) {
      const buses = await school.ref.collection('buses').get()
      let batch = db.batch()
      let ops = 0

      for (const bus of buses.docs) {
        // Student statuses are never reset — only the bus departed flag.
        batch.update(bus.ref, {
          departed: false,
          departed_at: null,
        })
        ops += 1
        updated += 1
        if (ops >= BATCH_LIMIT) {
          await batch.commit()
          batch = db.batch()
          ops = 0
        }
      }

      if (ops > 0) {
        await batch.commit()
      }
    }

    logger.info(`Reset departed on ${updated} buses across ${schools.size} schools`)
  },
)
