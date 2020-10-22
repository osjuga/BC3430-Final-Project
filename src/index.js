import * as Tone from 'tone'
import * as seedrandom from 'seedrandom'

// 60 is C4, 72 is C5

const TONAL_SCALE_LENGTH = 7
const MAJOR = [2, 2, 1, 2, 2, 2, 1]
const NATURAL = [2, 1, 2, 2, 1, 2, 2]
const HARMONIC = [2, 1, 2, 2, 1, 3, 1]
const MELODIC = [2, 1, 2, 2, 2, 2, 1]

const keyDict = {
    major: MAJOR,
    natural: NATURAL,
    harmonic: HARMONIC,
    melodic: MELODIC
}

const modeDict = {
    ionian: 0,
    dorian: 1,
    phrygian: 2,
    lydian: 3,
    mixolydian: 4,
    aeolian: 5,
    locrian: 6
}

$(function () {
    let group = []
    let sets

    let synths

    let offsets
    let rhythms
    let originalRhythms
    let adsrGen

    let rngGenerator
    let globalCompressor

    function transpose(n) {
        let minOctave = parseInt($("#minOctave").val())
        let maxOctave = parseInt($("#maxOctave").val())
        if (n < 0) {
            for (let i = 0; i < Math.abs(n); i++) {
                let value = group.pop()
                value = value.replace(value.slice(-1), Math.max(parseInt(value.slice(-1)) - 1, minOctave))
                group.unshift(value)
            }
        }
        else {
            for (let i = 0; i < n; i++) {
                let value = group.shift()
                value = value.replace(value.slice(-1), Math.min(parseInt(value.slice(-1)) + 1, maxOctave))
                group.push(value)
            }
        }
    }

    function inverse() {
        group.reverse()
        group.unshift(group.pop())
    }

    function retrograde() {
        for (let i = 0; i < sets.length; i++) {
            sets[i].reverse()
        }
    }

    function retrogradeRhythm(i) {
        rhythms[i].reverse()
    }

    function halfTime(i) {
        let newRhythm = []
        for (let beat of rhythms[i]) {
            newRhythm.push("~")
            newRhythm.push(beat)
        }
        rhythms[i] = newRhythm
    }

    function restoreRhythm(i) {
        rhythms[i] = originalRhythms[i]
    }

    function swapTwoBeats(i, x, y) {
        [rhythms[i][x], rhythms[i][y]] = [rhythms[i][y], rhythms[i][x]]
    }

    function genRhythm() {
        let rng = Math.floor(rngGenerator.quick() * 4) + 1
        for (let i = 0; i < rhythms.length; i++) {
            if (rng === 1) {
                halfTime(i)
                console.log("applied half time ")
            }

            if (rng === 2) {
                restoreRhythm(i)
                console.log("applied restore rhythm")
            }

            if (rng === 3) {
                retrogradeRhythm(i)
                console.log("applied retrograde rhythm")
            }

            if (rng === 4) {
                let swap1 = Math.floor(rngGenerator.quick() * rhythms[i].length)
                let swap2 = Math.floor(rngGenerator.quick() * rhythms[i].length)
                swapTwoBeats(i, swap1, swap2)
                console.log("swap 2 beats: " + swap1 + " and " + swap2)
            }

            console.log("new rhythm " + i + ": " + rhythms[i])
        }
    }

    function getEvents(i) {
        let events = []
        let idx = 0
        for (let beat of rhythms[i]){
            let beatEvent = []
            for (let character of beat) {
                if (character === '~') {
                    beatEvent.push(null)
                }
                else {
                    beatEvent.push(group[sets[i][idx++]])
                }
            }
            events.push(beatEvent)
        }
        return events
    }

    function playNotes() {
        for (let i = 0; i < synths.length; i++) {
            let adsrType = adsrGen[i]
            let events = getEvents(i)
            const seq = new Tone.Sequence((time, note) => {
                synths[i].triggerAttackRelease(note, 0.2, time);
                if (adsrType !== "disabled") {
                    if (synths[i].hasOwnProperty("envelope")) {
                        synths[i].envelope.attack = generateADSR(synths[i].envelope.attack, adsrType)
                        synths[i].envelope.decay = generateADSR(synths[i].envelope.decay, adsrType)
                        synths[i].envelope.sustain = generateADSR(synths[i].envelope.sustain, adsrType)
                        synths[i].envelope.release = generateADSR(synths[i].envelope.release, adsrType)
                    }
                    else {
                        synths[i].attack = generateADSR(synths[i].attack, adsrType)
                        synths[i].release = generateADSR(synths[i].release, adsrType)
                        console.log(synths[i].attack)
                        console.log(synths[i].release)
                    }
                }
            }, events)
            seq.loop = 0
            seq.start(offsets[i])
            offsets[i] += (seq.subdivision * events.length)
        }
    }

    function generateADSR(prop, type) {
        let value
        if (type === "both") {
            type = Math.floor(rngGenerator.quick() * 2) === 0 ? "incremental" : "random"
        }
        if (type === "incremental") {
            value = prop + ((rngGenerator.quick() * 2) - 1) * .1
        }
        else if (type === "random") {
            value = (rngGenerator.quick())
        }

        if (value > 0) {
            return Math.min(value, 1)
        }
        else {
            return Math.max(value, 0.005)
        }
    }

    function calculateTransitionSelector() {
        let transposeChance = parseFloat($("#transpose").val())
        let inversionChance = parseFloat($("#inversion").val())
        let retroChance = parseFloat($("#retrograde").val())
        let normalizingFactor = transposeChance + inversionChance + retroChance
        transposeChance /= normalizingFactor
        inversionChance /= normalizingFactor
        let selector = rngGenerator.quick()
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
            let times = Math.floor(rngGenerator.quick() * 3)
            let transitions = []
            for (let i = 0; i <= times; i++) {
                transitions.push(calculateTransitionSelector())
            }
            console.log("\ngenerative run " + i)
            console.log("\n# of transitions in this step: " + times)

            for (let i = 0; i < transitions.length; i++) {
                let rng = transitions[i]
                if (rng === 1) {
                    let transposeRng = Math.floor(rngGenerator.quick() * (group.length * 2 - 1)) - group.length
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
                for (let i = 0; i < sets.length; i ++) {
                    console.log("new set " + i + ": " + sets[i])
                }
                console.log("new group: " + group)
            }

            genRhythm()

            playNotes()
        }
    }

    function selectInstrument(i) {
        let adsr = {
            attack: parseFloat($("#attack" + i).val()),
            decay: parseFloat($("#decay" + i).val()),
            sustain: parseFloat($("#sustain" + i).val()),
            release: parseFloat($("#release" + i).val())
        }

        console.log(adsr)

        let synth;

        switch ($("#instrument" + i).val()) {
            case "sine":
                synth = new Tone.Synth({
                    oscillator: {
                        type: 'sine'
                    },
                    envelope: adsr
                })
                break
            case "sawtooth":
                synth = new Tone.Synth({
                    oscillator: {
                        type: 'sawtooth'
                    },
                    envelope: adsr
                })
                break
            case "triangle":
                synth = new Tone.Synth({
                    oscillator: {
                        type: 'triangle'
                    },
                    envelope: adsr
                })
                break
            case "square":
                synth = new Tone.Synth({
                    oscillator: {
                        type: 'square'
                    },
                    envelope: adsr
                })
                break
            case "flute":
                synth = new Tone.Sampler({
                    C4: "samples/flute-C4.wav",
                    C5: "samples/flute-C5.wav",
                })
                synth.attack = adsr.attack
                synth.release = adsr.release
                break
            case "piano":
                synth = new Tone.Sampler({
                    G3: "samples/piano-G3.wav",
                    G4: "samples/piano-G4.wav",
                })
                synth.attack = adsr.attack
                synth.release = adsr.release
                break
            case "violin":
                synth = new Tone.Sampler({
                    C4: "samples/violin-C4.wav",
                    C5: "samples/violin-C5.wav",
                })
                synth.attack = adsr.attack
                synth.release = adsr.release
                break
            default:
                console.log("something has gone WRONG")
        }

        return synth
    }

    function selectEffect(i) {
        let effect

        switch ($("#effect" + i).val()) {
            case "pan":
                effect = new Tone.AutoPanner("4n").connect(globalCompressor).start();
                synths[i].connect(effect)
                break
            case "variable-lowpass":
                effect = new Tone.Filter(440, "lowpass", -24).connect(globalCompressor)
                let lfo = new Tone.LFO(3, 1, 1000).start()
                lfo.connect(effect.frequency)
                synths[i].connect(effect)
                break
            default:
                synths[i].connect(globalCompressor)
        }
    }

    function generateGroup() {
        const zero = $("#zeroOfGroup").val()
        let groupType = $("#groupType").val()
        let note
        let octave

        if (zero.length === 2) {
            note = zero.charAt(0)
            octave = parseInt(zero.charAt(1))
        }
        else {
            note = zero.substring(0, 2)
            octave = parseInt(zero.charAt(2))
        }

        if (groupType === "dihedral") {
            group = generateDihedralGroup(note)
        }
        else if (groupType === "major") {
            let mode = $("#modeType").val()
            group = generateModalGroup(note, mode)
        }
        else {
            group = generateTonalGroup(note, groupType)
        }

        applyOctavesToGroup(octave)
    }

    function generateDihedralGroup(zero) {
        let noteIdx
        let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

        noteIdx = notes.indexOf(zero)

        for (let i = 0; i < noteIdx; i++) {
            notes.push(notes.shift())
        }

        return notes
    }

    function generateTonalGroup(zero, key) {
        let baseNotes = generateDihedralGroup(zero)
        let result = []
        let idx = 0
        for (let i = 0; i < TONAL_SCALE_LENGTH; i++) {
            result.push(baseNotes[idx])
            idx += keyDict[key][i]
        }

        return result
    }

    function generateModalGroup(zero, mode) {
        let baseNotes = generateDihedralGroup(zero)
        const shiftCount = modeDict[mode]
        let modeShift = MAJOR
        let result = []
        let idx = 0

        for (let i = 0; i < shiftCount; i++) {
            modeShift.push(modeShift.shift())
        }

        for (let i = 0; i < TONAL_SCALE_LENGTH; i++) {
            result.push(baseNotes[idx])
            idx += modeShift[i]
        }

        return result

    }

    function applyOctavesToGroup(octave) {
        for (let i = 0; i < group.length; i++) {
            if (i !== 0 && group[i] === "C") {
                octave += 1
            }
            group[i] = group[i] + octave.toString()
        }
    }

    function generateAllSynths() {
        globalCompressor = new Tone.Compressor(-30).toDestination()
        let numberOfSynths = parseInt($("#numberOfSynths").val())
        for (let i = 0; i < numberOfSynths; i++) {
            synths.push(selectInstrument(i))
            selectEffect(i)
            offsets.push(Tone.now())

            let set = []
            let input = $("#pitchClassSet" + i).val()
            input = input.split(",")
            for (let i = 0; i < input.length; i++) {
                set.push(parseInt(input[i].replace(/\D/g,'')))
            }
            sets.push(set)

            let rhythm = $("#rhythmSet" + i).val().split(" ")
            originalRhythms.push(rhythm)
            rhythms.push(rhythm)

            adsrGen[i] = $("#adsrGen" + i).val()
        }
    }

    $("#playButton").click(function() {
        console.log("Starting audio + generation...")
        // reset everything on start
        synths = []
        rhythms = []
        originalRhythms = []
        sets = []
        offsets = []
        adsrGen = []

        generateGroup()

        let numberOfRuns = parseInt($("#numberOfRuns").val())

        let seed = $("#rngSeed").val()
        rngGenerator = seedrandom(seed)

        generateAllSynths()

        console.log("\noriginal run")
        for (let i = 0; i < sets.length; i ++) {
            console.log("original set " + i + ": " + sets[i])
        }
        console.log("original group: " + group)

        Tone.Transport.bpm.value = parseInt($("#bpm").val())
        Tone.Transport.start();
        playNotes()
        genNotes(numberOfRuns - 1);

        console.log("\nFinished.")
    })

    $("#stopButton").click(function() {
        Tone.Transport.cancel()
    })

    $("#numberOfSynths").change(function() {
        if (parseInt($(this).val()) > 1) {
            $("#synth1").show()
        }
        else {
            $("#synth1").hide()
        }
        if (parseInt($(this).val()) > 2) {
            $("#synth2").show()
        }
        else {
            $("#synth2").hide()
        }
    })
})

