export type GetAvailabilityRulesDto = {
  day: string;
  slots: { startTime: string; endTime: string }[];
}[];
