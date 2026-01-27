export type UpdateAvailabilityRulesDto = {
  day: string;
  slots: { startTime: string; endTime: string }[];
}[];
