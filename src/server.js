require('dotenv').config();

const Hapi = require('@hapi/hapi');
const album = require('./api/albums');
const AlbumService = require('./services/postGres/AlbumService');
const SongService = require('./services/postGres/SongService');
const AlbumValidator = require('./validator/albums');
const SongValidator = require('./validator/songs');
const song = require('./api/songs');

const init = async () => {
  const albumsService = new AlbumService();
  const songsService = new SongService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: album,
    options: {
      service: albumsService,
      validator: AlbumValidator,
    },
  });

  await server.register({
    plugin: song,
    options: {
      service: songsService,
      validator: SongValidator,
    },
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
