// The squad. Colors are the validated categorical slots 1-7 from the data-viz
// palette (light + dark steps, each mode selected rather than auto-flipped).
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
]

export const byId = new Map(PARTICIPANTS.map((p) => [p.id, p]))

export function participant(id: number): Participant {
  return byId.get(id) ?? PARTICIPANTS[0]
}
