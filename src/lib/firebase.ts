import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAgwM8IakPoKBlIFwmeW7cBLNi49Yv3d-w',
  authDomain: 'school-tool-5c151.firebaseapp.com',
  projectId: 'school-tool-5c151',
  storageBucket: 'school-tool-5c151.firebasestorage.app',
  messagingSenderId: '361518642776',
  appId: '1:361518642776:web:a31198c38c5d923759fc2d',
  measurementId: 'G-KTK8N472T0',
}

export const app = initializeApp(firebaseConfig)

function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    try {
      return initializeFirestore(app, {
        localCache: persistentLocalCache({}),
      })
    } catch {
      return getFirestore(app)
    }
  }
}

export const db = createDb()
