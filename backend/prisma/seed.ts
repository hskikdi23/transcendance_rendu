import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt';
import * as fs from 'fs'

const prisma = new PrismaClient()

function randomString(): string {
  return Math.random().toString(36).slice(2).substring(0,7)
}

function randomNumber(): number {
  return Math.floor(Math.random() * (150 - 0) + 0)
}

async function deleteUser(user: any) {
  return prisma.user.delete({
    where: { id: user.id }
  })
}

async function deleteChannel(channel: any) {
  return prisma.channel.delete({
    where: { id: channel.id }
  })
}

async function main() {

  // get db data
  const users = await prisma.user.findMany()
  const channels = await prisma.channel.findMany()

  // clear db data
  await Promise.all(users.map((user) => deleteUser(user)))
  await Promise.all(channels.map((channel) => deleteChannel(channel)))

  // create root user
  const root = await prisma.user.create({
    data: {
      username: 'root',
      password: await bcrypt.hash('root', 2),
      games: randomNumber(),
      mmr: randomNumber()
    }
  })
  fs.mkdirSync(`/app/images/root`)


  if (root === null) return

  // create a channel owned by root
  const channel = await prisma.channel.create({
    data: {
      name: 'test',
      ownerId: root.id,
      admins: { connect: { id: root.id } },
      users: { connect: { id: root.id } },
      status: 'Public',
      password: ''
    }
  })

  if (channel === null) return

  // create other users
  for (let i = 0; i < 21; i++) {
    let user = await prisma.user.create({
      data: {
        username: randomString(),
        password: await bcrypt.hash('pass', 2),
        games: randomNumber(),
        mmr: randomNumber()
      }
    })
    fs.mkdirSync(`/app/images/${user.id}`)
    if (i % 3 === 0) {
      // add admin
      await prisma.channel.update({
        where: { id: channel.id },
        data: {
          admins: { connect: { username: user.username } },
          users: { connect: { username: user.username } }
        }
      })
    } else {
      // add regular member
      await prisma.channel.update({
        where: { id: channel.id },
        data: { users: { connect: { username: user.username } } }
      })
    }
    // say hello
    await prisma.post.create({
      data: {
        content: randomString(),
        authorId: user.id,
        channelId: channel.id,
      }
    })
  }

}

main()
  .then(async (s: any) => {
    await prisma.$disconnect()
    console.log(s)
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })