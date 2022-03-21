const {nanoid} = require('nanoid');
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const ClientError = require('../../exceptions/ClientError');

class SongService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({name, owner}) {
    const id = 'playlist-'+nanoid(16);

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Fail to add playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const queryCollab = {
      text: `SELECT playlist_id from collaborations where user_id = $1`,
      values: [owner],
    };
    const result2 = await this._pool.query(queryCollab);

    let playlistId = '';
    if (result2.rows.length) {
      const result = result2.rows[0].playlist_id;
      playlistId = result;
    }
    const query = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      LEFT JOIN users ON users.id = playlists.owner
      WHERE owner = $1 or playlists.id = $2`,
      values: [owner, playlistId],
    };

    const result = await this._pool.query(query);

    console.log();

    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Delete failed. Id not found');
    }
  }

  async addSongToPlaylist(songId, playlistId) {
    const id = 'playlist_song-' + nanoid(16);
    const query = {
      text: 'INSERT INTO songs_in_playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, songId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Fail to add song to playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSong(id, owner) {
    const queryCollab = {
      text: `SELECT playlist_id from collaborations
      WHERE playlist_id = $1 and user_id = $2`,
      values: [id, owner],
    };

    const collabResult = await this._pool.query(queryCollab);

    const playlistId = collabResult.rows[0].playlist_id;

    const query1 = {
      text: `SELECT playlists.id, playlists.name, users.username FROM playlists
      INNER JOIN users ON users.id = playlists.owner 
      WHERE playlists.id = $3 OR owner = $1 and playlists.id = $2`,
      values: [owner, id, playlistId],
    };

    const query2 = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
      LEFT JOIN songs_in_playlists
      ON songs_in_playlists.song_id = songs.id
      WHERE songs_in_playlists.playlist_id = $1 or songs_in_playlists.playlist_id = $2`,
      values: [id, playlistId],
    };

    const result = await this._pool.query(query1);

    const songs = await this._pool.query(query2);

    const combine = {
      ...result.rows[0],
      songs: [
        ...songs.rows],
    };

    if (!result.rows.length) {
      throw new NotFoundError('Playlist not found');
    }

    return combine;
  }

  async deleteSongFromPlaylist(id, playlistId) {
    const query = {
      text: 'DELETE FROM songs_in_playlists WHERE song_id = $1 AND playlist_id = $2 RETURNING id',
      values: [id, playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new ClientError('Delete failed. Id not found');
    }
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist not found');
    }
    const playlist = result.rows[0];
    if (playlist.owner !== userId) {
      throw new AuthorizationError('You don\'t have the right to access this resource');
    }
  }

  async verifySongId(id) {
    const query = {
      text: 'select * from songs where id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError(' not found');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = SongService;
