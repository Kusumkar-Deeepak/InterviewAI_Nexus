import InterviewRecord from '../models/InterviewRecord.js';

export const createInterviewRecord = async (req, res) => {
  try {
    const record = new InterviewRecord({
      ...req.body,
      status: 'completed',
      endTime: new Date()
    });

    await record.save();

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to save interview record'
    });
  }
};

export const getInterviewRecords = async (req, res) => {
  try {
    const records = await InterviewRecord.find({ interviewLink: req.params.interviewLink });
    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview records'
    });
  }
};