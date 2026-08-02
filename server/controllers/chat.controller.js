import Message from '../models/Message.js';

export const getTournamentMessages = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    // Optional: verify tournament exists and is not completed/draft?
    // Let's just fetch messages. If it's empty, it's empty.
    const messages = await Message.find({ tournament: tournamentId })
      .sort({ createdAt: 1 }) // oldest first (so we can display top-down in UI)
      .populate('sender', 'name avatar role') // get sender details
      .limit(150); // limit to recent 150 messages

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};
