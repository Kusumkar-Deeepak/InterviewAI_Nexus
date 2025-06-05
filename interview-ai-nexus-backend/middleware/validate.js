export const validateInterviewInput = (req, res, next) => {
  const { applicantName, jobTitle, jobDescription, resumeText } = req.body;

  if (!applicantName || !jobTitle || !jobDescription || !resumeText) {
    return res.status(400).json({
      error: 'Missing required fields: applicantName, jobTitle, jobDescription, or resumeText'
    });
  }

  next();
};