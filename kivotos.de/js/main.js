let canvas, textbox, gl, shader, batcher, assetManager, skeletonRenderer;
let mvp = new spine.webgl.Matrix4();

let lastFrameTime;
let spineDataA;
let bufferColor = [ 0.3, 0.3, 0.3 ]; // Kept for compatibility with WE properties, but not used for rendering.

const CHARACTER = 'arona_spr';
const BINARY_PATH = window.location.protocol === 'file:' ? location.href.replace('/index.html', `/assets/${CHARACTER}.skel`) : `../assets/${CHARACTER}.skel`;
const ATLAS_PATH = window.location.protocol === 'file:' ? location.href.replace('/index.html', `/assets/${CHARACTER}.atlas`) : `../assets/${CHARACTER}.atlas`;
const CHARACTER_2 = 'NP0035_spr';
const BINARY_PATH_2 = window.location.protocol === 'file:' ? location.href.replace('/index.html', `/assets/${CHARACTER_2}.skel`) : `../assets/${CHARACTER_2}.skel`;
const ATLAS_PATH_2 = window.location.protocol === 'file:' ? location.href.replace('/index.html', `/assets/${CHARACTER_2}.atlas`) : `../assets/${CHARACTER_2}.atlas`;


const LOADOUT = { isday: true, isorganized: false, start: 0, start2: 0, introAudio: null, startAudio: null, interactAudio: null, ux: 0, uy: 0 };

let customScale = 0;
let targetFps = 60;
let bgmfile = '';
let bgmvolume = 0;
let bgm;

let alerted = true;

let introAnimation = false;
let spoilerChar = true;

let forcedTime = -1;
let acceptingClick;
let characterOffset = { x: 0, y: 300};
let introLoop;
let introTrack, sideTrack;
let currentVoiceline = 1;
let mouseSelect = -1;
let trackerID = -1;
let untrackerID = -1;
let unpetID = -1;
let PPointX, PPointY, EPointX, EPointY;
let TPoint, TEye;
let flipped = false;
let displayDialog = false;
let enableIdleLines = true;

let transpose = 1;

// All voicelines are manually timed for duration. This may not be the most optimized solution, but works for all intents and purposes.
const SPOILER_INTRO_AUDIO = [
	{
		text_location: { a: { x: 750, y: 500 }, p: { x: 1100, y: 550 } },
		in: [ 'NP0035/NP0035_Work_AronaSleepSit_In_1_2', 'NP0035/NP0035_Work_AronaSleepSit_In_2_2' ],
		in_dialog: [ "Strawberry milk...?", "Senpai, you should get up soon." ],
		in_speaker: [ "p", "p" ]
	},
	{
		text_location: { a: { x: 750, y: 500 }, p: { x: 1000, y: 300 } },
		in: [ 'NP0035/NP0035_Work_AronaSleepPeek_In_1_2', 'NP0035/NP0035_Work_AronaSleepPeek_In_2_2' ],
		in_dialog: [ "Is she sleeping?", "As I thought, she's sleeping..." ],
		in_speaker: [ "p", "p" ]
	},
	{
		text_location: { a: { x: 750, y: 500 }, p: { x: 1100, y: 550 } },
		in: [ 'NP0035/NP0035_Work_AronaSleepSit_Talk_4_2' ],
		in_dialog: [ "Really?" ],
		in_speaker: [ "p" ]
	}
]

const INTRO_AUDIO_A = [
	{
		text_location: { a: { x: 680, y: 860 }, p: { x: 0, y: 0 } },
		exit: [ 'Arona/Arona_Work_Sleep_Exit_1', 'Arona/Arona_Work_Sleep_Exit_2', 'Arona/Arona_Work_Sleep_Exit_3' ],
		exit_dialog: [ "Wh-wha...huh?", "Ah?!", "...Huh?" ],
		exit_speaker: [ "a", "a" ],
		in: [ 'Arona/Arona_Work_Sleep_In_1', 'Arona/Arona_Work_Sleep_In_2' ],
		in_dialog: [ "Zzz. Strawberry milk... Heeheehee.", "Eat all that? No, I couldn't..." ],
		in_speaker: [ "a", "a" ],
		talk: [ 'Arona/Arona_Work_Sleep_Talk_1', 'Arona/Arona_Work_Sleep_Talk_2', 'Arona/Arona_Work_Sleep_Talk_3', 'Arona/Arona_Work_Sleep_Talk_4', 'Arona/Arona_Work_Sleep_Talk_5', 'Arona/Arona_Work_Sleep_Talk_6' ],
		talk_dialog: [ "Sensei, you're so...", "..Heeheehee.", "Zzz...", "Me? Doze off? Never... Zzz...", "Heehee, yummy...", "No, Sensei... You can't do that..." ],
		talk_speaker: [ "a", "a", "a", "a", "a", "a" ]
	},
	{
		text_location: { a: { x: 1000, y: 350 }, p: { x: 0, y: 0 } },
		exit: [ 'Arona/Arona_Work_Watch_Exit_1', 'Arona/Arona_Work_Watch_Exit_2' ],
		exit_dialog: [ "Ah!", "Huh?" ],
		exit_speaker: [ "a", "a" ],
		in: [ 'Arona/Arona_Work_Watch_In_1', 'Arona/Arona_Work_Watch_In_2' ],
		in_dialog: [ "Another day means another clear sky.", "Hmm... Maybe it'll rain." ],
		in_speaker: [ "a", "a" ],
		talk: [ 'Arona/Arona_Work_Watch_Talk_1', 'Arona/Arona_Work_Watch_Talk_3' ],
		talk_dialog: [ "I wonder what's out there...", "Hmm..." ],
		talk_speaker: [ "a", "a" ]
	},
	{
		text_location: { a: { x: 750, y: 500 }, p: { x: 0, y: 0 } },
		exit: [ 'Arona/Arona_Work_Sit_Exit_1', 'Arona/Arona_Work_Sit_Exit_2', 'Arona/Arona_Work_Sit_Exit_3' ],
		exit_dialog: [ "Eh?", "Huh?", "Ah!" ],
		exit_speaker: [ "a", "a", "a" ],
		in: [ 'Arona/Arona_Work_Sit_In_1' ],
		in_dialog: [ "Mm-hmm...♬" ],
		in_speaker: [ "a" ],
		talk: [ 'Arona/Arona_Work_Sit_Talk_1', 'Arona/Arona_Work_Sit_Talk_2', 'Arona/Arona_Work_Sit_Talk_3' ],
		talk_dialog: [ "La, lala, lala! ♪", "Hmm hmm hmm... ♩", "Oh, I wonder what today will bring! ♬" ],
		talk_speaker: [ "a", "a", "a" ]
	}
];

