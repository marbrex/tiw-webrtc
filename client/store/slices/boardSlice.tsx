import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
interface AppState {
  playerPosition: [number, number]
  playerAvatar: string
  remotePlayers: {
    [peerId: string]: {
      position: [number, number];
      avatar: string
    }
  }
  board: {
    width: number
    height: number
    tiles: Tile[]
  }
}

const initialRemotePlayer = {
  position: [0, 0],
  avatar: ''
}

// Define the initial state using that type
const initialState: AppState = {
  playerPosition: [10, 24],
  playerAvatar: '',
  remotePlayers: {},
  board: {
    width: 60,
    height: 60,
    tiles: [] // unused for now, could be useful for collision management
  }
}

export const boardSlice = createSlice({
  name: 'board',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    movePlayer: (state, action: PayloadAction<[number, number]>) => {
      state.playerPosition = action.payload
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      state.playerAvatar = action.payload
    },
    setPlayer: (state, action: PayloadAction<RemotePlayerParams>) => {
      const { peerId, position, avatar } = action.payload
      state.remotePlayers[peerId] = Object.assign({},
        state.remotePlayers[peerId] || initialRemotePlayer, {
          ...(position ? { position } : {}),
          ...(avatar ? { avatar } : {})
        }
      )
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      delete state.remotePlayers[action.payload]
    }
  }
})

interface RemotePlayerParams {
  peerId: string
  position?: [number, number]
  avatar?: string
}

// Action creators are generated for each case reducer function
export const { movePlayer, setAvatar, setPlayer, removePlayer } = boardSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.slidesApp.value

export default boardSlice.reducer
