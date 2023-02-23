import { AnyAction, Dispatch, Middleware } from 'redux'
import { RootState } from '.'

export const customLogger: Middleware<Dispatch, RootState> = api => next => {
  return (action: AnyAction) => {
    const prevState = api.getState()

    console.group('%c ===[ Custom Logger ]===', 'color: #00bfff; font-weight: bold; padding: 10px 0 0 0;')

    console.group('%c Action: ' + action.type, 'color: #ff7de9;')
    console.log(action)
    console.groupEnd()

    console.group('%c Prev state:', 'color: #ff6c37;')
    console.log(prevState)
    console.groupEnd()

    switch (action.type) {
      case 'peer/addPeer':
        console.log('Peers count before: ' + Object.keys(prevState.peer.peers).length)
        break
      default:
        break
    }

    const result = next(action)
    const nextState = api.getState()

    console.group('%c Next state:', 'color: #92e400;')
    console.log(nextState)
    console.groupEnd()

    console.groupEnd()
    return result
  }
}

export default {
  customLogger
}