const INTRO_STARTWORK_A = {
	talk: [ [ 'Arona/Arona_Default_TTS', 'Arona/Arona_Work_In_1'] , 'Arona/Arona_Work_In_2', 'Arona/Arona_Work_In_3', 'Arona/Arona_Work_In_4' ],
	expression: [ [ '12', '12' ], '25', '31', '32' ],
	talk_dialog: [ [ "Sensei! I've been waiting for you!", "Sensei! I've been waiting for you!" ], "Let's get to work!", "Any task you want to do in particular, sensei?", "I can give you a hand with whatever you want!" ],
};

const INTERACT_AUDIO_A = {
	talk: [ 'Arona/Arona_Work_Talk_1', [ 'Arona/Arona_Default_TTS', 'Arona/Arona_Work_Talk_2' ], 'Arona/Arona_Work_Talk_3', 'Arona/Arona_Work_Talk_4', 'Arona/Arona_Work_Talk_5', 'Arona/Arona_Work_Talk_6' ],
	talk_dialog: [ "Manage tasks you need to complete from here!", [ "Sensei! Pick a task. I'll back you up!", "Sensei! Pick a task. I'll back you up!" ], "Here's everything on your docket. Adults have it rough, huh?", "There's lots of work to do, but I know you can do it!", "Take care of your health too. It's gotta take priority!", "Oh...that's a lot of work." ],
	expression: [ '00', [ '25', '25' ], '13', '12', '18', '29' ]
};

const INTRO_AUDIO_P = [
	{
		text_location: { a: { x: 0, y: 0 }, p: { x: 450, y: 300 } },
		exit: [ 'NP0035/NP0035_Work_Cabinet_Exit_1' ],
		exit_dialog: [ "...Ah." ],
		exit_speaker: [ "p" ],
		in: [ 'NP0035/NP0035_Work_Cabinet_In_1', 'NP0035/NP0035_Work_Cabinet_In_2' ],
		in_dialog: [ "So, that's what this is...", "...So that's how it is." ],
		in_speaker: [ "p", "p" ],
		talk: [ 'NP0035/NP0035_Work_Cabinet_Talk_1', 'NP0035/NP0035_Work_Cabinet_Talk_1' ],
		talk_dialog: [ "Hmm... I see.", "Hmm... So that's how it's structured." ],
		talk_speaker: [ "p", "p" ]
	},
	{
		text_location: { a: { x: 750, y: 500 }, p: { x: 1100, y: 550 } },
		exit: [ 'NP0035/NP0035_Work_Sit_Exit_1' ],
		exit_dialog: [ "Ah." ],
		exit_speaker: [ "p" ],
		in: [ 'NP0035/NP0035_Work_Sit_In_1' , 'NP0035/NP0035_Work_Sit_In_2' ],
		in_dialog: [ "Mmm...", "Hmm..." ],
		in_speaker: [ "p", "p" ],
		talk: [ 'NP0035/NP0035_Work_Sit_Talk_1' ],
		talk_dialog: [ "..." ],
		talk_speaker: [ "p" ]
	},
	{
		text_location: { a: { x: 575, y: 125 }, p: { x: 1300, y: 350 } },
		exit: [ 'NP0035/NP0035_Work_Umbrella_Exit_1' ],
		exit_dialog: [ "Ah." ],
		exit_speaker: [ "p" ],
		in: [ 'NP0035/NP0035_Work_Umbrella_In_1' ],
		in_dialog: [ "If it rains..." ],
		in_speaker: [ "p" ],
		talk: [ 'NP0035/NP0035_Work_Umbrella_Talk_1', 'NP0035/NP0035_Work_Umbrella_Talk_2' ],
		talk_dialog: [ "Would this be useful?", "Me too. Together." ],
		talk_speaker: [ "p", "p" ]
	},
	{
		text_location: { a: { x: 1600, y: 400 }, p: { x: 1250, y: 180 } },
		exit: [ 'NP0035/NP0035_Work_PlanaWatchSky_Exit_1' ],
		exit_dialog: [ "...Ah." ],
		exit_speaker: [ "p" ],
		in: [ [ 'Arona/Arona_Work_PlanaWatchSky_In_1_1', 'NP0035/NP0035_Work_PlanaWatchSky_In_1_2', 'Arona/Arona_Work_PlanaWatchSky_In_1_3' ] ],
		in_dialog: [ [ "Can you see that, Plana-chan?", "Do you mean that, senpai?", "Yes, that!" ] ],
		in_speaker: [ [ "a", "p", "a" ] ],
		talk: [ [ 'Arona/Arona_Work_PlanaWatchSky_Talk_1_1', 'NP0035/NP0035_Work_PlanaWatchSky_Talk_1_2' ] ],
		talk_dialog: [ [ "What about over there?", "Mmm..." ] ],
		talk_speaker: [ [ "a", "p" ] ]
	},
	{
		text_location: { a: { x: 1500, y: 350 }, p: { x: 1100, y: 550 } },
		exit: [ 'NP0035/NP0035_PlanaSitPeek_Exit_1' ],
		exit_dialog: [ "Ah." ],
		exit_speaker: [ "p" ],
		in: [ [ 'Arona/Arona_Work_PlanaSitPeek_In_1_1' , 'NP0035/NP0035_Work_PlanaSitPeek_In_1_2' ] ],
		in_dialog: [ [ "Stare~", "Hmm..." ] ],
		in_speaker: [ [ "a", "p" ] ],
		talk: [ 'NP0035/NP0035_Work_PlanaSitPeek_Talk_1', 'NP0035/NP0035_Work_PlanaSitPeek_Talk_2' ],
		talk_dialog: [ "I can feel your eyes on me.", "I'm in trouble." ],
		talk_speaker: [ "p", "p" ]
	}
];

