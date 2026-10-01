// The squad. Colors are the validated categorical slots from the data-viz
// palette (light + dark steps, each mode selected rather than auto-flipped),
// extended past the base 8 for an 18-person roster and re-validated as a set
// (scripts/validate_palette.js) in this exact order — reordering the array
// can reopen an adjacent-pair collision, so append new people at the end.
// A person's color is fixed to the person, never to their rank — and every
// place a color appears, the name and emoji appear with it, so identity is
// never carried by hue alone.

export type Participant = {
  id: number
  name: string
  emoji: string
  /** categorical slot, light surface */
  light: string
  /** same hue, stepped for the dark surface */
  dark: string
}

export const PARTICIPANTS: Participant[] = [
  { id: 1, name: 'Shruti', emoji: '🦋', light: '#2a78d6', dark: '#3987e5' },
  { id: 2, name: 'Delilah', emoji: '🌊', light: '#eb6834', dark: '#d95926' },
  { id: 3, name: 'Rasika', emoji: '🌿', light: '#1baf7a', dark: '#199e70' },
  { id: 4, name: 'Sweta', emoji: '☀️', light: '#eda100', dark: '#c98500' },
  { id: 5, name: 'Oindrilla', emoji: '🌸', light: '#e87ba4', dark: '#d55181' },
  { id: 6, name: 'Fatima', emoji: '🍀', light: '#008300', dark: '#008300' },
  { id: 7, name: 'Nehali', emoji: '🔮', light: '#4a3aa7', dark: '#9085e9' },
  { id: 8, name: 'Sajal', emoji: '⭐', light: '#e34948', dark: '#e66767' },
  { id: 13, name: 'Mariola', emoji: '🌙', light: '#0e93a6', dark: '#1f9cb3' },
  { id: 14, name: 'Roshni', emoji: '✨', light: '#b13a55', dark: '#d35b76' },
  { id: 12, name: 'Janet', emoji: '🍁', light: '#7c9a00', dark: '#7a9c17' },
  { id: 11, name: 'Angela', emoji: '🌺', light: '#a23fae', dark: '#c463d1' },
  { id: 10, name: 'Sunita', emoji: '🌻', light: '#a15c2e', dark: '#c17d4a' },
  { id: 9, name: 'Judith', emoji: '🦄', light: '#00897b', dark: '#1fa593' },
  { id: 15, name: 'Shefali', emoji: '🌷', light: '#b8860b', dark: '#ad8118' },
  { id: 16, name: 'Puspa', emoji: '🪷', light: '#b0228f', dark: '#d04fb3' },
  { id: 17, name: 'Shweta', emoji: '🕊️', light: '#9c4221', dark: '#c2642f' },
  { id: 18, name: 'Sarika', emoji: '🐚', light: '#3d6ea5', dark: '#4d85c9' },
]

export const byId = new Map(PARTICIPANTS.map((p) => [p.id, p]))

export function participant(id: number): Participant {
  return byId.get(id) ?? PARTICIPANTS[0]
}
