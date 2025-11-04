const Interview = require("../models/Interview");
const { ok, fail } = require("../utils/responder");
const Logger = require("../utils/logger");

exports.generatePDFReport = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { interviewId } = req.params;

    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) {
      return fail(res, 404, "INTERVIEW_NOT_FOUND", "Interview not found");
    }

    if (interview.status !== "completed") {
      return fail(
        res,
        400,
        "INTERVIEW_NOT_COMPLETED",
        "Interview must be completed"
      );
    }

    // TODO: Implement PDF generation
    return ok(res, { message: "PDF generation not yet implemented" });
  } catch (error) {
    Logger.error("Generate PDF error:", error);
    return fail(res, 500, "PDF_GENERATION_FAILED", "Failed to generate PDF");
  }
};
