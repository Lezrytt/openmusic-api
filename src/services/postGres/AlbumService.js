/* eslint-disable max-len */
const {nanoid} = require('nanoid');
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async getAlbumLikes(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return {likes: JSON.parse(result), isCache: 1};
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(album_id) as likes from user_album_likes WHERE album_id = $1 GROUP BY album_id',
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(result.rows[0]));

      if (result.rows[0] === undefined) {
        return {likes: {likes: '0'}};
      } else {
        return {likes: result.rows[0]};
      }
    }
  }

  async likeAlbum(albumId, userId) {
    const id = 'like-'+nanoid(16);
    const query = {
      text: 'SELECT * from user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      const query = {
        text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
        values: [id, userId, albumId],
      };

      const results = await this._pool.query(query);
      if (!results.rowCount) {
        throw new InvariantError('Gagal Like album');
      }
      return {like: 1};
    } else {
      const query = {
        text: 'DELETE FROM user_album_likes WHERE album_id = $1 and user_id = $2 RETURNING id',
        values: [albumId, userId],
      };

      const results = await this._pool.query(query);

      if (!results.rowCount) {
        throw new InvariantError('Gagal menghapus like');
      }

      await this._cacheService.delete(`likes:${albumId}`);

      return {like: 0};
    }
  }

  async addAlbumCover(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2',
      values: [coverUrl, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Cover gagal ditambahkan');
    }
  }

  async addAlbum({name, year}) {
    const id = 'album-'+nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE albums.id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    const querySongs = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [id],
    };

    const songs = await this._pool.query(querySongs);

    const merge = {
      ...result.rows[0],
      songs: [
        ...songs.rows,
      ],
    };

    if (!result.rows.length) {
      throw new NotFoundError('Album not found');
    }

    return merge;
  }

  async editAlbumById(id, {name, year}) {
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Fail to update album. Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Delete album failed. Id not found');
    }
  }
}

module.exports = AlbumService;
