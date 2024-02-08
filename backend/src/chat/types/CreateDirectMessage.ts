import { DirectMessage } from "@prisma/client"

export type CreateDirectMessage = Omit<DirectMessage, 'id'>