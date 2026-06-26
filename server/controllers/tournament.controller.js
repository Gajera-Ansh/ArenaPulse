// Tournament controller - handles tournament CRUD and status transitions

import Tournament from '../models/Tournament.js';

// POST /api/tournaments
export const createTournament = async (req, res, next) => {
  try {
    const { title, game, bracketType, maxTeams, startDate, endDate, prizePool, rules } = req.body;

    const tournament = await Tournament.create({
      title,
      game,
      bracketType,
      maxTeams,
      startDate,
      endDate,
      prizePool,
      rules,
      organizer: req.user._id,
    });

    res.status(201).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments
export const getAllTournaments = async (req, res, next) => {
  try {
    const { game, status } = req.query;
    const filter = {};

    if (game) filter.game = { $regex: game, $options: 'i' };
    if (status) filter.status = status;

    const tournaments = await Tournament.find(filter)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    next(error);
  }
};

// GET /api/tournaments/:id
export const getTournamentById = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'name email avatar');

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// PUT /api/tournaments/:id
export const updateTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const updated = await Tournament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tournaments/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    tournament.status = status;
    await tournament.save();

    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tournaments/:id
export const deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    if (tournament.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await Tournament.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Tournament deleted.' });
  } catch (error) {
    next(error);
  }
};
