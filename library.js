/* library.js — built-in exercise library and routine templates for Gym Log. Data only. */
(function (root) {
  'use strict';
  // [id, name, muscle, pattern, equipment, compound(1/0), rest seconds, secondary muscles]
  const E = [
    // Chest
    ['bb-bench','Barbell Bench Press','Chest','Horizontal press','Barbell',1,120,['Triceps','Shoulders']],
    ['db-bench','Dumbbell Bench Press','Chest','Horizontal press','Dumbbell',1,120,['Triceps','Shoulders']],
    ['sm-bench','Smith Machine Bench Press','Chest','Horizontal press','Smith machine',1,120,['Triceps','Shoulders']],
    ['mc-chest-press','Chest Press Machine','Chest','Horizontal press','Machine',1,90,['Triceps','Shoulders']],
    ['cb-chest-press','Cable Chest Press','Chest','Horizontal press','Cable',1,90,['Triceps','Shoulders']],
    ['bb-incline','Incline Barbell Press','Chest','Incline press','Barbell',1,120,['Shoulders','Triceps']],
    ['db-incline','Incline Dumbbell Press','Chest','Incline press','Dumbbell',1,120,['Shoulders','Triceps']],
    ['sm-incline','Incline Smith Machine Press','Chest','Incline press','Smith machine',1,120,['Shoulders','Triceps']],
    ['mc-incline-press','Incline Chest Press Machine','Chest','Incline press','Machine',1,90,['Shoulders','Triceps']],
    ['bb-decline','Decline Barbell Press','Chest','Decline press','Barbell',1,120,['Triceps']],
    ['db-decline','Decline Dumbbell Press','Chest','Decline press','Dumbbell',1,120,['Triceps']],
    ['sm-decline','Decline Smith Machine Press','Chest','Decline press','Smith machine',1,120,['Triceps']],
    ['mc-decline-press','Decline Chest Press Machine','Chest','Decline press','Machine',1,90,['Triceps']],
    ['db-fly','Dumbbell Flye','Chest','Fly','Dumbbell',0,60,[]],
    ['db-incline-fly','Incline Dumbbell Flye','Chest','Fly','Dumbbell',0,60,[]],
    ['cb-fly','Cable Flye','Chest','Fly','Cable',0,60,[]],
    ['cb-fly-low','Low-to-High Cable Flye','Chest','Fly','Cable',0,60,[]],
    ['cb-fly-high','High-to-Low Cable Flye','Chest','Fly','Cable',0,60,[]],
    ['mc-pec-deck','Pec Deck','Chest','Fly','Machine',0,60,[]],
    ['db-pullover','Dumbbell Pullover','Chest','Pullover','Dumbbell',0,60,['Back']],
    // Back
    ['cb-lat-pulldown','Lat Pulldown','Back','Vertical pull','Cable',1,90,['Biceps']],
    ['cb-lat-pulldown-close','Close-Grip Lat Pulldown','Back','Vertical pull','Cable',1,90,['Biceps']],
    ['cb-lat-pulldown-reverse','Reverse-Grip Lat Pulldown','Back','Vertical pull','Cable',1,90,['Biceps']],
    ['cb-lat-pulldown-single','Single-Arm Lat Pulldown','Back','Vertical pull','Cable',1,90,['Biceps']],
    ['mc-lat-pulldown','Lat Pulldown Machine','Back','Vertical pull','Machine',1,90,['Biceps']],
    ['mc-high-row','High Row Machine','Back','Vertical pull','Machine',1,90,['Biceps']],
    ['mc-assisted-pullup','Assisted Pull-Up Machine','Back','Vertical pull','Machine',1,90,['Biceps']],
    ['cb-pullover','Cable Pullover','Back','Pullover','Cable',0,60,[]],
    ['mc-pullover','Pullover Machine','Back','Pullover','Machine',0,60,[]],
    ['bb-row','Barbell Bent-Over Row','Back','Horizontal row','Barbell',1,120,['Biceps','Hamstrings']],
    ['bb-pendlay-row','Pendlay Row','Back','Horizontal row','Barbell',1,120,['Biceps']],
    ['bb-tbar-row','T-Bar Row','Back','Horizontal row','Barbell',1,120,['Biceps']],
    ['sm-row','Smith Machine Row','Back','Horizontal row','Smith machine',1,90,['Biceps']],
    ['db-row','Single-Arm Dumbbell Row','Back','Horizontal row','Dumbbell',1,90,['Biceps']],
    ['db-row-chest-supported','Chest-Supported Dumbbell Row','Back','Horizontal row','Dumbbell',1,90,['Biceps']],
    ['cb-seated-row','Seated Cable Row','Back','Horizontal row','Cable',1,90,['Biceps']],
    ['cb-seated-row-wide','Wide-Grip Seated Cable Row','Back','Horizontal row','Cable',1,90,['Biceps']],
    ['cb-row-single','Single-Arm Cable Row','Back','Horizontal row','Cable',1,90,['Biceps']],
    ['mc-row','Seated Row Machine','Back','Horizontal row','Machine',1,90,['Biceps']],
    ['mc-row-chest-supported','Chest-Supported Row Machine','Back','Horizontal row','Machine',1,90,['Biceps']],
    ['bb-rack-pull','Rack Pull','Back','Rack pull','Barbell',1,150,['Traps','Hamstrings']],
    // Shoulders
    ['bb-ohp','Barbell Overhead Press','Shoulders','Overhead press','Barbell',1,120,['Triceps']],
    ['bb-seated-press','Seated Barbell Shoulder Press','Shoulders','Overhead press','Barbell',1,120,['Triceps']],
    ['db-shoulder-press','Seated Dumbbell Shoulder Press','Shoulders','Overhead press','Dumbbell',1,120,['Triceps']],
    ['db-arnold-press','Arnold Press','Shoulders','Overhead press','Dumbbell',1,120,['Triceps']],
    ['sm-shoulder-press','Smith Machine Shoulder Press','Shoulders','Overhead press','Smith machine',1,120,['Triceps']],
    ['mc-shoulder-press','Shoulder Press Machine','Shoulders','Overhead press','Machine',1,90,['Triceps']],
    ['db-lateral-raise','Dumbbell Lateral Raise','Shoulders','Lateral raise','Dumbbell',0,60,[]],
    ['db-lateral-raise-seated','Seated Dumbbell Lateral Raise','Shoulders','Lateral raise','Dumbbell',0,60,[]],
    ['cb-lateral-raise','Cable Lateral Raise','Shoulders','Lateral raise','Cable',0,60,[]],
    ['mc-lateral-raise','Lateral Raise Machine','Shoulders','Lateral raise','Machine',0,60,[]],
    ['db-front-raise','Dumbbell Front Raise','Shoulders','Front raise','Dumbbell',0,60,[]],
    ['cb-front-raise','Cable Front Raise','Shoulders','Front raise','Cable',0,60,[]],
    ['bb-front-raise','Barbell Front Raise','Shoulders','Front raise','Barbell',0,60,[]],
    ['db-rear-delt-fly','Bent-Over Dumbbell Rear Delt Flye','Shoulders','Rear-delt raise','Dumbbell',0,60,['Back']],
    ['cb-rear-delt-fly','Cable Rear Delt Flye','Shoulders','Rear-delt raise','Cable',0,60,['Back']],
    ['mc-reverse-pec-deck','Reverse Pec Deck','Shoulders','Rear-delt raise','Machine',0,60,['Back']],
    ['cb-face-pull','Face Pull','Shoulders','Rear-delt raise','Cable',0,60,['Back','Traps']],
    ['bb-upright-row','Barbell Upright Row','Shoulders','Upright row','Barbell',1,90,['Traps']],
    ['db-upright-row','Dumbbell Upright Row','Shoulders','Upright row','Dumbbell',1,90,['Traps']],
    ['cb-upright-row','Cable Upright Row','Shoulders','Upright row','Cable',1,90,['Traps']],
    ['sm-upright-row','Smith Machine Upright Row','Shoulders','Upright row','Smith machine',1,90,['Traps']],
    // Traps
    ['bb-shrug','Barbell Shrug','Traps','Shrug','Barbell',0,60,[]],
    ['db-shrug','Dumbbell Shrug','Traps','Shrug','Dumbbell',0,60,[]],
    ['sm-shrug','Smith Machine Shrug','Traps','Shrug','Smith machine',0,60,[]],
    ['cb-shrug','Cable Shrug','Traps','Shrug','Cable',0,60,[]],
    ['mc-shrug','Shrug Machine','Traps','Shrug','Machine',0,60,[]],
    // Biceps
    ['bb-curl','Barbell Curl','Biceps','Curl','Barbell',0,60,['Forearms']],
    ['bb-ez-curl','EZ-Bar Curl','Biceps','Curl','Barbell',0,60,['Forearms']],
    ['db-curl','Dumbbell Curl','Biceps','Curl','Dumbbell',0,60,['Forearms']],
    ['db-incline-curl','Incline Dumbbell Curl','Biceps','Curl','Dumbbell',0,60,[]],
    ['db-concentration-curl','Concentration Curl','Biceps','Curl','Dumbbell',0,60,[]],
    ['db-spider-curl','Spider Curl','Biceps','Curl','Dumbbell',0,60,[]],
    ['cb-curl','Cable Curl','Biceps','Curl','Cable',0,60,[]],
    ['cb-bayesian-curl','Bayesian Cable Curl','Biceps','Curl','Cable',0,60,[]],
    ['mc-bicep-curl','Bicep Curl Machine','Biceps','Curl','Machine',0,60,[]],
    ['bb-preacher-curl','EZ-Bar Preacher Curl','Biceps','Preacher curl','Barbell',0,60,[]],
    ['db-preacher-curl','Dumbbell Preacher Curl','Biceps','Preacher curl','Dumbbell',0,60,[]],
    ['mc-preacher-curl','Preacher Curl Machine','Biceps','Preacher curl','Machine',0,60,[]],
    ['db-hammer-curl','Dumbbell Hammer Curl','Biceps','Hammer curl','Dumbbell',0,60,['Forearms']],
    ['db-cross-hammer-curl','Cross-Body Hammer Curl','Biceps','Hammer curl','Dumbbell',0,60,['Forearms']],
    ['cb-rope-hammer-curl','Cable Rope Hammer Curl','Biceps','Hammer curl','Cable',0,60,['Forearms']],
    // Triceps
    ['bb-skull-crusher','EZ-Bar Skull Crusher','Triceps','Triceps extension','Barbell',0,60,[]],
    ['db-skull-crusher','Dumbbell Skull Crusher','Triceps','Triceps extension','Dumbbell',0,60,[]],
    ['mc-triceps-ext','Triceps Extension Machine','Triceps','Triceps extension','Machine',0,60,[]],
    ['db-overhead-ext','Overhead Dumbbell Extension','Triceps','Overhead extension','Dumbbell',0,60,[]],
    ['cb-overhead-ext','Overhead Cable Extension','Triceps','Overhead extension','Cable',0,60,[]],
    ['bb-overhead-ext','Overhead EZ-Bar Extension','Triceps','Overhead extension','Barbell',0,60,[]],
    ['db-kickback','Dumbbell Kickback','Triceps','Kickback','Dumbbell',0,45,[]],
    ['cb-kickback','Cable Kickback','Triceps','Kickback','Cable',0,45,[]],
    ['cb-pushdown-rope','Cable Rope Pushdown','Triceps','Pushdown','Cable',0,60,[]],
    ['cb-pushdown-bar','Straight-Bar Pushdown','Triceps','Pushdown','Cable',0,60,[]],
    ['cb-pushdown-v','V-Bar Pushdown','Triceps','Pushdown','Cable',0,60,[]],
    ['cb-pushdown-single','Single-Arm Cable Pushdown','Triceps','Pushdown','Cable',0,60,[]],
    ['cb-pushdown-reverse','Reverse-Grip Pushdown','Triceps','Pushdown','Cable',0,60,[]],
    ['mc-dip','Seated Dip Machine','Triceps','Dip','Machine',1,90,['Chest']],
    ['mc-assisted-dip','Assisted Dip Machine','Triceps','Dip','Machine',1,90,['Chest']],
    ['bb-close-grip-bench','Close-Grip Bench Press','Triceps','Close-grip press','Barbell',1,120,['Chest']],
    ['sm-close-grip-bench','Smith Machine Close-Grip Press','Triceps','Close-grip press','Smith machine',1,120,['Chest']],
    ['bb-jm-press','JM Press','Triceps','Close-grip press','Barbell',1,90,['Chest']],
    // Forearms
    ['bb-wrist-curl','Barbell Wrist Curl','Forearms','Wrist curl','Barbell',0,45,[]],
    ['db-wrist-curl','Dumbbell Wrist Curl','Forearms','Wrist curl','Dumbbell',0,45,[]],
    ['cb-wrist-curl','Cable Wrist Curl','Forearms','Wrist curl','Cable',0,45,[]],
    ['bb-reverse-wrist-curl','Reverse Barbell Wrist Curl','Forearms','Reverse wrist curl','Barbell',0,45,[]],
    ['db-reverse-wrist-curl','Reverse Dumbbell Wrist Curl','Forearms','Reverse wrist curl','Dumbbell',0,45,[]],
    ['bb-reverse-curl','Reverse Barbell Curl','Forearms','Reverse curl','Barbell',0,60,['Biceps']],
    ['cb-reverse-curl','Reverse Cable Curl','Forearms','Reverse curl','Cable',0,60,['Biceps']],
    // Quads
    ['bb-back-squat','Barbell Back Squat','Quads','Squat','Barbell',1,180,['Glutes','Hamstrings']],
    ['bb-front-squat','Barbell Front Squat','Quads','Squat','Barbell',1,150,['Glutes']],
    ['sm-squat','Smith Machine Squat','Quads','Squat','Smith machine',1,150,['Glutes']],
    ['mc-hack-squat','Hack Squat','Quads','Squat','Machine',1,150,['Glutes']],
    ['mc-pendulum-squat','Pendulum Squat','Quads','Squat','Machine',1,150,['Glutes']],
    ['db-goblet-squat','Goblet Squat','Quads','Squat','Dumbbell',1,120,['Glutes']],
    ['mc-leg-press','Leg Press','Quads','Leg press','Machine',1,150,['Glutes']],
    ['mc-leg-press-horizontal','Horizontal Leg Press','Quads','Leg press','Machine',1,120,['Glutes']],
    ['mc-leg-press-single','Single-Leg Press','Quads','Leg press','Machine',1,120,['Glutes']],
    ['db-walking-lunge','Dumbbell Walking Lunge','Quads','Lunge / split squat','Dumbbell',1,90,['Glutes']],
    ['db-bulgarian','Bulgarian Split Squat','Quads','Lunge / split squat','Dumbbell',1,90,['Glutes']],
    ['bb-lunge','Barbell Lunge','Quads','Lunge / split squat','Barbell',1,120,['Glutes']],
    ['sm-split-squat','Smith Machine Split Squat','Quads','Lunge / split squat','Smith machine',1,90,['Glutes']],
    ['db-step-up','Dumbbell Step-Up','Quads','Lunge / split squat','Dumbbell',1,90,['Glutes']],
    ['mc-leg-extension','Leg Extension','Quads','Leg extension','Machine',0,60,[]],
    ['mc-leg-extension-single','Single-Leg Extension','Quads','Leg extension','Machine',0,60,[]],
    // Hamstrings
    ['mc-lying-leg-curl','Lying Leg Curl','Hamstrings','Leg curl','Machine',0,60,[]],
    ['mc-seated-leg-curl','Seated Leg Curl','Hamstrings','Leg curl','Machine',0,60,[]],
    ['mc-standing-leg-curl','Standing Leg Curl','Hamstrings','Leg curl','Machine',0,60,[]],
    ['bb-deadlift','Conventional Deadlift','Hamstrings','Hip hinge','Barbell',1,180,['Glutes','Back','Traps']],
    ['bb-sumo-deadlift','Sumo Deadlift','Hamstrings','Hip hinge','Barbell',1,180,['Glutes','Quads','Back']],
    ['bb-rdl','Romanian Deadlift','Hamstrings','Hip hinge','Barbell',1,120,['Glutes','Back']],
    ['db-rdl','Dumbbell Romanian Deadlift','Hamstrings','Hip hinge','Dumbbell',1,120,['Glutes']],
    ['sm-rdl','Smith Machine Romanian Deadlift','Hamstrings','Hip hinge','Smith machine',1,120,['Glutes']],
    ['bb-sldl','Stiff-Leg Deadlift','Hamstrings','Hip hinge','Barbell',1,120,['Glutes','Back']],
    ['bb-good-morning','Good Morning','Hamstrings','Hip hinge','Barbell',1,90,['Glutes','Back']],
    ['cb-pull-through','Cable Pull-Through','Hamstrings','Hip hinge','Cable',0,60,['Glutes']],
    ['mc-back-extension','Back Extension (45° bench)','Hamstrings','Hip hinge','Machine',0,60,['Glutes','Back']],
    // Glutes
    ['bb-hip-thrust','Barbell Hip Thrust','Glutes','Hip thrust','Barbell',1,120,['Hamstrings']],
    ['sm-hip-thrust','Smith Machine Hip Thrust','Glutes','Hip thrust','Smith machine',1,120,['Hamstrings']],
    ['mc-hip-thrust','Hip Thrust Machine','Glutes','Hip thrust','Machine',1,120,['Hamstrings']],
    ['db-hip-thrust','Dumbbell Hip Thrust','Glutes','Hip thrust','Dumbbell',1,90,['Hamstrings']],
    ['bb-glute-bridge','Barbell Glute Bridge','Glutes','Hip thrust','Barbell',1,90,['Hamstrings']],
    ['cb-glute-kickback','Cable Glute Kickback','Glutes','Glute kickback','Cable',0,60,[]],
    ['mc-glute-kickback','Glute Kickback Machine','Glutes','Glute kickback','Machine',0,60,[]],
    ['mc-hip-abduction','Hip Abduction Machine','Glutes','Hip abduction','Machine',0,60,[]],
    ['cb-hip-abduction','Cable Hip Abduction','Glutes','Hip abduction','Cable',0,60,[]],
    ['mc-hip-adduction','Hip Adduction Machine','Glutes','Hip adduction','Machine',0,60,[]],
    ['cb-hip-adduction','Cable Hip Adduction','Glutes','Hip adduction','Cable',0,60,[]],
    // Calves
    ['mc-standing-calf','Standing Calf Raise Machine','Calves','Calf raise','Machine',0,60,[]],
    ['mc-seated-calf','Seated Calf Raise Machine','Calves','Calf raise','Machine',0,60,[]],
    ['mc-leg-press-calf','Leg Press Calf Raise','Calves','Calf raise','Machine',0,60,[]],
    ['mc-donkey-calf','Donkey Calf Raise Machine','Calves','Calf raise','Machine',0,60,[]],
    ['sm-calf-raise','Smith Machine Calf Raise','Calves','Calf raise','Smith machine',0,60,[]],
    ['db-calf-raise','Dumbbell Single-Leg Calf Raise','Calves','Calf raise','Dumbbell',0,60,[]],
    // Abs
    ['cb-crunch','Cable Crunch','Abs','Crunch','Cable',0,45,[]],
    ['mc-crunch','Crunch Machine','Abs','Crunch','Machine',0,45,[]],
    ['cb-woodchop','Cable Woodchop','Abs','Rotation','Cable',0,45,[]],
    ['mc-torso-rotation','Torso Rotation Machine','Abs','Rotation','Machine',0,45,[]],
    ['db-side-bend','Dumbbell Side Bend','Abs','Side bend','Dumbbell',0,45,[]],
    ['cb-side-bend','Cable Side Bend','Abs','Side bend','Cable',0,45,[]],
  ];
  const exercises = E.map(([id, name, muscle, pattern, equipment, compound, rest, secondary]) =>
    ({ id, name, muscle, pattern, equipment, compound: !!compound, rest, secondary: secondary || [], builtin: true }));

  const MUSCLES = ['Chest','Back','Shoulders','Traps','Biceps','Triceps','Forearms','Quads','Hamstrings','Glutes','Calves','Abs'];
  const EQUIPMENT = ['Barbell','Dumbbell','Machine','Cable','Smith machine'];
  const PATTERNS = [...new Set(exercises.map(e => e.pattern))].sort();

  // Routine templates: day = [name, [[exId, sets, reps], ...]]
  const it = (exId, sets, reps) => ({ exId, sets, reps });
  const day = (id, name, rows) => ({ id, name, items: rows.map(r => it(...r)) });
  const pushA = [['bb-bench',4,8],['db-incline',3,10],['db-shoulder-press',3,10],['db-lateral-raise',3,15],['cb-pushdown-rope',3,12],['cb-overhead-ext',3,12]];
  const pullA = [['cb-lat-pulldown',4,10],['cb-seated-row',3,10],['db-row-chest-supported',3,10],['cb-face-pull',3,15],['bb-curl',3,10],['db-incline-curl',3,12]];
  const legsA = [['bb-back-squat',4,8],['bb-rdl',3,10],['mc-leg-press',3,12],['mc-leg-extension',3,15],['mc-lying-leg-curl',3,12],['mc-standing-calf',4,15]];
  const pushB = [['db-shoulder-press',4,8],['bb-incline',3,8],['mc-chest-press',3,12],['cb-lateral-raise',3,15],['cb-fly',3,15],['bb-skull-crusher',3,12]];
  const pullB = [['bb-row',4,8],['cb-lat-pulldown-close',3,10],['mc-row-chest-supported',3,12],['mc-reverse-pec-deck',3,15],['db-hammer-curl',3,10],['cb-curl',3,12]];
  const legsB = [['bb-deadlift',3,5],['mc-hack-squat',3,10],['db-bulgarian',3,10],['mc-seated-leg-curl',3,12],['mc-hip-thrust',3,12],['mc-seated-calf',4,15]];

  const routines = [
    { id: 'tpl-ppl3', name: 'Push / Pull / Legs (3 days)', builtin: true, days: [
      day('ppl3-push', 'Push', pushA), day('ppl3-pull', 'Pull', pullA), day('ppl3-legs', 'Legs', legsA) ] },
    { id: 'tpl-ppl6', name: 'Push / Pull / Legs (6 days)', builtin: true, days: [
      day('ppl6-push-a', 'Push A', pushA), day('ppl6-pull-a', 'Pull A', pullA), day('ppl6-legs-a', 'Legs A', legsA),
      day('ppl6-push-b', 'Push B', pushB), day('ppl6-pull-b', 'Pull B', pullB), day('ppl6-legs-b', 'Legs B', legsB) ] },
    { id: 'tpl-ul4', name: 'Upper / Lower (4 days)', builtin: true, days: [
      day('ul4-upper-a', 'Upper A', [['bb-bench',4,8],['bb-row',4,8],['db-shoulder-press',3,10],['cb-lat-pulldown',3,10],['db-lateral-raise',3,15],['bb-curl',3,10],['cb-pushdown-rope',3,12]]),
      day('ul4-lower-a', 'Lower A', [['bb-back-squat',4,8],['bb-rdl',3,10],['mc-leg-press',3,12],['mc-lying-leg-curl',3,12],['mc-standing-calf',4,15],['cb-crunch',3,15]]),
      day('ul4-upper-b', 'Upper B', [['bb-ohp',4,8],['cb-lat-pulldown-close',4,10],['db-incline',3,10],['cb-seated-row',3,10],['cb-face-pull',3,15],['db-hammer-curl',3,10],['cb-overhead-ext',3,12]]),
      day('ul4-lower-b', 'Lower B', [['bb-deadlift',3,5],['mc-hack-squat',3,10],['db-bulgarian',3,10],['mc-seated-leg-curl',3,12],['bb-hip-thrust',3,10],['mc-seated-calf',4,15]]) ] },
    { id: 'tpl-fb3', name: 'Full body (3 days)', builtin: true, days: [
      day('fb3-a', 'Full body A', [['bb-back-squat',3,8],['bb-bench',3,8],['cb-lat-pulldown',3,10],['db-shoulder-press',3,10],['mc-lying-leg-curl',3,12],['cb-crunch',3,15]]),
      day('fb3-b', 'Full body B', [['bb-deadlift',3,5],['db-incline',3,10],['cb-seated-row',3,10],['db-lateral-raise',3,15],['mc-leg-extension',3,12],['db-curl',3,12]]),
      day('fb3-c', 'Full body C', [['mc-leg-press',3,12],['mc-chest-press',3,12],['bb-row',3,8],['mc-shoulder-press',3,10],['bb-rdl',3,10],['cb-pushdown-rope',3,12]]) ] },
    { id: 'tpl-bro5', name: 'Bro split (5 days)', builtin: true, days: [
      day('bro5-chest', 'Chest', [['bb-bench',4,8],['db-incline',3,10],['mc-chest-press',3,12],['cb-fly',3,15],['mc-pec-deck',3,15],['db-pullover',3,12]]),
      day('bro5-back', 'Back', [['bb-deadlift',3,5],['cb-lat-pulldown',4,10],['bb-row',3,8],['cb-seated-row',3,10],['db-row',3,10],['cb-pullover',3,12]]),
      day('bro5-shoulders', 'Shoulders', [['bb-ohp',4,8],['db-shoulder-press',3,10],['db-lateral-raise',4,15],['cb-rear-delt-fly',3,15],['cb-face-pull',3,15],['bb-shrug',3,12]]),
      day('bro5-legs', 'Legs', [['bb-back-squat',4,8],['mc-leg-press',3,12],['bb-rdl',3,10],['mc-leg-extension',3,15],['mc-lying-leg-curl',3,12],['mc-standing-calf',4,15]]),
      day('bro5-arms', 'Arms', [['bb-curl',3,10],['bb-skull-crusher',3,10],['db-incline-curl',3,12],['cb-overhead-ext',3,12],['db-hammer-curl',3,12],['cb-pushdown-rope',3,15],['bb-wrist-curl',3,15]]) ] },
  ];

  const LIB = { exercises, routines, MUSCLES, EQUIPMENT, PATTERNS };
  if (typeof module !== 'undefined' && module.exports) module.exports = LIB; else root.GYM_LIB = LIB;
})(typeof window !== 'undefined' ? window : globalThis);
