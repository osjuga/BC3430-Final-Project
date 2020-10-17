let audioCtx;
let osc;
let gainNode;
let dynamicsCompressor

// 60 is C4, 72 is C5

let group = []
let set = []
let offset = 0

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

function midiToFreq(m) {
    return Math.pow(2, (m - 69) / 12) * 440;
}

function playNotes() {
    set.forEach(idx => {
        playNote(idx);
    });
}

function playNote(idx) {
    offset += .5 //it takes a bit of time to queue all these events
    gainNode.gain.setTargetAtTime(0.8, offset, 0.01)
    osc.frequency.setTargetAtTime(midiToFreq(group[idx]), offset, 0.001)
    gainNode.gain.setTargetAtTime(0, .5 + offset -0.05, 0.01)
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


    audioCtx = new (window.AudioContext || window.webkitAudioContext)
    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    dynamicsCompressor = audioCtx.createDynamicsCompressor()
    dynamicsCompressor.threshold.setValueAtTime(-50, 0)

    osc.connect(gainNode).connect(dynamicsCompressor);
    dynamicsCompressor.connect(audioCtx.destination)
    osc.start()
    gainNode.gain.value = 0;

    offset = audioCtx.currentTime
    group = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]
    set = []

    let input = document.getElementById('pitchClassSet').value
    let numberOfRuns = parseInt(document.getElementById('numberOfRuns').value)
    input = input.split(",")

    for (let i = 0; i < input.length; i++) {
        set.push(parseInt(input[i].replace(/\D/g,'')))
    }

    console.log("\noriginal run")
    console.log("original set: " + set)
    console.log("original group: " + group)

    playNotes()
    genNotes(numberOfRuns - 1);

    console.log("\nFinished.")

}, false);