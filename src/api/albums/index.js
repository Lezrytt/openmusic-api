const AlbumHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'album',
  version: '1.0.0',
  register: async (server, {service, validator, storageService, uploadValidator}) => {
    const albumHandler = new AlbumHandler(service, validator, storageService, uploadValidator);
    server.route(routes(albumHandler));
  },
};
