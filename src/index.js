import * as Tone from 'tone'
let synth

// 60 is C4, 72 is C5

let group = []
let set = []
let offset = 0
let rhythm = []
let originalRhythm = []

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

function retrogradeRhythm() {
    rhythm.reverse()
}

function halfTime() {
    let newRhythm = []
    for (let beat of rhythm) {
        newRhythm.push("~")
        newRhythm.push(beat)
    }
    rhythm = newRhythm
}

function restoreRhythm() {
    rhythm = originalRhythm
}

function swapTwoBeats(x, y) {
    [rhythm[x], rhythm[y]] = [rhythm[y], rhythm[x]]
}

function genRhythm() {
    let rng = Math.floor(Math.random() * 4) + 1
    if (rng === 1) {
        halfTime()
        console.log("applied half time ")
    }

    if (rng === 2) {
        restoreRhythm()
        console.log("applied restore rhythm")
    }

    if (rng === 3) {
        retrogradeRhythm()
        console.log("applied retrograde rhythm")
    }

    if (rng === 4) {
        let swap1 = Math.floor(Math.random() * rhythm.length)
        let swap2 = Math.floor(Math.random() * rhythm.length)
        swapTwoBeats(swap1, swap2)
        console.log("swap 2 beats: " + swap1 + " and " + swap2)
    }

    console.log("new rhythm: " + rhythm)
}

function getEvents() {
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
    let events = getEvents()
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

function calculateTransitionSelector() {
    let transposeChance = parseFloat(
        document.getElementById("transpose").value
    )
    let inversionChance = parseFloat(
        document.getElementById("inversion").value
    )
    let retroChance = parseFloat(document.getElementById("retrograde").value)
    let normalizingFactor = transposeChance + inversionChance + retroChance
    transposeChance /= normalizingFactor
    inversionChance /= normalizingFactor
    let selector = Math.random();
    if (selector < transposeChance) {
        return 1
    } else if (selector < transposeChance + inversionChance) {
        return 2
    } else {
        return 3
    }
}

function genNotes(n) {
    for (let i = 0; i < n; i++) {
        let rng = calculateTransitionSelector()
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

        genRhythm()

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
    originalRhythm = rhythm = rhythm.split(" ")

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