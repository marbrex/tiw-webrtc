import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Define a type for the slice state
interface AppState {
    playerPosition: [number, number]
    board: {
        width: number
        height: number
        tiles: Tile[]
    }
}

// Define the initial state using that type
const initialState: AppState = {
    playerPosition: [10, 24],
    board: {
        width: 60,
        height: 60,
        tiles: [], // unused for now, could be useful for collision management
    },
}

export const boardSlice = createSlice({
    name: 'board',
    // `createSlice` will infer the state type from the `initialState` argument
    initialState,
    reducers: {
        // Use the PayloadAction type to declare the contents of `action.payload`
        movePlayer: {
            reducer(state, action: PayloadAction<[number, number]>) {
                console.log(action)
                state.playerPosition = action.payload
            },
            prepare(payload: [number, number], propagate: boolean) {
                return { payload, meta: { propagate } }
            },
        },
    },
})

export const { movePlayer } = boardSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.slidesApp.value

export default boardSlice.reducer
