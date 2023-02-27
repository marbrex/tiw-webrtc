import { combineReducers, configureStore } from '@reduxjs/toolkit'
import initListeners from '../websocket/listeners'
import boardReducer from './slices/boardSlice'
import peerReducer from './slices/peerSlice'
import { customLogger } from './middleware'
import videoSlice from './slices/videoSlice'

const rootReducer = combineReducers({
  board: boardReducer,
  peer: peerReducer,
  video: videoSlice
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: [customLogger]
})

initListeners(store)

// Infer the `RootState` and `AppDispatch` types from the root reducer
export type RootState = ReturnType<typeof rootReducer>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
