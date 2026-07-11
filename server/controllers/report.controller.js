import Report from '../models/Report.js';
import User from '../models/User.js';

// POST /api/reports
export const createReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason, description, evidenceUrl } = req.body;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself.' });
    }

    const report = await Report.create({
      reportedUser: reportedUserId,
      reportedBy: req.user._id,
      reason,
      description,
      evidenceUrl
    });

    res.status(201).json({ success: true, message: 'Report submitted successfully.', data: report });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports
export const getAllReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const reports = await Report.find(filter)
      .populate('reportedUser', 'name email avatar banned')
      .populate('reportedBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reports/:id/status
export const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.status = status || report.status;
    if (adminNotes !== undefined) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    res.status(200).json({ success: true, message: 'Report updated.', data: report });
  } catch (error) {
    next(error);
  }
};
