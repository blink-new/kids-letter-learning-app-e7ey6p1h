import { useState, useCallback } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Button } from './components/ui/button'
import { RadioGroup, RadioGroupItem } from './components/ui/radio-group'
import { Label } from './components/ui/label'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Download } from 'lucide-react'

// Different letter sets
const UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LOWERCASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')

// Complete Nepali Devanagari letters (36 consonants)
const NEPALI_LETTERS = [
  { letter: 'क', pronunciation: 'ka' },
  { letter: 'ख', pronunciation: 'kha' },
  { letter: 'ग', pronunciation: 'ga' },
  { letter: 'घ', pronunciation: 'gha' },
  { letter: 'ङ', pronunciation: 'nga' },
  { letter: 'च', pronunciation: 'cha' },
  { letter: 'छ', pronunciation: 'chha' },
  { letter: 'ज', pronunciation: 'ja' },
  { letter: 'झ', pronunciation: 'jha' },
  { letter: 'ञ', pronunciation: 'nya' },
  { letter: 'ट', pronunciation: 'ta' },
  { letter: 'ठ', pronunciation: 'tha' },
  { letter: 'ड', pronunciation: 'da' },
  { letter: 'ढ', pronunciation: 'dha' },
  { letter: 'ण', pronunciation: 'na' },
  { letter: 'त', pronunciation: 'ta' },
  { letter: 'थ', pronunciation: 'tha' },
  { letter: 'द', pronunciation: 'da' },
  { letter: 'ध', pronunciation: 'dha' },
  { letter: 'न', pronunciation: 'na' },
  { letter: 'प', pronunciation: 'pa' },
  { letter: 'फ', pronunciation: 'pha' },
  { letter: 'ब', pronunciation: 'ba' },
  { letter: 'भ', pronunciation: 'bha' },
  { letter: 'म', pronunciation: 'ma' },
  { letter: 'य', pronunciation: 'ya' },
  { letter: 'र', pronunciation: 'ra' },
  { letter: 'ल', pronunciation: 'la' },
  { letter: 'व', pronunciation: 'wa' },
  { letter: 'श', pronunciation: 'sha' },
  { letter: 'ष', pronunciation: 'shha' },
  { letter: 'स', pronunciation: 'sa' },
  { letter: 'ह', pronunciation: 'ha' },
  { letter: 'क्ष', pronunciation: 'ksha' },
  { letter: 'त्र', pronunciation: 'tra' },
  { letter: 'ज्ञ', pronunciation: 'gya' }
]

// Numbers 1-50
const NUMBERS = Array.from({ length: 50 }, (_, i) => ({
  letter: (i + 1).toString(),
  pronunciation: (i + 1).toString()
}))

// Color variations for each letter to make it more engaging
const LETTER_COLORS = [
  'bg-red-400 hover:bg-red-500',
  'bg-blue-400 hover:bg-blue-500', 
  'bg-green-400 hover:bg-green-500',
  'bg-yellow-400 hover:bg-yellow-500',
  'bg-purple-400 hover:bg-purple-500',
  'bg-pink-400 hover:bg-pink-500',
  'bg-indigo-400 hover:bg-indigo-500',
  'bg-orange-400 hover:bg-orange-500',
]

type LetterMode = 'uppercase' | 'lowercase' | 'nepali' | 'numbers'
type VoiceGender = 'female' | 'male'