const INTRO_STARTWORK_P = {
	talk: [ [ 'NP0035/NP0035_Work_In_1_1', 'NP0035/NP0035_Default_TTS', 'NP0035/NP0035_Work_In_1_2' ], 'NP0035/NP0035_Work_In_2', 'NP0035/NP0035_Work_In_3', 'NP0035/NP0035_Work_In_4' ],
	expression: [ [ '02', '03', '03' ], '03', '00', '02' ],
	talk_dialog: [ [ "Connecting.", "Sensei, I've been waiting for you.", "Sensei, I've been waiting for you." ], "It's time to get to work.", "Which task would you like to start with, Sensei?", "On standby. There are numerous tasks that need to be resolved." ],
};

const INTERACT_AUDIO_P = {
	talk: [ 'NP0035/NP0035_Work_Talk_1', [ 'NP0035/NP0035_Default_TTS', 'NP0035/NP0035_Work_Talk_2' ], 'NP0035/NP0035_Work_Talk_3', 'NP0035/NP0035_Work_Talk_4', 'NP0035/NP0035_Work_Talk_5' ],
	talk_dialog: [ "You can carry out your various tasks here, Sensei.", [ "Sensei. Please select whatever task you wish to do.", "Sensei. Please select whatever task you wish to do." ] , "There are many tasks that need to be resolved. Now then, if you please.", "Perplexing. This is a meaningless action. Please do not poke me. Doing so will result in damage.", "Understood. Sensei doesn't have anything in particular to do at the moment, so you're free." ],
	expression: [ '03', [ '03', '03' ], '03', '13', '12' ]
};

const HITBOX = {
	headpat: { xMin: 1320, xMax: 1630, yMin: 615, yMax: 755 },
	voiceline: { xMin: 1300, xMax: 1550, yMin: 970, yMax: 1450 }
};

const HEADPAT_CLAMP = 30;
const EYE_CLAMP_X = 200;
const EYE_CLAMP_Y = EYE_CLAMP_X * (9 / 16)
const HEADPAT_STEP = 5;
const EYE_STEP = 10;
let mousePos = { x: 0, y: 0 };
let volume = 0.5;
let mouseOptions = { voicelines: true, headpatting: true, mousetracking: true, autotrack: false };

function clamp(num, min, max) {
	return Math.min(Math.max(num, min), max);
}

function idleLines() {
	if (!LOADOUT.isday && LOADOUT.start == 1 && LOADOUT.start2 == 1) LOADOUT.start = 4;
	let array = LOADOUT.introAudio[LOADOUT.start];
	let selection = Math.floor(Math.random() * array.talk.length);
	introTrack = playLine(
		{ filepath: array.talk[selection], dialog: array.talk_dialog[selection], dPositions: array.text_location, dSequence: array.talk_speaker[selection] }
	);
	if (spoilerChar && LOADOUT.isday && LOADOUT.start == 0 && LOADOUT.start2 == 0 && selection == 3) {
		introTrack.addEventListener('ended', function() {
			setTimeout(function() {
				sideTrack = playLine(
					{ filepath: SPOILER_INTRO_AUDIO[2].in[0], dialog: SPOILER_INTRO_AUDIO[2].in_dialog[0], dPositions: SPOILER_INTRO_AUDIO[2].text_location, dSequence: SPOILER_INTRO_AUDIO[2].talk_speaker[0] }
				)
			}, 500);
		});
	}
	if (spoilerChar && LOADOUT.isday && LOADOUT.start == 0 && LOADOUT.start2 == 0 && selection == 3) {
		introTrack.addEventListener('ended', function() {
			setTimeout(function() {
				sideTrack = playLine(
					{ filepath: SPOILER_INTRO_AUDIO[2].in[0], dialog: SPOILER_INTRO_AUDIO[2].in_dialog[0], dPositions: SPOILER_INTRO_AUDIO[2].text_location, dSequence: SPOILER_INTRO_AUDIO[2].talk_speaker[0] }
				)
			}, 500);
		});
	}
}

