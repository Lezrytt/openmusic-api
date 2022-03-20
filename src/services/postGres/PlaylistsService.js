const {nanoid} = require('nanoid');
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class SongService {
  constructor() {
    this._pool = new Pool();
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
    const query = {
      text: 'SELECT id, name, owner FROM playlists WHERE owner = $1',
      values: [owner],
    };

    const result = await this._pool.query(query);
    return result;
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
    const nanoid = 'playlist_song-' + nanoid(16);
    const query = {
      text: 'INSERT INTO songs_in_playlists VALUES($1, $2, $3) RETURNING id',
      values: [nanoid, songId, playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Fail to add song to playlist');
    }

    return result.rows[0].id;
  }

  async getPlaylistSong(id, owner) {
    const query1 = {
      text: 'SELECT id, name, owner FROM playlists WHERE id = $1 AND owner = $2',
      values: [id, owner],
    };

    const query2 = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs 
      LEFT JOIN songs_in_playlists 
      ON songs_in_playlists.song_id = songs.id
      WHERE songs_in_playlists.playlist_id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query1);

    const songs = await this._pool.query(query2);

    const combine = {
      ...result.rows[0],
      songs: [
        ...songs.rows],
    };

    if (!result.rows.length) {
      throw new NotFoundError('Album not found');
    }

    return combine;
  }

  async deleteSongFromPlaylist(id) {
    const query = {
      text: 'DELETE FROM songs_in_playlists WHERE song_id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Delete failed. Id not found');
    }
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('playlist tidak ditemukan');
    }
    const note = result.rows[0];
    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }
}

module.exports = SongService;
