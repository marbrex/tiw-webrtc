import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { initOnFetchPeers, initOnReceivingOffer } from '../websocket/listeners'
import boardReducer from './slices/boardSlice'
import peerReducer from './slices/peerSlice'
import { customLogger } from './middleware'

const rootReducer = combineReducers({
  board: boardReducer,
  peer: peerReducer
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: [customLogger]
})

console.log('in store init')
initOnFetchPeers(store)
initOnReceivingOffer(store)

// Infer the `RootState` and `AppDispatch` types from the root reducer
export type RootState = ReturnType<typeof rootReducer>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