// NOTE: X and Y appears to be inversely related from cursor position to bone adjustment.
//       This behavior's reason is unknown, but it LOOKS right so leave it alone!
function trackMouse() {
	let adjX = (mousePos.x / canvas.width) - 0.5 - (characterOffset.x / (2880 * 2));
	let adjY = (mousePos.y / canvas.height) - 0.5 - (characterOffset.y / (1620 * 2));
	TEye.y = TEye.y - (Math.sign(adjX) * EYE_STEP);
	TEye.x = TEye.x - (Math.sign(adjY) * EYE_STEP);
	TEye.y = clamp(TEye.y, EPointY - (Math.abs(adjX) * EYE_CLAMP_X), EPointY + (Math.abs(adjX) * EYE_CLAMP_X));
	TEye.x = clamp(TEye.x, EPointX - (Math.abs(adjY) * EYE_CLAMP_Y), EPointX + (Math.abs(adjY) * EYE_CLAMP_Y));
}

function untrackMouse() {
	if (Math.abs(TEye.y - EPointY) <= EYE_STEP && Math.abs(TEye.x - EPointX) <= EYE_STEP) {
		if (untrackerID != -1) {
			TEye.y = EPointY;
			TEye.x = EPointX;
			clearInterval(untrackerID);
			untrackerID = -1;
			setTimeout(function (){
				acceptingClick = true;
			}, 500);
		}
	}
	if (TEye.y > EPointY) TEye.y -= EYE_STEP;
	if (TEye.y < EPointY) TEye.y += EYE_STEP;
	if (TEye.x > EPointX) TEye.x -= EYE_STEP;
	if (TEye.x < EPointX) TEye.x += EYE_STEP;
}

function unpet() {
	if (Math.abs(TPoint.x - PPointX) <= HEADPAT_STEP && Math.abs(TPoint.y - PPointY) <= HEADPAT_STEP) {
		if (unpetID != -1) {
			TPoint.x = PPointX;
			TPoint.y = PPointY;
			clearInterval(unpetID);
			unpetID = -1;
			setTimeout(function() {
				acceptingClick = true;
			}, 500);
		}
	}
	if (TPoint.y > PPointY) TPoint.y -= HEADPAT_STEP;
	if (TPoint.y < PPointY) TPoint.y += HEADPAT_STEP;
	if (TPoint.x > PPointX) TPoint.x -= HEADPAT_STEP;
	if (TPoint.x < PPointX) TPoint.x += HEADPAT_STEP;
}

function playLine(voiceData, endFunc, spine) {
	let parentTrack;
	if (typeof(voiceData.filepath) == 'string') {
		let track = new Audio(`./assets/audio/${voiceData.filepath}.ogg`);
		if (voiceData.expression && spine) spine.state.setAnimation(1, voiceData.expression, true);
		track.volume = volume;
		track.play();

		if (voiceData.dPositions && LOADOUT.isorganized) {
			textbox.style.left = tInvert(voiceData.dPositions[voiceData.dSequence].x, 'x') + 'px';
			textbox.style.top = tInvert(voiceData.dPositions[voiceData.dSequence].y, 'y') + 'px';
		}
		else {
			textbox.style.left = LOADOUT.ux + '%';
			textbox.style.top = LOADOUT.uy + '%';
		}
		textbox.innerHTML = voiceData.dialog;
		if (displayDialog) textbox.style.opacity = 1;

		track.addEventListener('ended', function() {
			textbox.style.opacity = 0;
			if (endFunc) endFunc();
		});

		parentTrack = track;
	}
	else {
		let prevtrack;
		for (let i = 1; i <= voiceData.filepath.length; i++) {
			let track = new Audio(`./assets/audio/${voiceData.filepath[i - 1]}.ogg`);
			if (i == 1) {
				parentTrack = track;
			}
			track.volume = volume;
			if (!prevtrack) {
				if (voiceData.dPositions && LOADOUT.isorganized) {
					textbox.style.left = tInvert(voiceData.dPositions[voiceData.dSequence[i - 1]].x, 'x') + 'px';
					textbox.style.top = tInvert(voiceData.dPositions[voiceData.dSequence[i - 1]].y, 'y') + 'px';
				}
				else {
					textbox.style.left = LOADOUT.ux + '%';
					textbox.style.top = LOADOUT.uy + '%';
				}
				if (voiceData.expression && voiceData.expression[i - 1] && spine) spine.state.setAnimation(1, voiceData.expression[i - 1], true);
				track.play();
				textbox.innerHTML = voiceData.dialog[i - 1];
				if (displayDialog) textbox.style.opacity = 1;
				prevtrack = track;
			}
			else {
				prevtrack.addEventListener('ended', function() {
					if (voiceData.expression && voiceData.expression[i - 1] && spine) spine.state.setAnimation(1, voiceData.expression[i - 1], true);
					if (voiceData.dPositions && LOADOUT.isorganized) {
						textbox.style.left = tInvert(voiceData.dPositions[voiceData.dSequence[i - 1]].x, 'x') + 'px';
						textbox.style.top = tInvert(voiceData.dPositions[voiceData.dSequence[i - 1]].y, 'y') + 'px';
					}
					else {
						textbox.style.left = LOADOUT.ux + '%';
						textbox.style.top = LOADOUT.uy + '%';
					}
					track.play();
					textbox.innerHTML = voiceData.dialog[i - 1];

					introTrack = track;
				});

				prevtrack = track;
			}
			if (i == voiceData.filepath.length) {
				track.addEventListener('ended', function() {
					textbox.style.opacity = 0;
					endFunc();
				});
			}
		}
	}

	return parentTrack;
}

