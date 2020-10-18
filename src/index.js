import * as Tone from 'tone'
let synth

// 60 is C4, 72 is C5

let group = []
let set = []
let offset = 0
let rhythm = []

function transpose(n) {
    for (let i = 0; i < n; i++) {
        group.push(group.shift())
    }
}

function inverse() {
    group.reverse()
    group.unshift(group.pop())
}

function retrograde() {
    set.reverse()
}

function getRhythm() {
    let events = []
    let idx = 0
    for (let beat of rhythm){
        let beatEvent = []
        for (let character of beat) {
            if (character === '~') {
                beatEvent.push(null)
            }
            else {
                beatEvent.push(group[set[idx++]])
            }
        }
        events.push(beatEvent)
    }
    return events
}

function playNotes() {
    let events = getRhythm()
    const seq = new Tone.Sequence((time, note) => {
        synth.triggerAttackRelease(note, 0.1, time);
    }, events)
    seq.loop = 0
    seq.start(offset)
    offset += (seq.subdivision * events.length)
}

// no longer being used but keeping here for now
function playNote(idx) {
    offset += .5
    synth.triggerAttack(group[idx], offset)
    synth.triggerRelease(offset + .5 - .05)
}

function genNotes(n) {
    for (let i = 0; i < n; i++) {
        let rng = Math.floor(Math.random() * 3) + 1
        console.log("\ngenerative run " + i)

        if (rng === 1) {
            let transposeRng = Math.floor(Math.random() * 11)
            transpose(transposeRng)
            console.log("applied transpose " + transposeRng)
        }

        if (rng === 2) {
            inverse()
            console.log("applied inversion")
        }

        if (rng === 3) {
            retrograde()
            console.log("applied retrograde")
        }

        console.log("new set: " + set)
        console.log("new group: " + group)

        playNotes()
    }
}

const playButton = document.querySelector('button');
playButton.addEventListener('click', function() {
    console.log("Starting audio + generation...")

    synth = new Tone.Synth().toDestination()
    offset = Tone.now()
    group = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"]
    set = []

    let input = document.getElementById('pitchClassSet').value
    let numberOfRuns = parseInt(document.getElementById('numberOfRuns').value)
    input = input.split(",")

    rhythm = document.getElementById('rhythmSet').value
    rhythm = rhythm.split(" ")

    for (let i = 0; i < input.length; i++) {
        set.push(parseInt(input[i].replace(/\D/g,'')))
    }

    console.log("\noriginal run")
    console.log("original set: " + set)
    console.log("original group: " + group)

    Tone.Transport.start();
    playNotes()
    genNotes(numberOfRuns - 1);

    console.log("\nFinished.")

}, false);