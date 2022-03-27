require('dotenv').config();

const Hapi = require('@hapi/hapi');
const album = require('./api/albums');
const AlbumService = require('./services/postGres/AlbumService');
const SongService = require('./services/postGres/SongService');
const AlbumValidator = require('./validator/albums');
const SongValidator = require('./validator/songs');
const song = require('./api/songs');

const Jwt = require('@hapi/jwt');
const path = require('path');
const Inert = require('@hapi/inert');

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

// exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// uploads
const StorageService = require('./services/storage/StorageService');
const UploadsValidator = require('./validator/uploads');

// cache
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  const cacheService = new CacheService();
  const collaborationsService = new CollaborationsService();
  const activitiesService = new ActivitiesService();
  const playlistsService = new PlaylistsService(collaborationsService, activitiesService);
  const albumsService = new AlbumService(cacheService);
  const songsService = new SongService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const storageService = new StorageService(path.resolve(__dirname, 'api/uploads/file/images'));

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
    {
      plugin: Inert,
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
        storageService,
        uploadValidator: UploadsValidator,
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
      },
    },
    {
      plugin: _exports,
      options: {
        service: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
    // {
    //   plugin: uploads,
    //   options: {
    //     service: storageService,
    //     albumsService,
    //     validator: UploadsValidator,
    //   },
    // },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
