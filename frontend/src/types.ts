export type User = {
  id: number
  username: string
  password: string
  mmr: number
  games: number
  ft_login: string
  date: Date
  blocked: { id: number, username: string }[]
  blockedBy: { id: number, username: string }[]
  friends: { id: number, username: string }[]
  friendOf: { id: number, username: string }[]
  pendingFriends: { id: number, username: string }[]
  requestFriends: { id: number, username: string }[]
  TwoFA: boolean
}

// mirrors prisma
export enum ChannelStatus {
  Public = "Public",
  Private = "Private",
  Protected = "Protected",
}

export type Channel = {
  id: number
  name: string
  ownerId: number
  owner: User
  users: User[]
  admins: User[]
  posts: PostEmitDto[]
  status: ChannelStatus
  date: Date
}

export type ChannelBis = Channel & {
  joined: boolean
}

// mirrors backend
export type ChannelDto = {
  channelName: string
  status: ChannelStatus
  password: string
}

// mirrors backend
export type PostEmitDto = {
  channelName: string
  content: string
  author: string
}

export type newPostEmitDto = {
  channelName: string
  content: string
  author: User
  date: Date
}

// mirros the object backend sends with `throw new WsException()`
export type WsException = {
  status: string
  message: string
}

// mirrors backend
export type ChatResponse = {
  event: string
  data: string
}

export type DirectMessage = {
  content: string
  sender: string
  recipient: string
  date: Date
}

export type Match = {
  id:         number
  winnerId:   number
  winnerScore:number
  loserId:    number
  loserScore: number
  date:       Date
  ranked:     Boolean
}

export type Stat = {
  lostGames: number
  wonGames: number
  totalGames: number
  ratioGames: number
  mmr: {mmr: number, date: Date}[] | null
  averageWin: {score: number, opponentScore: number}
  averageLose: {score: number, opponentScore: number}
  nbrOfFriends: number
}

// mirrors backend
export enum Status {
  offline,
  online,
  ingame,
}

// mirrors backend
export type CreateUserDto = {
  username: string
  password: string
  ft_login: string
}