// Textbox Position Scaling (inverse of Hitbox Scaling)
function tInvert(n, side) {
	let d = { x: { length: 2880, mid: (canvas.width / 2) }, y: { length: 1620, mid: (canvas.height / 2) } }
	n = n - (d[side].length * 0.5);
	n = (n / transpose) * customScale;
	return (n + d[side].mid);
}

// Hitbox Scaling
function t(n, side) {
	let d = { x: { length: 2880, mid: (canvas.width / 2) }, y: { length: 1620, mid: (canvas.height / 2) } }
	n = n - d[side].mid;
	n = (n * transpose) / customScale;
	return ((d[side].length * 0.5) + n);
}

// -1 = [No Entry], 1 = Headpat, 2 = Voiceline, 3 = Eye Track
function pressedMouse(x, y) {
	tx = t(x, 'x');
	ty = t(y, 'y');
	if (false) {
		if (introLoop) {
			clearInterval(introLoop);
			introLoop = null;
		}
		if (introTrack) {
			introTrack.pause();
			introTrack = null;
		}
		if (sideTrack) {
			sideTrack.pause();
			sideTrack = null;
		}

		

		

		

		let array = LOADOUT.introAudio[LOADOUT.start];
		let selection = Math.floor(Math.random() * array.exit.length);
		let track = new Audio(`./assets/audio/${array.exit[selection]}.ogg`);
		track.volume = volume;
		track.play();
		if (array.text_location && LOADOUT.isorganized) {
			textbox.style.left = tInvert(array.text_location[array.exit_speaker[selection]].x, 'x') + 'px';
			textbox.style.top = tInvert(array.text_location[array.exit_speaker[selection]].y, 'y') + 'px';
		}
		else {
			textbox.style.left = LOADOUT.ux + '%';
			textbox.style.top = LOADOUT.uy + '%';
		}
		textbox.innerHTML = array.exit_dialog[selection];
		if (displayDialog) textbox.style.opacity = 1;
		track.addEventListener('ended', function() {
		textbox.style.opacity = 0;

			setTimeout(function() {
				alerted = true;
				spineDataA.state.setAnimation(0, 'Idle_01', true);
				let selection = Math.floor(Math.random() * 4);
				playLine(
					{ filepath: LOADOUT.startAudio.talk[selection], dialog: LOADOUT.startAudio.talk_dialog[selection], expression: LOADOUT.startAudio.expression[selection] },
					function() {
						spineDataA.state.setAnimation(1, '00', true);
						acceptingClick = true;
					},
					spineDataA
				)
			}, 500);
		})
	}
	else if (mouseSelect <= 0 && tx > (HITBOX.headpat.xMin + characterOffset.x) && tx < (HITBOX.headpat.xMax + characterOffset.x) && ty > (HITBOX.headpat.yMin - characterOffset.y) && ty < (HITBOX.headpat.yMax - characterOffset.y) && mouseOptions.headpatting) {
		spineDataA.state.setAnimation(1, 'Pat_01_M', false);
		spineDataA.state.setAnimation(2, 'Pat_01_A', false);
		mouseSelect = 1;
	}
	else if (mouseSelect <= 0 && tx > (HITBOX.voiceline.xMin + characterOffset.x) && tx < (HITBOX.voiceline.xMax + characterOffset.x) && ty > (HITBOX.voiceline.yMin - characterOffset.y) && ty < (HITBOX.voiceline.yMax - characterOffset.y) && mouseOptions.voicelines) {
		mouseSelect = 2;
	}
	else if (mouseOptions.mousetracking) {
		if (trackerID == -1) {
			trackerID = setInterval(trackMouse, 20);
		}
		spineDataA.state.setEmptyAnimation(1, 0);
		spineDataA.state.setEmptyAnimation(2, 0);
		let eyetracking = spineDataA.state.addAnimation(1, 'Look_01_M', false, 0);
		eyetracking.mixDuration = 0.2;
		if (LOADOUT.isday) {
			let eyetracking2 = spineDataA.state.addAnimation(2, 'Look_01_A', false, 0);
			eyetracking2.mixDuration = 0.2;
		}
		mousePos.x = x;
		mousePos.y = y;
		mouseSelect = 3;
	}
	else if (mouseSelect == -1) {
		acceptingClick = true;
	}
}

let idleMovement = 0;
let idleTimeout = -1;
let idleMax = 10; //expressed in 100ms/unit
let minMovement = 50;

