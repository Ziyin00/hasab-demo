import { meetingConfig } from "../config/meeting.config";
import { submitMeetingMinutesUpload } from "../api/meeting.api";

export const useMeetingMinutes = () => {
  return {
    config: meetingConfig,
    submitMeetingMinutesUpload,
  };
};
