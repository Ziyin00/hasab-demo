import { meetingConfig } from "../config/meeting.config";

export const useMeetingMinutes = () => {
  const processMeeting = async (file: File) => {
    console.log(`Processing meeting via ${meetingConfig.processing.endpoint}`, file);
  };

  return {
    processMeeting,
    config: meetingConfig,
  };
};