function autoTimeout() {
	idleMovement = idleMovement + 1;
	if (idleMovement >= idleMax && idleTimeout != -1) {
		clearInterval(idleTimeout);
		idleTimeout = -1;
		releasedMouse(0, 0);

		// Will not auto-track again until 3 seconds have passed since last tracking
		setTimeout(function() {
			idleMovement = 0;
		}, 3000);
	}
}

function movedMouse(x, y, deltaX, deltaY) {
	let v = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) > minMovement;
	if (mouseOptions.autotrack && mouseSelect <= 0 && v && acceptingClick && alerted && idleMovement <= 0) {
		mouseSelect = 3;
		pressedMouse(x, y);
		acceptingClick = false;
		idleTimeout = setInterval(autoTimeout, 100);
	}
	switch (mouseSelect) {
		case 1:
			if ((y < 810 && deltaY < 0) || (x >= 1440 && deltaX > 0)) {
				TPoint.y = clamp(TPoint.y - HEADPAT_STEP, PPointY - HEADPAT_CLAMP, PPointY + HEADPAT_CLAMP);
			}
			else if ((y >= 810 && deltaY > 0) || (x < 1440 && deltaX < 0)) {
				TPoint.y = clamp(TPoint.y + HEADPAT_STEP, PPointY - HEADPAT_CLAMP, PPointY + HEADPAT_CLAMP);
			}
			break;
		case 2:
			mouseSelect = -1;
			acceptingClick = true;
			break;
		case 3:
			mousePos.x = x;
			mousePos.y = y;
			if (v) idleMovement = 0;
			break;
		default:
	}
}

function releasedMouse(x, y) {
	switch (mouseSelect) {
		case 1:
			if (unpetID == -1) {
				unpetID = setInterval(unpet, 20);
			}
			spineDataA.state.setAnimation(1, 'PatEnd_01_M', false);
			spineDataA.state.setAnimation(2, 'PatEnd_01_A', false);
			spineDataA.state.addEmptyAnimation(1, 0.5, 0);
			spineDataA.state.addEmptyAnimation(2, 0.5, 0);
			break;
		case 2:
			let selection = Math.floor(Math.random() * LOADOUT.interactAudio.talk.length);
			playLine(
				{ filepath: LOADOUT.interactAudio.talk[selection], dialog: LOADOUT.interactAudio.talk_dialog[selection], expression: LOADOUT.interactAudio.expression[selection] },
				function() {
					spineDataA.state.setAnimation(1, '00', true);
					acceptingClick = true;
				},
				spineDataA
			);
			break;
		case 3:
			if (trackerID != -1) {
				clearInterval(trackerID);
				trackerID = -1;
			}
			if (untrackerID == -1) {
				untrackerID = setInterval(untrackMouse, 20);
			}
			let eyetracking = spineDataA.state.setAnimation(1, 'LookEnd_01_M', false);
			let eyetracking2 = spineDataA.state.setAnimation(2, 'LookEnd_01_A', false);
			eyetracking.mixDuration = 0;
			eyetracking2.mixDuration = 0;
			spineDataA.state.addEmptyAnimation(1, 0.5, 0);
			spineDataA.state.addEmptyAnimation(2, 0.5, 0);
			break;
		default:
	}
	mouseSelect = -1;
}

function setMouse(event) {
	let ax = event.clientX;
	let ay = event.clientY;
	let mx = 1;
	if (flipped) {
		mx = -1;
		ax = canvas.width - ax;
	}

	return { x: ax, y: ay, m: mx }
}

function init() {
	// Wallpaper Engine settings
	window.wallpaperPropertyListener = {
		applyUserProperties: (props) => {
			if (props.schemecolor) {
				bufferColor = props.schemecolor.value.split(" ");
			}
			if (props.alignmentfliph) flipped = props.alignmentfliph.value;
			if (props.scale) {
				customScale = props.scale.value;
				resize();
			}
			if (props.targetfps) targetFps = props.targetfps.value;

			// assigned only on initialization when spoilerChar is [undef] and forcetime & timehr can be passed simultaneously
			if (props.bonuschar && typeof(spoilerChar) == 'undefined') spoilerChar = props.bonuschar.value;
			if (props.timeofday) forcedTime = props.timeofday.value;
			if (props.introanimation) introAnimation = props.introanimation.value;
			if (props.idlelines) {
				enableIdleLines = props.idlelines.value;
				if (!enableIdleLines && introLoop) {
					clearInterval(introLoop);
					introLoop = null;
				}
			}

			if (props.mousetracking) mouseOptions.mousetracking = props.mousetracking.value;
			if (props.headpatting) mouseOptions.headpatting = props.headpatting.value;
			if (props.voicelines) mouseOptions.voicelines = props.voicelines.value;
			if (props.voicevolume) volume = props.voicevolume.value / 100;

			if (props.autotrackmouse) mouseOptions.autotrack = props.autotrackmouse.value;

			if (props.characterx) characterOffset.x = ((props.characterx.value - 50) / 100) * 2880;
			if (props.charactery) characterOffset.y = ((props.charactery.value - 50) / -100) * 1620;
			if (props.showdialog) displayDialog = props.showdialog.value;
			if (props.dialogx) LOADOUT.ux = props.dialogx.value;
			if (props.dialogy) LOADOUT.uy = props.dialogy.value;
			if (props.fixeddialog) LOADOUT.isorganized = props.fixeddialog.value;

			if (props.bgmfile) {
				bgmfile = 'file:///' + props.bgmfile.value.replace("%3A", "\:");
			}
			if (props.bgmvolume) {
				bgmvolume = props.bgmvolume.value / 100;
				if (bgm) bgm.volume = bgmvolume;
			}
		}
	};

	// Setup canvas and WebGL context. We pass alpha: false to canvas.getContext() so we don't use premultiplied alpha when
	// loading textures. That is handled separately by PolygonBatcher.

	textbox = document.getElementById('textbox');

	canvas = document.getElementById('canvas');
	canvas.width = 0;
	canvas.height = 0;

	let config = { alpha: false };
	gl = canvas.getContext('webgl', config) || canvas.getContext('experimental-webgl', config);
	if (!gl) {
		alert('WebGL is unavailable.');
		return;
	}

	// Create a simple shader, mesh, model-view-projection matrix, SkeletonRenderer, and AssetManager.
	shader = spine.webgl.Shader.newTwoColoredTextured(gl);
	batcher = new spine.webgl.PolygonBatcher(gl);
	mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
	skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
	assetManager = new spine.webgl.AssetManager(gl);

    // Tell AssetManager to load the resources for each skeleton, including the exported .skel file, the .atlas file and the .png
	// file for the atlas. We then wait until all resources are loaded in the load() method.
    assetManager.loadBinary(BINARY_PATH);
	assetManager.loadTextureAtlas(ATLAS_PATH);
	assetManager.loadBinary(BINARY_PATH_2);
	assetManager.loadTextureAtlas(ATLAS_PATH_2);
	

	requestAnimationFrame(load);
}

