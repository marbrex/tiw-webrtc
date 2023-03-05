import { AnyAction, Dispatch, Middleware } from 'redux'
import { RootState } from '.'
import socket from '../websocket'

export const customLogger: Middleware<Dispatch, RootState> = api => next => {
  return (action: AnyAction) => {
    const prevState = api.getState()

    console.groupCollapsed(`%c[Middleware] ${action.type}`, 'color: #00bfff; font-weight: bold; background-color: #151F28; border-radius: 3px;')

    console.group('%cAction: ' + action.type, 'color: #ff7de9;')
    console.dir(action)
    console.groupEnd()

    console.group('%cPrev state:', 'color: #ff6c37;')
    console.dir(prevState)
    console.groupEnd()

    const result = next(action)
    const nextState = api.getState()

    console.group('%cNext state:', 'color: #92e400;')
    console.dir(nextState)
    console.groupEnd()

    console.groupEnd()

    switch (action.type) {
      case 'peer/addPeer':
        console.log(`Peers count: ${Object.keys(prevState.peer.peers).length} -> ${Object.keys(nextState.peer.peers).length}`)
        break
      case 'board/setAvatar':
        Object.entries(nextState.peer.peers)
          .filter(([, peer]) => peer.connected)
          .forEach(([id, peer]) => {
            console.log('%c[Peer] Sending avatar to peer ' + id, 'color: #cc96f9')
            const message: PeerMessage = {
              type: 'player:setAvatar',
              from: socket.id,
              payload: {
                avatar: nextState.board.playerAvatar,
                position: nextState.board.playerPosition
              }
            }
            peer.send(JSON.stringify(message))
          })
        break
      case 'board/movePlayer':
        Object.entries(nextState.peer.peers)
          .filter(([, peer]) => peer.connected)
          .forEach(([id, peer]) => {
            console.log('%c[Peer] Sending position to peer ' + id, 'color: #cc96f9')
            const message: PeerMessage = {
              type: 'player:movePlayer',
              from: socket.id,
              payload: nextState.board.playerPosition
            }
            peer.send(JSON.stringify(message))
          })
        break
      case 'video/setLocalStream':
        Object.entries(nextState.peer.peers)
          .filter(([, peer]) => peer.connected)
          .forEach(([id, peer]) => {
            console.log('%c[Peer] Sending stream to peer ' + id, 'color: #cc96f9')
            const stream = nextState.video.stream.clone()
            peer.addStream(stream)
          })
        break
      default:
        break
    }

    return result
  }
}

export default {
  customLogger
}
