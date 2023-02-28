interface Tile {
  type: string
}

type RouteParams = {
  id: string // parameters will always be a string (even if they are numerical)
}

declare interface PeerMessage {
  type: string,
  from: string,
  payload: any
}
