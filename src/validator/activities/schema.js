const Joi = require('joi');

const ActivityPayloadSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
  action: Joi.string().required(),
  songId: Joi.string().required(),
});

module.exports = {ActivityPayloadSchema};
