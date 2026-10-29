# AI Desktop Pet (Pip)

A small animated pet that lives on top of your desktop, visits you with reminders (water, stretch, break, check-in), and chats with you.

## Run it (no coding needed)
1. Install **Node.js (LTS)** from https://nodejs.org (one time).
2. **Windows:** double-click `Start Pet.bat`. **Mac:** double-click `Start Pet.command` (first time: right-click > Open).
3. The first run downloads the app (needs internet, 1-3 minutes). After that it starts quickly.

Pip walks in after a moment. Look for the round **summon button** at the right screen edge and the **tray icon** (Windows: bottom-right near the clock; Mac: top menu bar).

## Using it
- **Click Pip** to chat. **Click the round button** (or tray icon) to call Pip. **Drag the button** anywhere; it stays on screen.
- **Tray menu:** Summon Pet, Chat, Settings, Pause Pet (30 min / 1 hour / until tomorrow / Resume), Quit.
- **Pause:** stops automatic visits only. Summoning still works.
- **Settings:** enable/disable, visit and water frequency, check-ins, sound, speed, size, AI chat, API key, start with computer, always on top, quiet hours.

## If Pip or the button disappears
Double-click `Bring On Screen.bat` (Windows) or `Bring On Screen.command` (Mac). It resets positions and re-enables the pet.

## AI mode (optional)
Open Settings, switch on **AI chat**, paste your OpenAI API key, Save. The key is stored encrypted by your operating system and never written in the code. Without a key, Pip uses built-in Basic replies. Personality and model live in `config/personality.json`; reminder texts and basic replies in `config/messages.json`.

## Change the look
The pet is an SVG inside `src/pet.html` (find `id="sprite"`). Replace it with your own image, e.g. `<image href="../assets/pet.png" width="120" height="120"/>`, or draw sprite frames there. Animations (breathing, hopping, turning, blinking) are CSS/JS in the same file.

## Files
`src/main.js` windows, tray, timers, settings, AI | `src/pet.html` pet, bubble, chat | `src/button.html` summon button | `src/settings.html` settings | `config/` editable text. Settings are saved in your user profile (`settings.json`).

## Troubleshooting
- Nothing appears: run `Bring On Screen`, and check the tray icon.
- Mac asks for permission: allow it in System Settings > Privacy & Security.
