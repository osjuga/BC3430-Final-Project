# BC3430-Final-Project
Final project for Computational Sound BC3430 Fall 2020

Authored by Oscar Garcia (ojg2111) and Tim Vallancourt (tpv2106)

Generally building upon our Lab 5 implementations of pitch set theory to continue upon the idea of randomly/automatically generated music. 

## Build instructions

1. `npm install` to pull dependencies from npm
2. `npx webpack` to build `/dist/main.js`
3. Open `/dist/index.html` in Chrome

## Notes

* Building the bundle for the first time might take some time (~30s).
* Audio generation can take up to 30s to fire off in weird situations. This tends to happen when using everything 
(e.g. sampled instruments, effects, and generative ADSR), but can occasionally happen otherwise too. A refresh will
generally solve the issue if persistent. 
* See logs for general notes on what is happening. ADSR not logged.
* If you see errors, double check to see whether the initial pitch class set is out of bounds or not; typically due to
pitch classes >6 when set to a tonal group
* Sampler synths (i.e., violin, piano, and flute presets) do not work with frequency split.  

## Blog Post

With this project, we aimed to create a robust auto-composer based on the idea of serialism. The website can procedurally generate a variety of strange and exciting melodies based on a few input parameters and starting rhythm and pitch sets.

### Background

We began with the idea of Schoenberg’s 12-tone serialism. By starting with a set of pitches, one can then perform a series of transformations to generate new, but related pitches. Already this allows someone to come up with interesting melodies that (while still unified by spawning from the same pitch set) are quite unexpected. Later composers applied this same idea of generation to other aspects of music other than pitch: rhythm, loudness, and even instrumentation. Through the power of JavaScript, we followed in the footsteps of these 20th century composers to approach total serialism.

### Primary Features

A number of features were implemented to allow users to create a variety of compositions to their taste. These include:

* Generation of pitches based on user input (with some adjustable parameters)
* Generation of rhythms based on user input
* A variety of base instruments, including sample-based flute, piano, and violin.
* Generation of ADSR envelopes - effectively changing the “instrumentation” and loudness as it plays
* Different pitch group types (chromatic, major, minor, and other modes)
* Adjustable BPM
* Polyphony - up to 3 different instruments composing simultaneously
* Three fun effects to apply to your instrument
* Seed-based random generation to remember your favorite compositions for later

This was created in Tone.js, a framework for Web Audio that offers some additional features for more complex creations.

### Pitch Generation

Pitch generation is at the heart of serialism. The user inputs a pitch class set and then transformations are applied to make this pitch set point to different notes. The three primary transformations are transpose (moving all pitches up or down by some constant), retrograde (reversing the order of the notes), and inversion (flipping the intervals between the notes in the group). Initially, a 0 in the pitch set could correspond to C4, but after a +1 transposition it would be C#4. The values in the pitch set are not actually changing, but the notes they correspond to are being adjusted. This is done by shuffling the values around in the dihedral group that is initially generated and using the numbers in the pitch set as indices that access the group.

In addition to a single transition function happening, there is a random chance of several of them being applied at once as well. Users can also input the probability of each transition occurring and give an upper and lower bound to what octaves they want the transposition function to reach to.

### Rhythm Generation

Though inspired by the pitch generation, rhythm generation ends up taking a different form, further inspired by the Tidal live coding language. Again, the user will input some starting set. Users will type in an x to represent when a note should be played, and a ~ to represent a rest. Spaces are used to separate different beats in a measure. Writing “x ~ x ~” would make a note play on the first and third beat of a measure. If there isn’t a space between the notes, they would subdivide the beat they’re in. “xxx x xx” would represent an eighth note triplet, a quarter note, and then two eighth notes. 

Like the pitches, the rhythms also go through a transformation function with every iteration. The functions implemented are retrograde, swap beats, half time, and restore. Retrograde reverses the order of the beats. Swap beats flips the positions of two random beats. Half time adds a rest between each beat. Restore changes the rhythm back to the original rhythm inputted. This isn’t necessarily a direct correspondence with pitch set theory, but instead just a way we thought would be interesting to generate different rhythms.

