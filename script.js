
// key: value
const toEnglish = {
    "humbled and honoured": "I am bragging",
    "thought leader": "person with a LinkedIn account",
    "taking a mindful sabbatical": "I am unemployed and stressed",
    "high-level alignment session": "A meeting where nothing was decided",
    "empowering you with ownership": "I am giving you my work to do",
    "data-driven pivot": "Our original idea failed miserably",
    "season of high-impact delivery": "I haven't slept in three weeks",
    "lean, organic growth": "We have zero budget for marketing",
    "sharing for reach": "I have nothing to say but want attention"
}

const toLinkedIn = {
  "i got fired": "I'm excited to embrace a new chapter",
  "i quit": "I'm passionately pursuing new opportunities",
  "reach out": "email me",
  "circle back": "I’m going to ignore this until you ask again",
  "let’s take this offline": "Stop talking about this in front of everyone",
  "disrupting the industry": "We have an app that does what a website used to do",
  "passionate about": "I do this for money",
  "stealth mode": "We haven't built anything yet",
  "ninja/rockstar/guru": "We will ask you to do the work of three people"
}

const inputText = document.getElementById('input-text')
const outputText = document.getElementById('output-text')
const outputLabel = document.getElementById('output-label')
const translateBtn = document.getElementById('translate-btn')
const swapBtn = document.getElementById('swap-btn')
const inputLabel = document.getElementById('input-label')
const chips = document.querySelectorAll('.chip')

//default direction
let mode = 'toEnglish'

function translate() {
    const input = inputText.value.toLowerCase().trim()

    if(!input) return

    const dictionary = mode === 'toEnglish' ? toEnglish : toLinkedIn

    let result

    for (const key in dictionary) {
        if (input.includes(key)) {
            result = dictionary[key]
            break
        }
    }

    if (result) {
            outputText.textContent = result
    } else {
        outputText.textContent = 'Translating...'

        fetch('/api/translate', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({text: input, mode: mode})
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                outputText.textContent = 'Something went wrong, try again!'
                console.error(data.error)
            } else {
                outputText.textContent = data.result
            }
        })
        .catch(err => {
            outputText.textContent = 'Something went wrong, try again!'
            console.error(err)
        })
    }
}

translateBtn.addEventListener('click', translate)

chips.forEach(chip => {
    chip.addEventListener('click', () => {
        inputText.value = chip.textContent
        translate()
    })
})

swapBtn.addEventListener('click', () => {
    mode = mode === 'toEnglish' ? 'toLinkedIn' : 'toEnglish'

    inputLabel.textContent = mode === 'toEnglish' ? 'LinkedIn' : 'English'
    outputLabel.textContent = mode === 'toEnglish' ? 'English' : 'LinkedIn'

    inputText.placeholder = mode === 'toEnglish' 
        ? 'Paste LinkedIn jargon...' 
        : 'Type what you actually mean...'

    inputText.value = ''
    outputText.textContent = ''
})