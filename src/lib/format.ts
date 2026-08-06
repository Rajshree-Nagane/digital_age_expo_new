const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/** e.g. "26 to 28 August 2026, Online Virtual Event" */
export function formatDateLocation(
  dateStart: Date,
  dateEnd: Date | null | undefined,
  venue: string | null | undefined
): string {
  const startDay = dateStart.getDate();
  const month = dateStart.toLocaleString("en-GB", { month: "long" });
  const year = dateStart.getFullYear();

  const range =
    dateEnd && dateEnd.getDate() !== startDay
      ? `${startDay} to ${dateEnd.getDate()} ${month} ${year}`
      : `${startDay} ${month} ${year}`;

  return venue ? `${range}, ${venue}` : range;
}

export function formatDayRange(dateStart: Date, dateEnd: Date | null | undefined): string {
  if (!dateEnd) return MONTH_DAY_YEAR.format(dateStart);
  const startDay = dateStart.toLocaleString("en-GB", { weekday: "long" });
  const endDay = dateEnd.toLocaleString("en-GB", { weekday: "long" });
  return `${startDay} to ${endDay}`;
}

export function formatMonthDayYear(dateStart: Date, dateEnd: Date | null | undefined): string {
  if (!dateEnd) return MONTH_DAY_YEAR.format(dateStart);
  const startLabel = dateStart.toLocaleString("en-GB", { month: "short", day: "2-digit" });
  const endLabel = dateEnd.toLocaleString("en-GB", { month: "short", day: "2-digit" });
  return `${startLabel} to ${endLabel}, ${dateEnd.getFullYear()}`;
}
