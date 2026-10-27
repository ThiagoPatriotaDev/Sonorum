// America/Recife is UTC-03 throughout the scheduling horizon (Brazil currently has no DST).
// All DB values use timestamptz/UTC; this conversion is only for local form inputs.
export const recifeLocalToUtc = (date, time) => new Date(`${date}T${time}:00-03:00`).toISOString();
export const intervalsOverlap = (a,b) =>
  Date.parse(a.starts_at) < Date.parse(b.ends_at) && Date.parse(a.ends_at) > Date.parse(b.starts_at);
export function isValidReservationInterval(slot, now=Date.now()) {
 if (!slot) return false;
 const start=Date.parse(slot.starts_at),end=Date.parse(slot.ends_at);
 return Number.isFinite(start)&&Number.isFinite(end)&&start>=now&&start<=now+120*864e5&&end-start>=30*60e3&&end-start<=8*360e4;
}
