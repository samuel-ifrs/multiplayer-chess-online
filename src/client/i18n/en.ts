export const en = {
  appName: 'Chess Online',
  tagline: 'Play real-time chess with friends',

  // nav
  nav_lobby: 'Lobby',
  nav_ranking: 'Ranking',
  nav_profile: 'Profile',
  nav_logout: 'Log out',
  lang_toggle: 'Português',

  // auth
  auth_welcome: 'Welcome',
  auth_subtitle: 'Choose a name to start playing',
  auth_login: 'Log in',
  auth_register: 'Sign up',
  auth_username: 'Username',
  auth_password: 'Password',
  auth_submit_login: 'Log in',
  auth_submit_register: 'Create account',
  auth_err_invalid_credentials: 'Wrong username or password.',
  auth_err_username_taken: 'That username is already taken.',
  auth_err_invalid_input: 'Username must be 3–32 chars; password at least 6.',
  auth_err_generic: 'Something went wrong. Please try again.',

  // lobby
  lobby_title: 'Open rooms',
  lobby_create: 'Create room',
  lobby_empty: 'No open rooms yet. Create one!',
  lobby_join: 'Join',
  lobby_players: '{n}/2 players',
  lobby_private: 'Private',
  lobby_refresh: 'Refresh',

  // create dialog
  create_title: 'Create a room',
  create_name: 'Room name',
  create_visibility: 'Visibility',
  create_public: 'Public',
  create_private: 'Private (password)',
  create_password: 'Password',
  create_time: 'Time control',
  create_color: 'Play as',
  create_white: 'White',
  create_black: 'Black',
  create_random: 'Random',
  create_submit: 'Create',
  create_cancel: 'Cancel',
  create_err: 'Could not create the room.',

  // join
  join_password_prompt: 'This room is private. Enter the password:',
  join_err_wrong_password: 'Wrong password.',
  join_err_full: 'This room is already full.',
  join_err_not_found: 'Room not found.',

  // room / game
  room_waiting: 'Waiting for an opponent to join…',
  room_share: 'Share this link to invite someone:',
  room_you: 'You',
  room_your_turn: 'Your turn',
  room_their_turn: "Opponent's turn",
  room_white: 'White',
  room_black: 'Black',
  room_resign: 'Resign',
  room_offer_draw: 'Offer draw',
  room_draw_offered_you: 'Draw offered — waiting for a reply…',
  room_draw_offered_them: 'Your opponent offers a draw.',
  room_accept: 'Accept',
  room_decline: 'Decline',
  room_draw_declined: 'Draw declined.',
  room_opponent_left: 'Opponent disconnected — 30s to return…',
  room_opponent_back: 'Opponent reconnected.',
  room_confirm_resign: 'Resign this game?',
  room_back_lobby: 'Back to lobby',

  // chat
  chat_title: 'Chat',
  chat_placeholder: 'Type a message…',
  chat_send: 'Send',

  // results
  result_you_win: 'You won!',
  result_you_lose: 'You lost.',
  result_draw: 'Draw.',
  reason_checkmate: 'by checkmate',
  reason_resign: 'by resignation',
  reason_timeout: 'on time',
  reason_abandon: 'by abandonment',
  reason_stalemate: 'by stalemate',
  reason_draw_agreed: 'by agreement',
  reason_draw_repetition: 'by repetition',
  reason_draw_insufficient: 'by insufficient material',
  reason_draw_fifty_move: 'by the fifty-move rule',

  // ranking
  ranking_title: 'Leaderboard',
  ranking_rank: '#',
  ranking_player: 'Player',
  ranking_wins: 'Wins',
  ranking_losses: 'Losses',
  ranking_draws: 'Draws',
  ranking_winrate: 'Win %',
  ranking_games: 'Games',
  ranking_empty: 'No games played yet.',

  // profile
  profile_title: "{name}'s profile",
  profile_stats: 'Statistics',
  profile_history: 'Match history',
  profile_no_games: 'No games yet.',
  profile_vs: 'vs',
  profile_result_win: 'Win',
  profile_result_loss: 'Loss',
  profile_result_draw: 'Draw',
  profile_not_found: 'Player not found.',

  common_loading: 'Loading…'
} as const;

export type I18nKey = keyof typeof en;
export type Dict = Record<I18nKey, string>;