The rhythm set then has to be parsed into actual rhythmic patterns for the notes to be played at. The parsing function translates the xs and ~s into “events” that can be passed into a Tone sequencer. By creating these events with the proper array subdivisions for beats, the Tone sequencer can play each note with the correct duration. The program also keeps track of an offset that makes sure the sequencer starts playing notes at the correct times (sequentially and not overlapping).

### Pitch Group Selection

The user is able to pick between chromatic, diatonic, and popular melodic variant scales. After parsing the given zero pitch (default C4), the scale is constructed. The default and base for the other scales is the chromatic dihedral group, which is just an array representation of a chromatic scale starting from the given zero. 

Building upon this, we can also create a tonal group (i.e., major and the minor variants). After creating a dihedral-12 group, we can select specific notes based on the intervals we expect from each scale (e.g., for a major scale, the interval spacing is 2, 2, 1, 2, 2, 2, 1). 

Also building upon the dihedral-12 group base, if you want a modal scale (e.g., Dorian), we take the intervals expected for a major scale then shift according to the mode we want, then apply it to the dihedral-12 group (e.g., Dorian would result in shift of 1 of the major scale intervals, so 2, 2, 1, 2, 2, 2, 1 would become 2, 1, 2, 2, 2, 1, 2).

Notes:
* To generate a modal scale, the user needs to select the major scale, then choose a mode from the list.
* We make no distinction between the Aeolian mode and natural minor scale, both will construct the same thing, just in different ways. Yay, music theory. 

### Instrumentation & Polyphony

The user is allowed to pick from a dropdown menu of several instruments. The first four are just some standard oscillator types (sine, sawtooth, etc.). However, there are also sample-based instruments: flute, violin, and piano. Each of these instruments is made up of just two audio files corresponding to a specific pitch for them. For instance, for the flute, there is a C4 file and a C5 file. However, you can still get all the notes as if they were played by this flute. By using these files as starting points, they can be modified to interpolate what a G4 would sound like. It doesn’t always sound the greatest, but it is interesting to hear!

You can also select up to 3 instruments to play at a single time. They can all be given their own pitch set, rhythm set, ADSR envelope, audio effect, and base instrument sound. We decided that they should all undergo the same transition functions at the same time to at least give them some unifying factor. Start them all up at once and hear a symphony! I really swear if you put them on a mix of piano and violin, you can write Schoenberg pieces. One thing to note is that the audio generation can be slow and take a while to start up. This problem is worsened by using the sampled instruments, the effects, and more than 1 instrument. We decided to limit it to 3 instruments at a time so that the program didn’t get too bogged down in computation. 

### ADSR Generation

For ADSR generation, the user can select between 4 different settings: disabled, incrementally random, completely random, and both. For incrementally random, the ADSR values are incremented/decremented by a 32-bit random float in [0, 1) multiplited by .1. For completely random, the ADSR values are randomly set to something in [0, 1). For both, there's a 50% chance of either of the above methodologies being applied. These changes are applied for every note.

Note that for sampled instruments (i.e., the piano, violin, flute), only the attack and release can be modified. For the oscillator based instruments, all of the values can be changed. 


### Audio Effects
 
Finally, there are three audio effects that can be applied to each instrument. The first is an LFO-based panner. The instrument will oscillate back and forth between your left and right ears with the frequency of the LFO. The second is a variable lowpass filter. There is a lowpass filter at 440hz, blocking frequencies higher than that. However, attached to the frequency is an LFO that makes the frequency cutoff change constantly. This makes every note warble, coming in and out of focus. The last effect is the frequency splitter. Based on the frequency of the played note, the note will come out of a different speaker: lower notes in the left ear and higher notes in the right ear. These were all made by combining different features/effects in Tone to make our own effects that aren’t available by default.

### Final Thoughts

In the end, though what gets created might not always sound good _per se_, it's always exciting to use and see what weird thing you can create next. We did achieve the major goal when making this project: creating a fun, easy-to-use autocomposer. There are a still few future features that would be nice to tackle, with the most worthwhile being creating some visualization of the generation instead of just printing all of it to the console, but we were able to nail down so many other features that we wanted that we are quite happy with the current result.