// Determine whether to use Plana or not
function loadoutSelect() {
	let t = new Date();
	let hr = t.getHours();
	if(forcedTime == -2) {
		hr = Math.floor(Math.random() * 24);
	}
	else if (forcedTime != -1) {
		hr = forcedTime;
	}

	LOADOUT.isday = !(spoilerChar && (hr < 6 || hr >= 18));
	LOADOUT.start = LOADOUT.isday ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 4);
	LOADOUT.start2 = Math.floor(Math.random() * 2);
	LOADOUT.introAudio = LOADOUT.isday ? INTRO_AUDIO_A : INTRO_AUDIO_P;
	LOADOUT.startAudio = LOADOUT.isday ? INTRO_STARTWORK_A : INTRO_STARTWORK_P;
	LOADOUT.interactAudio = LOADOUT.isday ? INTERACT_AUDIO_A : INTERACT_AUDIO_P;
}

// CITATION: http://esotericsoftware.com/spine-api-reference#
// CITATION: http://en.esotericsoftware.com/forum/Spine-Unity-Making-the-arm-follow-the-mouse-7856
function interactionLoad() {
	// Touch_Point and Touch_Eye
	TPoint = spineDataA.skeleton.findBone('Touch_Point');
	TEye = spineDataA.skeleton.findBone('Touch_Eye');
	PPointX = TPoint.x;
	PPointY = TPoint.y;
	EPointX = TEye.x;
	EPointY = TEye.y;

	downaction = canvas.addEventListener('mousedown', function(event) {
		if (!acceptingClick) {
			return;
		}
		acceptingClick = false;
		let mouseData = setMouse(event);
		pressedMouse(mouseData.x, mouseData.y);
	});
	upaction = canvas.addEventListener('mouseup', function(event) {
		let mouseData = setMouse(event);
		releasedMouse(mouseData.x, mouseData.y);
	});
	moveaction = canvas.addEventListener('mousemove', function(event) {
		let mouseData = setMouse(event);
		movedMouse(mouseData.x, mouseData.y, (event.movementX * mouseData.m), event.movementY);
	});

	return 1;
}



function load() {
	// Wait until the AssetManager has loaded all resources, then load the skeletons.
	if (assetManager.isLoadingComplete() && typeof introAnimation !== 'undefined') {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		loadoutSelect();

		if (!LOADOUT.isday && spoilerChar) {
		spineDataA = loadSpineData(ATLAS_PATH_2, BINARY_PATH_2, false);
		} else {
		 spineDataA = loadSpineData(ATLAS_PATH, BINARY_PATH, false);
		}

		resize();
		interactionLoad();

		spineDataA.state.setAnimation(0, 'Idle_01', true);
		alerted = true;

		acceptingClick = true;

		// Plays BGM (if set)
		bgm = new Audio(bgmfile);
		bgm.volume = bgmvolume;
		bgm.play();
		bgm.addEventListener('ended', function() {
			this.currentTime = 0;
			this.play();
		}, false);

		lastFrameTime = Date.now() / 1000;
		requestAnimationFrame(render); // Loading is done, call render every frame.
	} else {
		requestAnimationFrame(load);
	}
}

function loadSpineData(a, b, premultipliedAlpha) {
	// Load the texture atlas from the AssetManager.
	let atlas = assetManager.get(a);

	// Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
	let atlasLoader = new spine.AtlasAttachmentLoader(atlas);

	// Create a SkeletonBinary instance for parsing the .skel file.
	let skeletonBinary = new spine.SkeletonBinary(atlasLoader);

	// Set the scale to apply during parsing, parse the file, and create a new skeleton.
	skeletonBinary.scale = 1;
	let skeletonData = skeletonBinary.readSkeletonData(assetManager.get(b));
	let skeleton = new spine.Skeleton(skeletonData);
	let bounds = calculateSetupPoseBounds(skeleton);

	// Create an AnimationState, and set the initial animation in looping mode.
	let animationStateData = new spine.AnimationStateData(skeleton.data);
	animationStateData.defaultMix = 0.5;
	let animationState = new spine.AnimationState(animationStateData);

	// Pack everything up and return to caller.
	return { skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha };
}

