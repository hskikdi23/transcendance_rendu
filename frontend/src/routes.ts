import NotFound from './routes/NotFound.svelte'
import Chat from './routes/chat/Chat.svelte'
import Leaderboard from './routes/Leaderboard.svelte'
import Users from './routes/Users.svelte'
import Pong from './routes/pong/Pong.svelte'

export default {
  '/': Users,
  '/chat/:type?/:name?': Chat,
  '/leaderboard': Leaderboard,
  '/users/:name': Users,
  '/pong': Pong,
  '*': NotFound
};
