// ---- Enhanced keyword lexicon (Moodify-inspired, simplified to our 5 vibes) ----
const vibeDictionary = [
  { vibe: "anxious",
    keywords: ["worried","nervous","scared","panic","pressure","overthink","anxious","stressed","overwhelmed","tense","fear","uneasy"],
    message: "You’re allowed to feel overwhelmed. Let’s slow down together for a moment." },

  { vibe: "sad",
    keywords: ["sad","lonely","cry","hurt","empty","down","depressed","heartbroken","blue","upset","drained"],
    message: "Your feelings make sense. You don’t have to hold them alone right now." },

  { vibe: "calm",
    keywords: ["peace","quiet","soft","relaxed","present","grounded","breathe","still","ease","gentle","soothed","centered"],
    message: "There’s a gentle ease in your words. Stay close to this softness." },

  { vibe: "focused",
    keywords: ["work","goal","build","progress","learning","improving","studying","creating","organize","plan","focus","clarity"],
    message: "You’re organizing your thoughts beautifully. Keep your pace; you’re doing fine." },

  { vibe: "happy",
    keywords: ["happy","joy","excited","grateful","love","content","smile","glowing","bright","delighted","cheerful"],
    message: "It’s warm to see this light in your words. Let it linger." }
];

// ---- Elements ----
const textarea = document.getElementById("journal");
const skipBtn = document.getElementById("skipButton");
const muteBtn = document.getElementById("muteButton");
const bubble = document.getElementById("supportiveBubble");

// ---- Audio (two elements for crossfade) ----
let currentAudio = new Audio("sounds/calm_1.wav");
currentAudio.loop = true;
currentAudio.volume = 0.12; // soft ambient begins immediately
currentAudio.play().catch(()=>{}); // may require user interaction on some browsers

let nextAudio = null;
let isMuted = false;
let currentVibe = "calm";
let typingTimer;
let lastMessageTs = 0;
const MESSAGE_COOLDOWN = 24000; // 24s, keep it gentle

// Multiple tracks per vibe for meaningful shuffle
const vibePacks = {
  anxious: ["sounds/anxious_1.wav","sounds/anxious_2.wav"],
  sad:     ["sounds/sad_1.wav","sounds/sad_2.wav"],
  calm:    ["sounds/calm_1.wav","sounds/calm_2.wav"],
  focused: ["sounds/focused_1.wav","sounds/focused_2.wav"],
  happy:   ["sounds/happy_1.wav","sounds/happy_2.wav"],
};

// ---- Fake intensity estimate to gate messages (very simple) ----
function estimateIntensity(text) {
  const len = Math.min(text.length, 600);
  const excl = (text.match(/!/g)||[]).length;
  const caps = (text.match(/[A-Z]{3,}/g)||[]).length;
  const score = (len/600) + (excl*0.5) + (caps*0.4);
  return score > 1.2 ? "high" : score > 0.5 ? "medium" : "low";
}

function fakeAI(text) {
  const t = text.toLowerCase();
  for (const entry of vibeDictionary) {
    if (entry.keywords.some(w => t.includes(w))) {
      return { vibe: entry.vibe, message: entry.message, intensity: estimateIntensity(text) };
    }
  }
  return { vibe: "calm", message: "You’re doing fine. Keep writing.", intensity: estimateIntensity(text) };
}

function triggerAI() {
  const res = fakeAI(textarea.value);
  if (res.vibe !== currentVibe) setVibe(res.vibe);
  if (Date.now() - lastMessageTs > MESSAGE_COOLDOWN && res.intensity !== "low") {
    showSupportiveMessage(res.message);
    lastMessageTs = Date.now();
  }
}

function setVibe(newVibe) {
  currentVibe = newVibe;
  document.body.className = "vibe-" + newVibe;
  playNewTrack(newVibe);
}

function pick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function playNewTrack(vibe) {
  const track = pick(vibePacks[vibe]);
  nextAudio = new Audio(track);
  nextAudio.loop = true;
  nextAudio.volume = 0.0;
  crossfade(currentAudio, nextAudio, 3200).then(() => {
    currentAudio = nextAudio;
    nextAudio = null;
  });
}

function crossfade(oldA, newA, duration=3200) {
  return new Promise((resolve) => {
    newA.play().catch(()=>{});
    const steps = Math.max(1, Math.floor(duration/50));
    let i = 0;
    const startOld = oldA ? oldA.volume : 0;
    const startNew = newA.volume;
    const fade = setInterval(() => {
      i++;
      const p = i/steps;
      const oldVol = Math.max(0, startOld*(1-p));
      const newVol = Math.min(0.8, startNew + (0.8 - startNew)*p);
      if (oldA) oldA.volume = isMuted ? 0 : oldVol;
      newA.volume = isMuted ? 0 : newVol;
      if (i>=steps) {
        clearInterval(fade);
        if (oldA) { oldA.pause(); }
        resolve();
      }
    }, 50);
  });
}

function showSupportiveMessage(text) {
  bubble.textContent = text;
  bubble.style.opacity = 1;
  setTimeout(() => bubble.style.opacity = 0, 6000);
}

// ---- Triggers ----
textarea.addEventListener("keyup", (e) => {
  if ([".", "?", "!"].includes(e.key)) triggerAI();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => triggerAI(), 2000);
});

skipBtn.addEventListener("click", () => playNewTrack(currentVibe));

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  if (currentAudio) currentAudio.volume = isMuted ? 0 : 0.35;
  bubble.textContent = isMuted ? "Silent mode on." : "Sound on.";
  bubble.style.opacity = 1;
  setTimeout(() => bubble.style.opacity = 0, 2000);
});
