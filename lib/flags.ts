export const toBool = (val: string | undefined): boolean =>
  val?.toLowerCase().trim() === "true";

export const flags = {
  adsEnabled: toBool(process.env.NEXT_PUBLIC_ADS_ENABLED),
} as const;
