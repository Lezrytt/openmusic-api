const {Pool} = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getPlaylists(id, owner) {
    const playlistId = id;

    const query1 = {
      text: `SELECT playlists.id, playlists.name FROM playlists
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
      playlist: {
        ...result.rows[0],
        songs: [
          ...songs.rows],
      }
    };

    return combine;
  }
}

module.exports = PlaylistsService;