function App() {
  const [activeLetters, setActiveLetters] = useState<Set<string>>(new Set())
  const [celebratingLetter, setCelebratingLetter] = useState<string | null>(null)
  const [mode, setMode] = useState<LetterMode>('uppercase')
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female')

  const getCurrentLetters = () => {
    switch (mode) {
      case 'uppercase':
        return UPPERCASE_LETTERS.map(letter => ({ letter, pronunciation: letter }))
      case 'lowercase':
        return LOWERCASE_LETTERS.map(letter => ({ letter, pronunciation: letter }))
      case 'nepali':
        return NEPALI_LETTERS
      case 'numbers':
        return NUMBERS
      default:
        return UPPERCASE_LETTERS.map(letter => ({ letter, pronunciation: letter }))
    }
  }

  const speakLetter = useCallback((pronunciation: string) => {
    // Use Web Speech API to pronounce the letter
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(pronunciation)
      utterance.rate = 0.7
      utterance.pitch = voiceGender === 'female' ? 1.3 : 0.8
      utterance.volume = 0.8
      
      // Set language based on mode
      if (mode === 'nepali') {
        utterance.lang = 'hi-IN' // Use Hindi for better Nepali pronunciation
      } else {
        utterance.lang = 'en-US' // English language
      }
      
      // Wait for voices to load, then select voice
      const selectVoice = () => {
        const voices = speechSynthesis.getVoices()
        if (voices.length > 0) {
          let selectedVoice = null
          
          // For Nepali, try to find Hindi or Nepali voices
          if (mode === 'nepali') {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('hi') || voice.lang.startsWith('ne')
            )
          } else {
            // For English, find gender-specific voices
            const genderKeywords = voiceGender === 'female' 
              ? ['female', 'woman', 'samantha', 'zira', 'susan', 'karen', 'hazel', 'moira', 'tessa', 'veena', 'fiona']
              : ['male', 'man', 'david', 'mark', 'daniel', 'alex', 'tom', 'fred', 'jorge', 'aaron']
            
            selectedVoice = voices.find(voice => {
              const voiceName = voice.name.toLowerCase()
              const voiceURI = voice.voiceURI.toLowerCase()
              return voice.lang.startsWith('en') && 
                     genderKeywords.some(keyword => 
                       voiceName.includes(keyword) || voiceURI.includes(keyword)
                     )
            })
            
            // If no gender-specific voice found, try to find any English voice
            if (!selectedVoice) {
              selectedVoice = voices.find(voice => voice.lang.startsWith('en'))
            }
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice
            console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) for ${voiceGender} ${mode}`)
          }
        }
        
        speechSynthesis.speak(utterance)
      }
      
      // If voices are already loaded, select immediately
      if (speechSynthesis.getVoices().length > 0) {
        selectVoice()
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = selectVoice
      }
    }
  }, [mode, voiceGender])

  const handleLetterHover = useCallback((letter: string, pronunciation: string) => {
    // Add visual feedback
    setActiveLetters(prev => new Set(prev).add(letter))
    setCelebratingLetter(letter)
    
    // Speak the letter
    speakLetter(pronunciation)
    
    // Remove active state after animation
    setTimeout(() => {
      setActiveLetters(prev => {
        const newSet = new Set(prev)
        newSet.delete(letter)
        return newSet
      })
      setCelebratingLetter(null)
    }, 600)
  }, [speakLetter])

  const getLetterColor = (index: number) => {
    return LETTER_COLORS[index % LETTER_COLORS.length]
  }

  const getModeTitle = () => {
    switch (mode) {
      case 'uppercase':
        return '🔤 Capital Letters'
      case 'lowercase':
        return '🔡 Small Letters'
      case 'nepali':
        return '🇳🇵 Nepali Letters (36 Letters)'
      case 'numbers':
        return '🔢 Numbers (1-50)'
      default:
        return '🔤 Letters'
    }
  }

  const downloadSourceCode = useCallback(async () => {
    try {
      const zip = new JSZip()
      
      // Add package.json
      const packageJson = {
        "name": "letter-learning-app",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "lint": "npm run lint:js && npm run lint:css",
          "preview": "vite preview",
          "lint:css": "stylelint \"**/*.css\" --fix --quiet",
          "lint:js": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0 --quiet"
        },
        "dependencies": {
          "@radix-ui/react-label": "^2.1.1",
          "@radix-ui/react-radio-group": "^1.2.3",
          "@radix-ui/react-select": "^2.2.5",
          "@radix-ui/react-slot": "^1.2.3",
          "class-variance-authority": "^0.7.1",
          "clsx": "^2.1.1",
          "lucide-react": "^0.525.0",
          "react": "^19.1.0",
          "react-dom": "^19.1.0",
          "tailwind-merge": "^3.3.1"
        },
        "devDependencies": {
          "@eslint/js": "^9.30.1",
          "@types/react": "^19.1.8",
          "@types/react-dom": "^19.1.6",
          "@vitejs/plugin-react": "^4.6.0",
          "autoprefixer": "^10.4.16",
          "eslint": "^9.30.1",
          "eslint-plugin-react-hooks": "^5.2.0",
          "eslint-plugin-react-refresh": "^0.4.20",
          "globals": "^16.3.0",
          "postcss": "^8.4.31",
          "stylelint": "^16.21.1",
          "stylelint-config-standard": "^38.0.0",
          "tailwindcss": "^3.3.5",
          "tailwindcss-animate": "^1.0.7",
          "typescript": "~5.8.3",
          "typescript-eslint": "^8.35.1",
          "vite": "^7.0.4"
        }
      }
      
      zip.file('package.json', JSON.stringify(packageJson, null, 2))

      // Add index.html
      zip.file('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interactive Letter Learning App for Kids</title>
    <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`)

      // Add main.tsx
      zip.file('src/main.tsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`)

      // Add index.css
      zip.file('src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 48 100% 93%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 0 69% 67%;
    --primary-foreground: 0 0% 98%;
    --secondary: 174 44% 56%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 174 44% 56%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}`)

      // Generate and download the ZIP file
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, 'letter-learning-app-source.zip')
      
    } catch (error) {
      console.error('Error creating ZIP file:', error)
      alert('Error downloading source code. Please try again.')
    }
  }, [])

  const currentLetters = getCurrentLetters()

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Download Button - Fixed Position */}
      <Button
        onClick={downloadSourceCode}
        className="fixed top-4 right-4 z-50 bg-accent hover:bg-accent/90 text-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-105"
        size="sm"
        title="Download Source Code"
      >
        <Download className="h-5 w-5" />
      </Button>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="font-fredoka text-4xl md:text-6xl text-primary mb-4 animate-bounce-gentle">
            🎯 Learn Your Letters! 🎯
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 font-medium mb-6">
            Hover over each letter to hear how it sounds!
          </p>
          
          {/* Voice Gender Selection */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <label className="font-fredoka text-lg md:text-xl text-primary">
              🎤 Choose Voice:
            </label>
            <RadioGroup 
              value={voiceGender} 
              onValueChange={(value: VoiceGender) => setVoiceGender(value)}
              className="flex flex-row gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" className="border-2 border-primary" />
                <Label htmlFor="female" className="text-lg font-medium cursor-pointer">
                  👩 Female Voice
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" className="border-2 border-primary" />
                <Label htmlFor="male" className="text-lg font-medium cursor-pointer">
                  👨 Male Voice
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Mode Selector */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <label className="font-fredoka text-lg md:text-xl text-primary">
              Choose Learning Mode:
            </label>
            <Select value={mode} onValueChange={(value: LetterMode) => setMode(value)}>
              <SelectTrigger className="w-80 h-12 text-lg font-medium bg-card border-2 border-primary/20 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-2 border-primary/20 rounded-xl">
                <SelectItem value="uppercase" className="text-lg py-3 cursor-pointer hover:bg-primary/10">
                  🔤 Capital Letters (A, B, C...)
                </SelectItem>
                <SelectItem value="lowercase" className="text-lg py-3 cursor-pointer hover:bg-primary/10">
                  🔡 Small Letters (a, b, c...)
                </SelectItem>
                <SelectItem value="nepali" className="text-lg py-3 cursor-pointer hover:bg-primary/10">
                  🇳🇵 Nepali Letters (क, ख, ग... - 36 letters)
                </SelectItem>
                <SelectItem value="numbers" className="text-lg py-3 cursor-pointer hover:bg-primary/10">
                  🔢 Numbers (1, 2, 3... up to 50)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Current Mode Title */}
          <h2 className="font-fredoka text-2xl md:text-3xl text-accent mb-4">
            {getModeTitle()}
          </h2>
        </div>

        {/* Letter Grid */}
        <div className={`grid gap-3 md:gap-4 mb-8 ${
          mode === 'nepali' 
            ? 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8' 
            : mode === 'numbers'
            ? 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
            : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7'
        }`}>
          {currentLetters.map((item, index) => {
            const isActive = activeLetters.has(item.letter)
            const isCelebrating = celebratingLetter === item.letter
            
            return (
              <button
                key={item.letter}
                onMouseEnter={() => handleLetterHover(item.letter, item.pronunciation)}
                className={`
                  aspect-square rounded-2xl md:rounded-3xl shadow-lg
                  font-fredoka text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white
                  transform transition-all duration-300 ease-out
                  active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50
                  ${getLetterColor(index)}
                  ${isActive ? 'scale-110 shadow-2xl' : 'hover:scale-105'}
                  ${isCelebrating ? 'animate-bounce-gentle' : ''}
                  ${mode === 'nepali' ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' : ''}
                  ${mode === 'numbers' ? 'text-xl sm:text-2xl md:text-3xl lg:text-4xl' : ''}
                `}
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                {item.letter}
              </button>
            )
          })}
        </div>

        {/* Fun Instructions */}
        <div className="text-center space-y-4">
          <div className="bg-card rounded-2xl p-6 shadow-lg border-2 border-primary/20">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-2xl">🖱️</span>
              <h3 className="font-fredoka text-xl md:text-2xl text-primary">
                How to Play
              </h3>
              <span className="text-2xl">🖱️</span>
            </div>
            <p className="text-base md:text-lg text-foreground/80">
              {mode === 'nepali' 
                ? 'Hover over any Nepali letter to hear its pronunciation! Perfect for learning Devanagari script with all 36 letters!'
                : mode === 'numbers'
                ? 'Hover over any number to hear it spoken! Learn counting from 1 to 50!'
                : `Hover over any ${mode} letter to hear its sound! Perfect for learning the alphabet!`
              }
            </p>
            <p className="text-sm md:text-base text-foreground/60 mt-2">
              🎤 You can choose between male and female voice above!
            </p>
          </div>

          {/* Encouragement */}
          <div className="flex items-center justify-center gap-2 text-lg md:text-xl">
            <span className="animate-pulse-gentle">🌟</span>
            <span className="font-medium text-accent">Great job learning!</span>
            <span className="animate-pulse-gentle">🌟</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-foreground/60">
            Made with ❤️ for young learners
          </p>
        </div>
      </div>
    </div>
  )
}

export default App