declare module '*.png';
declare module '*.jpg';

declare interface PeerMessage {
  type: string,
  from: string,
  payload: any
}