function calculateSetupPoseBounds(skeleton) {
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform();
	let offset = new spine.Vector2();
	let size = new spine.Vector2();
	skeleton.getBounds(offset, size, []);
	return { offset: offset, size: size };
}

function render() {
let now = Date.now() / 1000;
let delta = now - lastFrameTime;
		lastFrameTime = now;

		// Update and apply the animation state, take care of resizing.
gl.clearColor(0.275, 0.51, 0.706, 1.0); // Sea blue background
gl.clear(gl.COLOR_BUFFER_BIT);

// Bind the shader and set the texture and model-view-projection matrix.
shader.bind();
shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

// Start the batch and tell the SkeletonRenderer to render the active skeleton.
batcher.begin(shader);

let skeleton = spineDataA.skeleton;
let state = spineDataA.state;
skeleton.x = characterOffset.x;
skeleton.y = characterOffset.y;
		state.update(delta);
state.apply(skeleton);
skeleton.updateWorldTransform();
		skeletonRenderer.draw(batcher, skeleton);

batcher.end();

shader.unbind();

// throttle fps
let elapsed = Date.now() / 1000 - now;
let targetFrameTime = 1 / targetFps;
let delay = Math.max(targetFrameTime - elapsed, 0) * 1000;

setTimeout(() => {
 requestAnimationFrame(render);
}, delay);
	}

function resize() {
	let w = canvas.clientWidth;
	let h = canvas.clientHeight;
	if (canvas.width != w || canvas.height != h) {
		canvas.width = w;
		canvas.height = h;
	}

	// Calculations to center the skeleton in the canvas.
	let centerX = 0;
	let centerY = 900;
	let wr = canvas.width / 2880;
	let hr = canvas.height / 1620;
	let width = (2880 / customScale);
	let height = (1620 / customScale);

	if (wr < hr) {
		width = height * (canvas.width / canvas.height);

		transpose = 1620 / canvas.height;
	}
	else if (wr > hr) {
		height = width * (canvas.height / canvas.width);

		transpose = 2880 / canvas.width;
	}
	else {
		transpose = 1620 / canvas.height;
	}

	mvp.ortho2d(centerX - width / 2, centerY - height / 2, width, height);
	if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
}

function initializeManualSettings() {
	// 手动设置 Wallpaper Engine 属性
	const props = {
		schemecolor: { value: '#FFFFFF' },
		alignmentfliph: { value: false },
		scale: { value: 1 },
		targetfps: { value: 30 },
		bonuschar: { value: false },
		timeofday: { value: 22 },
		introanimation: { value: false },
		idlelines: { value: false },
		mousetracking: { value: true },
		headpatting: { value: true },
		voicelines: { value: false },
		voicevolume: { value: 50 },
		autotrackmouse: { value: false },
		characterx: { value: 24 },
		charactery: { value: 40 },
		showdialog: { value: true },
		dialogx: { value: 50 },
		dialogy: { value: 50 },
		fixeddialog: { value: true },
		bgmfile: { value: '' },
		bgmvolume: { value: 50 },
		enableIdleLines: { value: false }
	};

	// 应用属性
	if (props.schemecolor) {
		// 设置颜色
	}
	if (props.alignmentfliph) flipped = props.alignmentfliph.value;
	if (props.scale) {
		// 设置缩放
	}
	if (props.targetfps) targetFps = props.targetfps.value;
	if (props.bonuschar && typeof(spoilerChar) == 'undefined') spoilerChar = props.bonuschar.value;
	if (props.timeofday) forcedTime = props.timeofday.value;
	if (props.introanimation) introAnimation = props.introanimation.value;
	if (props.idlelines) {
		// 设置空闲行
	}
	if (props.mousetracking) mouseOptions.mousetracking = props.mousetracking.value;
	if (props.headpatting) mouseOptions.headpatting = props.headpatting.value;
	if (props.voicelines) mouseOptions.voicelines = props.voicelines.value;
	if (props.voicevolume) volume = props.voicevolume.value / 100;
	if (props.autotrackmouse) mouseOptions.autotrack = props.autotrackmouse.value;
	if (props.characterx) characterOffset.x = ((props.characterx.value - 50) / 100) * 2880;
	if (props.charactery) characterOffset.y = ((props.charactery.value - 50) / -100) * 1620;
	if (props.showdialog) displayDialog = props.showdialog.value;
	if (props.dialogx) LOADOUT.ux = props.dialogx.value;
	if (props.dialogy) LOADOUT.uy = props.dialogy.value;
	if (props.fixeddialog) LOADOUT.isorganized = props.fixeddialog.value;
	if (props.bgmfile) {
		bgmfile = props.bgmfile.value;
	}
	if (props.bgmvolume) {
		bgmvolume = props.bgmvolume.value / 100;
	}
}

// 调用初始化函数

init();
initializeManualSettings();
