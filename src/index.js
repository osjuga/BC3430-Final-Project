import * as Tone from 'tone'
import * as seedrandom from 'seedrandom'

// 60 is C4, 72 is C5
$(function () {
    let group = []
    let set = []

    let synth

    let offset = 0
    let rhythm = []
    let originalRhythm = []

    let rngGenerator

    function generateDihedralGroup(zero) {
        let note
        let octave
        let zeroIdx
        let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

        if (zero.length === 2) {
            note = zero.charAt(0)
            octave = parseInt(zero.charAt(1))
        }
        else {
            note = zero.substring(0, 2)
            octave = parseInt(zero.charAt(2))
        }

        zeroIdx = notes.indexOf(note)

        for (let i = 0; i < zeroIdx; i++) {
            notes.push(notes.shift())
        }

        for (let i = 0; i < notes.length; i++) {
            if (i !== 0 && notes[i] === "C") {
                octave += 1
            }
            notes[i] = notes[i] + octave.toString()
        }

        return notes
    }

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
        let rng = Math.floor(rngGenerator.quick() * 4) + 1
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
            let swap1 = Math.floor(rngGenerator.quick() * rhythm.length)
            let swap2 = Math.floor(rngGenerator.quick() * rhythm.length)
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
                    let transposeRng = Math.floor(rngGenerator.quick() * 23) - 12
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
            }

            genRhythm()

            playNotes()
        }
    }

    function generateNewSynth() {
        let adsr = {
            attack: $("#attack").val(),
            decay: $("#decay").val(),
            sustain: $("#sustain").val(),
            release: $("#release").val()
        }

        console.log(adsr)

        switch ($("#instrument").val()) {
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
            default:
                console.log("something has gone WRONG")
        }
    }

    function selectEffect() {
        let effect

        switch ($("#effect").val()) {
            case "bitcrush":
                effect = new Tone.BitCrusher(4).toDestination()
                synth = synth.connect(effect)
                break
            case "pan":
                effect = new Tone.AutoPanner("4n").toDestination().start()
                synth = synth.connect(effect)
                break
            default:
                synth.toDestination()
        }
    }

    $("#playButton").click(function() {
        console.log("Starting audio + generation...")
        generateNewSynth()
        selectEffect()

        offset = Tone.now()
        group = generateDihedralGroup($("#zeroOfGroup").val())
        set = []

        let input = $("#pitchClassSet").val()
        input = input.split(",")
        for (let i = 0; i < input.length; i++) {
            set.push(parseInt(input[i].replace(/\D/g,'')))
        }

        let numberOfRuns = parseInt($("#numberOfRuns").val())

        let seed = $("#rngSeed").val()
        rngGenerator = seedrandom(seed)

        rhythm = $("#rhythmSet").val()
        originalRhythm = rhythm = rhythm.split(" ")

        console.log("\noriginal run")
        console.log("original set: " + set)
        console.log("original group: " + group)

        Tone.Transport.start();
        playNotes()
        genNotes(numberOfRuns - 1);

        console.log("\nFinished.")
    })

    $("#stopButton").click(function() {
        Tone.Transport.cancel()
    })
})

