/* eslint-disable max-len */

const ClientError = require('../../exceptions/ClientError');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getSongsInPlaylistHandler = this.getSongsInPlaylistHandler.bind(this);
    this.deleteSongFromPlaylistHandler = this.deleteSongFromPlaylistHandler.bind(this);
  }
  async postPlaylistHandler(request, h) {
    try {
      this._validator.validatePostPlaylistPayload(request.payload);
      const {name} = request.payload;
      const {id: credentialId} = request.auth.credentials;

      const playlistId = await this._service.addPlaylist({name, owner: credentialId});

      const response = h.response({
        status: 'success',
        message: 'Playlist added successfully',
        data: {
          playlistId: playlistId,
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

  async getPlaylistsHandler(request) {
    const {id: credentialId} = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request, h) {
    try {
      const {id} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._service.verifyPlaylistOwner(id, credentialId);

      await this._service.deletePlaylistById(id);

      return {
        status: 'success',
        message: 'Playlist deleted successfully',
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

  async postSongToPlaylistHandler(request, h) {
    try {
      this._validator.validatePostSongToPlaylistPayload(request.payload);

      const {songId} = request.payload;
      const {id} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._service.verifySongId(songId);

      await this._service.verifyPlaylistAccess(id, credentialId);

      const resultId = await this._service.addSongToPlaylist(songId, id);

      const response = h.response({
        status: 'success',
        message: 'Playlist added successfully',
        data: {
          playlistId: resultId,
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

  async getSongsInPlaylistHandler(request, h) {
    try {
      const {id} = request.params;
      const {id: credentialId} = request.auth.credentials;

      await this._service.verifyPlaylistAccess(id, credentialId);

      const playlist = await this._service.getPlaylistSong(id, credentialId);
      return {
        status: 'success',
        data: {
          playlist,
        },
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

  async deleteSongFromPlaylistHandler(request, h) {
    try {
      const {id} = request.params;
      const {songId} = request.payload;
      const {id: credentialId} = request.auth.credentials;

      await this._service.verifyPlaylistAccess(id, credentialId);
      // await this._service.verifySongId(id);
      await this._service.deleteSongFromPlaylist(songId, id);

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

module.exports = PlaylistsHandler;
