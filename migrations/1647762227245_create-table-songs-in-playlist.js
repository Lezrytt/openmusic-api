/* eslint-disable linebreak-style */
/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('songs_in_playlists', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    song_id: {
      type: 'TEXT',
      notNull: true,
      references: 'songs',
    },
    playlist_id: {
      type: 'TEXT',
      notNull: true,
      references: 'playlists',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('songs_in_playlists');
};
