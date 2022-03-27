const ClientError = require('../../exceptions/ClientError');

class AlbumHandler {
  constructor(service, validator, storageService, uploadValidator) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;
    this._uploadValidator = uploadValidator;

    this.postAlbumHandler = this.postAlbumHandler.bind(this);
    this.getAlbumByIdHandler = this.getAlbumByIdHandler.bind(this);
    this.deleteAlbumByIdHandler = this.deleteAlbumByIdHandler.bind(this);
    this.putAlbumByIdHandler = this.putAlbumByIdHandler.bind(this);
    this.postAlbumCoverHandler = this.postAlbumCoverHandler.bind(this);
    this.postLikeAlbumsHandler = this.postLikeAlbumsHandler.bind(this);
    this.getLikeAlbumsHandler = this.getLikeAlbumsHandler.bind(this);
  }

  async postAlbumHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);
      const {name, year} = request.payload;

      const albumId = await this._service.addAlbum({name, year});

      const response = h.response({
        status: 'success',
        message: 'Album added successfully',
        data: {
          albumId,
        },
      });
      response.code(201);
      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // server ERROR
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getAlbumByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const album = await this._service.getAlbumById(id);
      return {
        status: 'success',
        data: {
          album,
        },
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // server error
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putAlbumByIdHandler(request, h) {
    try {
      this._validator.validateAlbumPayload(request.payload);

      const {id} = request.params;

      await this._service.editAlbumById(id, request.payload);

      return {
        status: 'success',
        message: 'Album updated',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // server error
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async deleteAlbumByIdHandler(request, h) {
    try {
      const {id} = request.params;
      await this._service.deleteAlbumById(id);

      return {
        status: 'success',
        message: 'Album deleted',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // server error
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postAlbumCoverHandler(request, h) {
    try {
      const {cover} = request.payload;
      const {id} = request.params;

      this._uploadValidator.validateImageHeaders(cover.hapi.headers);

      console.log(cover);

      const filename = await this._storageService.writeFile(cover, cover.hapi);

      const path = `http://${process.env.HOST}:${process.env.PORT}/albums/images/${filename}`;

      await this._service.addAlbumCover(id, path);

      const response = h.response({
        status: 'success',
        message: 'Sampul berhasil diunggah',
      });

      response.code(201);

      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async postLikeAlbumsHandler(request, h) {
    try {
      const {id} = request.params;

      await this._service.getAlbumById(id);

      const {id: credentialId} = request.auth.credentials; ;

      const {like} = await this._service.likeAlbum(id, credentialId);

      if (like == 1) {
        const response = h.response({
          status: 'success',
          message: 'Album berhasil disukai',
        });
        response.code(201);
        return response;
      } else {
        const response = h.response({
          status: 'success',
          message: 'Berhasil unlike album',
        });
        response.code(201);
        return response;
      }
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // Server ERROR!
      const response = h.response({
        status: 'error',
        message: 'Maaf, terjadi kegagalan pada server kami.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getLikeAlbumsHandler(request, h) {
    try {
      const {id} = request.params;
      const {likes, isCache = 0} = await this._service.getAlbumLikes(id);
      console.log(likes, isCache);

      const likesInInteger = parseInt(likes.likes);
      console.log(likesInInteger);
      const response = h.response({
        status: 'success',
        data: {
          likes: likesInInteger,
        },
      });

      if (isCache) response.header('X-data-source', 'cache');

      response.code(200);

      return response;
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h.response({
          status: 'fail',
          message: error.message,
        });
        response.code(error.statusCode);
        return response;
      }

      // server error
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures.',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
}

module.exports = AlbumHandler;
