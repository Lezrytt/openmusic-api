/* eslint-disable max-len */

const ClientError = require('../../exceptions/ClientError');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.getSongsHandler = this.getSongsHandler.bind(this);
    this.postSongHandler = this.postSongHandler.bind(this);
    this.getSongByIdHandler = this.getSongByIdHandler.bind(this);
    this.putSongByIdHandler = this.putSongByIdHandler.bind(this);
    this.deleteSongByIdHandler = this.deleteSongByIdHandler.bind(this);
  }

  async postSongHandler(request, h) {
    try {
      this._validator.validateSongPayload(request.payload);
      const {title, year, performer, genre, duration, albumId} = request.payload;

      const songId = await this._service.addSong({title, year, performer, genre, duration, albumId});

      const response = h.response({
        status: 'success',
        message: 'Song added successfully',
        data: {
          songId,
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
      // server error
      const response = h.response({
        status: 'error',
        message: 'Sorry, server failures',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async getSongsHandler(request, h) {
    const {title, performer} = request.query;
    const songs = await this._service.getSongs(title, performer);
    return {
      status: 'success',
      data: {
        songs,
      },
    };
  }

  async getSongByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const song = await this._service.getSongById(id);
      return {
        status: 'success',
        data: {
          song,
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
        message: 'Sorry, server failures',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }

  async putSongByIdHandler(request, h) {
    try {
      this._validator.validateSongPayload(request.payload);
      const {id} = request.params;

      await this._service.editSongById(id, request.payload);

      return {
        status: 'success',
        message: 'Song added successfully',
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
        message: 'Sorry, server failures',
      });
      response.code(500);
      console.error(error);
      return response;
    }
  }
  async deleteSongByIdHandler(request, h) {
    try {
      const {id} = request.params;
      await this._service.deleteSongById(id);

      return {
        status: 'success',
        message: 'Song deleted successfully',
      };
    } catch (error) {
      if (error instanceof ClientError) {
        const response = h. response({
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

module.exports = SongsHandler;
