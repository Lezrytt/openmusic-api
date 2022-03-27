class Listener {
  constructor(PlaylistsService, mailSender) {
    this._playlistService = PlaylistsService;
    this._mailSender = mailSender;

    this.listen = this.listen.bind(this);
  }

  async listen(message) {
    try {
      const {userId, playlistId, targetEmail} = JSON.parse(message.content.toString());

      const playlists = await this._playlistService.getPlaylists(playlistId, userId);
      const result = await this._mailSender.sendEmail(targetEmail, JSON.stringify(playlists));
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Listener;
