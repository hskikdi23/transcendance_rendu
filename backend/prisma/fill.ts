import { PrismaClient} from '@prisma/client'

const numberOfUsers = 10 // How many user do you want to add ?
const yourUsername = "test" // Your username

  type User = {
    id: number
    username: string
    password: string
    mmr: number
    games: number
    ft_login: string | null
    friends: { id: number, username: string }[]
    friendOf: { id: number, username: string }[]
    pendingFriends: { id: number, username: string }[]
    requestFriends: { id: number, username: string }[]
    wins: { id: number, winnerScore: number, loserScore: number}[]
    loses: { id: number, winnerScore: number, loserScore: number}[]
    TwoFA: boolean,
    ownedChannels: {id: number}[],
  }

let tab = new Array<User>();

const prisma = new PrismaClient()

function randomUsername(): string {
		let result = '-t-';
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const numbers = '0123456789';
		let usernameSize = Math.floor(Math.random() * (10 - 1) + 1);
		for(let i:number = 0; i < usernameSize; i++) {
			result += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		for(let i:number = 0; i < 2; i++) {
			result += numbers.charAt(Math.floor(Math.random() * numbers.length));
		}
		return result;
  }

function randomChanName(): string {
  let result = '-t-';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let nameSize = Math.floor(Math.random() * (10 - 1) + 1);

  for(let i:number = 0; i < nameSize; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function randomString(): string {
  return Math.random().toString(36).slice(2).substring(0,7)
}

function randomNumber(): number {
  return Math.floor(Math.random() * (150 - 0) + 0)
}


async function createrelation(user1: number, user2: number) {
  let random = Math.floor(Math.random() * (3 - 0) + 0)
  if (random == 0)
    await createFriends(user1,  user2)
  if (random == 1)
    createRequest(user1, user2)
  if (random == 2)
    createpending(user1, user2)

}

async function createpending(user1: number, user2: number) {
  try {
      await prisma.user.update({
        where: {
        id: tab[user2].id
      },
      data: {
        pendingFriends: {
          connect: { id: tab[user1].id }
        }
      }
    })
    let user;
    if ((user = await getUser(tab[user1].username)) != null)
      tab[user1] = user;
    if ((user = await getUser(tab[user2].username)) != null)
      tab[user2] = user;
  } catch (e) {
    console.log("createpending Failed")
  }
}


async function createRequest(user1: number, user2: number) {
  try {
    await prisma.user.update({
      where: {
        id: tab[user1].id
      },
      data: {
        pendingFriends: {
          connect: { id: tab[user2].id }
        }
      }
    });
    let user;
    if ((user = await getUser(tab[user1].username)) != null)
      tab[user1] = user;
    if ((user = await getUser(tab[user2].username)) != null)
      tab[user2] = user;
  } catch (e) {
    console.log("createrequest Failed")
  }
}

async function createFriends(user1: number, user2: number) {
    try {
      await prisma.user.update({
      where: {
        id: tab[user1].id
      },
      data: {
        friends: {
          connect: [{ id: tab[user2].id }]
        },
        friendOf: {
          connect: [{ id: tab[user2].id }]
        },
      },
    });
    let user;
    if ((user = await getUser(tab[user1].username)) != null)
      tab[user1] = user;
    if ((user = await getUser(tab[user2].username)) != null)
      tab[user2] = user;
  } catch (e) {
    console.log("createrfriends Failed")
  }

}

function getNumberOfConnection(user: User): number
{
  let ret: number = 0
  if (user.friends != null)
    ret += user.friends.length
  if (user.requestFriends != null)
    ret += user.requestFriends.length
  if (user.pendingFriends != null)
    ret += user.pendingFriends.length

  return ret
}

function RelationBetween(user1: User, user2:number):boolean
{
  if (user1.friends != null && user1.friends.find(({id}) => id == tab[user2].id) )
    return true
  if (user1.requestFriends != null && user1.requestFriends.find(({id}) => id == tab[user2].id) )
    return true
  if (user1.pendingFriends != null && user1.pendingFriends.find(({id}) => id == tab[user2].id) )
    return true
  return false
}

function RelationMatchBetween(user1: User, user2:number):boolean
{
  if (user1.wins != null && user1.wins.find(({id}) => id == tab[user2].id) )
    return true
  if (user1.loses != null && user1.loses.find(({id}) => id == tab[user2].id) )
    return true
  return false
}

async function createMatchrelation(user1: number, user2: number) {

    let winnerCoin = Math.random() < 0.5
    let rankedCoin = Math.random() < 0.9
    let loserScore = Math.floor(Math.random() * (10 - 0) + 0)

    let winner: number;
    let loser: number;

    if (winnerCoin)
    {
      winner = user1;
      loser = user2;
    }
    else
    {
      winner = user2;
      loser = user1;
    }


  await prisma.match.create({
    data: {
      winnerId: tab[winner].id,
      winnerScore: 10,
      loserId: tab[loser].id,
      loserScore: loserScore,
      ranked: rankedCoin,
    },
  })
  let user;
    if ((user = await getUser(tab[user1].username)) != null)
      tab[user1] = user;
    if ((user = await getUser(tab[user2].username)) != null)
      tab[user2] = user;
}

async function createChannel(user1: number)
{
  try {

   await prisma.channel.create({
      data: {
        name: randomChanName(),
        ownerId: tab[user1].id,
        admins: { connect: { id: tab[user1].id } },
        users: { connect: { id: tab[user1].id } },
        status: "Public",
        password: ""
      }
    })
  } catch (e){}
}

function joinChan(user2: number, user1: number)
{
  prisma.channel.update({
    where: {
      id: tab[user1].ownedChannels[0]?.id
    },
    data: {
      users: {
        connect: {
          id: tab[user2].id
        }
      }
    }
  })
}


async function getUser(name: string) {
  return prisma.user.findUnique({
    where: {
      username: name,
    },
    include: {
      pendingFriends: {
        select: {
          id: true,
          username: true
        }
      },
      requestFriends: {
        select: {
          id: true,
          username: true
        }
      },
      friends: {
        select: {
          id: true,
          username: true
        }
      },
      friendOf: {
        select: {
          id: true,
          username: true
        }
      },
      channels: true,
      wins: true,
      loses:true,
      ownedChannels: true
    }
  })
}

async function createUser() {
  const user = await prisma.user.create({
    data: {
      username: randomUsername(),
      password: '',
      games: randomNumber(),
      mmr: randomNumber(),
    },
    include: {
      pendingFriends: {
        select: {
          id: true,
          username: true
        }
      },
      requestFriends: {
        select: {
          id: true,
          username: true
        }
      },
      friends: {
        select: {
          id: true,
          username: true
        }
      },
      friendOf: {
        select: {
          id: true,
          username: true
        }
      },
      channels: true,
      wins: true,
      loses:true,
      ownedChannels: true


    }
  })
  tab.push(user)
  return user;
}


async function main() {

  // Adding your user to the list
  console.log("Adding your user to the list")
  const user = await getUser(yourUsername)
  if (user !== null)
    tab.push(user)
  else
  {
    console.log("Please set yourUsername variable")
    return
  }

  // Users creation
  console.log("Users creation")
  for (let i = 0; i < numberOfUsers; i++) {
    await createUser()
  }

  //Connect friends
  console.log("Connect friends")
  for (let user1 = 0; user1 < tab.length; user1++)
    for ( let user2 = 0; user2 < tab.length; user2++)
    {
      if (user1 != user2 && !(RelationBetween(tab[user1], user2)))
      {
        await createrelation(user1, user2);
      }
    }

  // Connect Match
  console.log("Connect Match")
  for (let user1 = 0; user1 < tab.length; user1++)
    for ( let user2 = 0; user2 < tab.length; user2++)
    {
      if (user1 != user2 && !(RelationMatchBetween(tab[user1], user2)))
      {
        await createMatchrelation(user1, user2);
      }
    }

  // Connect Channels
  console.log("Connect Channels")
  for (let user1 = 0; user1 < tab.length; user1++)
  {
    createChannel(user1)
    for ( let user2 = 0; user2 < tab.length; user2++)
    {
      //join user1 chan
      if (user1 != user2)
      {
        joinChan(user2, user1)
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })