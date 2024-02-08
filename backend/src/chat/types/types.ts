// import { WsResponse } from "@nestjs/websockets"

export const enum WsActionSuccess {
  Init = 'successfully initialized',
  Connect = 'connected',
  Disconnect = 'disconnected',
  Post = 'posted into channel',
  JoinRoom = 'joined room',
  LeaveRoom = 'left room',
  JoinChannel = 'joined channel',
  LeaveChannel = 'left channel',
  DirectMessage = 'send dm to',
  Mute = 'muted'
}

export const enum WsActionFailure {
  Connect = 'unauthorized to connect',
  Disconnect = 'unauthorized to disconnect',
  Post = 'unauthorized to post to channel',
  JoinRoom = 'unauthorized to join room',
  LeaveRoom = 'unauthorized to leave room',
  JoinChannel = 'unauthorized to join channel',
  LeaveChannel = 'unauthorized to leave channel',
  DirectMessage = 'unable to dm',
  Mute = 'unable to mute'
}

export const enum WsFailureCause {
  UserNotFound = 'user not found',
  ChannelNotFound = 'channel not found',
  UserNotInChannel = 'user not in channel',
  UserAlreadyJoined = 'user already in channel',
  UserNotAdmin = 'user not admin',
  UserAlreadyMuted = 'user already muted',
  UserMuted = 'user is muted',
  UserBanned = 'user is banned',
  WrongChannelPassword = 'wrong password',
  PrivateChannel = 'this channel is private',
  AuthCookieNotFound = 'authentication header not found',
  InternalError = 'internal error',
}

type UserID = string
type Username = string
type ChannelName = string
type Recipient = ChannelName | Username

export type WsHandlerSuccessClientLog = `${WsActionSuccess} ${Recipient}`
export type WsHandlerSuccessServerLog = `client ${UserID} (user ${Username}) ${WsHandlerSuccessClientLog}`

export type WsHandlerFailureClientLog = `${WsActionFailure} ${Recipient}: ${WsFailureCause}`
export type WsHandlerFailureServerLog = `client ${UserID} (user ${Username}) ${WsHandlerFailureClientLog}`

export type WsLifecycleHookSuccessClientLog = WsActionSuccess
export type WsLifecycleHookSuccessServerLog = `client ${UserID} (user ${Username}) ${WsLifecycleHookSuccessClientLog}`

export type WsLifecycleHookFailureClientLog = `${WsActionFailure}: ${WsFailureCause}`
export type WsLifecycleHookFailureServerLog = `client ${UserID} ${WsLifecycleHookFailureClientLog}`

// export class ChatResponse implements WsResponse {
//   event: WsActionSuccess
//   data: WsHandlerSuccessClientLog | WsLifecycleHookSuccessClientLog
// }
