require('dotenv').config();

const Hapi = require('@hapi/hapi');
const album = require('./api/albums');
const AlbumService = require('./services/postGres/AlbumService');
const SongService = require('./services/postGres/SongService');
const AlbumValidator = require('./validator/albums');
const SongValidator = require('./validator/songs');
const song = require('./api/songs');

const Jwt = require('@hapi/jwt');

// users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');

// playlists
const playlists = require('./api/playlist');
const PlaylistsService = require('./services/postgres/PlaylistsService');
const PlaylistsValidator = require('./validator/playlists');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationsValidator = require('./validator/collaborations');

// activities
const activities = require('./api/activities');
const ActivitiesService = require('./services/postGres/ActivitiesService');
const ActivitiesValidator = require('./validator/activities');

const init = async () => {
  const collaborationsService = new CollaborationsService();
  const activitiesService = new ActivitiesService();
  const playlistsService = new PlaylistsService(collaborationsService, activitiesService);
  const albumsService = new AlbumService();
  const songsService = new SongService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: song,
      options: {
        service: songsService,
        validator: SongValidator,
      },
    },
    {
      plugin: album,
      options: {
        service: albumsService,
        validator: AlbumValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: activities,
      options: {
        activitiesService,
        playlistsService,
        validator: ActivitiesValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
