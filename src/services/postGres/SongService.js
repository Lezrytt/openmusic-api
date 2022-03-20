/* eslint-disable max-len */
const {nanoid} = require('nanoid');
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const {mapSongDBToModel} = require('../../utils');

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({title, year, performer, genre, duration, albumId}) {
    const id = 'song-'+nanoid(16);

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Fail to add song');
    }

    return result.rows[0].id;
  }

  async getSongs(title, performer) {
    const query1 = {
      text: 'SELECT id, title, performer FROM songs WHERE title ILIKE \'%\' || $1 || \'%\' AND performer ILIKE \'%\' || $2 || \'%\'',
      values: [title, performer],
    };

    const query2 = {
      text: 'SELECT id, title, performer FROM songs',
    };

    const query3 = {
      text: 'SELECT id, title, performer FROM songs WHERE title ILIKE \'%\' || $1 || \'%\'',
      values: [title],
    };

    const query4 = {
      text: 'SELECT id, title, performer FROM songs WHERE performer ILIKE \'%\' || $1 || \'%\'',
      values: [performer],
    };

    let query;

    if ( title != null && performer == null) {
      query = query3;
    } else if (title == null && performer != null ) {
      query = query4;
    } else if (title!= null && performer != null) {
      query = query1;
    } else {
      query = query2;
    }

    const result = await this._pool.query(query);
    return result.rows.map(mapSongDBToModel);
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Song not found');
    }

    return result.rows.map(mapSongDBToModel)[0];
  }

  async editSongById(id, {title, year, performer, genre, duration, albumId}) {
    const query = {
      // eslint-disable-next-line max-len
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id',
      values: [title, year, performer, genre, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Song not found');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Delete failed. Id not found');
    }
  }
}

module.exports = SongService;
