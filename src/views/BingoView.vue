<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentStageId = 'bingo'
const currentStagePath = '/bingo'

const videoKeys = {
  stage1: 'thorWeb_stage1_videoWatched',
  stage2: 'thorWeb_stage2_videoWatched',
  stage3: 'thorWeb_stage3_videoWatched',
  stage4: 'thorWeb_stage4_videoWatched',
}

const detailKeys = {
  stage1: [
    'thorWeb_stage1_point1_viewed',
    'thorWeb_stage1_point2_viewed',
    'thorWeb_stage1_point3_viewed',
  ],
  stage2: [
    'thorWeb_stage2_point1_viewed',
    'thorWeb_stage2_point2_viewed',
    'thorWeb_stage2_point3_viewed',
  ],
  stage3: [
    'thorWeb_stage3_point1_viewed',
    'thorWeb_stage3_point2_viewed',
    'thorWeb_stage3_point3_viewed',
  ],
  stage4: [
    'thorWeb_stage4_point1_viewed',
    'thorWeb_stage4_point2_viewed',
    'thorWeb_stage4_point3_viewed',
  ],
}

const videoProgress = ref({
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
})

const detailProgress = ref({
  stage1: 0,
  stage2: 0,
  stage3: 0,
  stage4: 0,
})

const brokenJourneyImages = ref({})
const brokenBingoImages = ref({})
const showBingoHint = ref(false)
const pressedItem = ref(null)
const journeyAxisRef = ref(null)
const bingoContentRef = ref(null)

const activeIntroIndex = ref(0)
const showBingoBoard = ref(false)

const cardAnswerState = ref({})
const activeQuestionCardId = ref(null)
const currentQuestionOptions = ref([])
const selectedOptionId = ref(null)
const answerResult = ref(null)
const lineCheckSubmitted = ref(false)
const showSubmitConfirm = ref(false)

const bingoAnswerStorageKey = 'thorWeb_bingo_answerState'
const bingoResultStorageKey = 'thorWeb_bingo_result'
const bingoSubmittedStorageKey = 'thorWeb_bingo_submitted'

const bubbleItems = ref(createBubbleItems(28))

let bingoHintTimer = null
let pressFeedbackTimer = null

const isTrue = (value) => value === 'true' || value === '1'

/**
 * Bingo 前導說明文字
 * 這裡就是你前四個畫面的文字。
 * image 如果四頁都用同一張背景，就都維持同一張。
 */
const bingoIntroSlides = [
  {
    id: 1,
    image: '/images/bingo/bingo-intro-bg.png',
    lines: [
      '你已經走過四個知識節點，完成了反應爐漫遊旅程。',
      '接下來，將會進入最後的 Bingo 問答挑戰。',
      '請回想剛剛學到的內容，準備把知識組合起來。',
    ],
  },
  {
    id: 2,
    image: '/images/bingo/bingo-intro-bg.png',
    lines: [
      '在這個 Bingo 中，每一格都代表一個和反應爐相關的問題。',
      '請觀察題目，並根據前面節點學到的知識進行回答。',
      '答對越多，就越能完成這趟知識旅程。',
    ],
  },
  {
    id: 3,
    image: '/images/bingo/bingo-intro-bg.png',
    lines: [
      '題目可能和輻射、水池式反應爐、反應爐水池或 BNCT 有關。',
      '不用緊張，這不是考試，而是一次知識回顧。',
      '請試著用自己的理解，完成最後的挑戰。',
    ],
  },
  {
    id: 4,
    image: '/images/bingo/bingo-intro-bg.png',
    lines: [
      '準備好了嗎？',
      '接下來請選擇 Bingo 卡片，開始最終問答。',
    ],
  },
]

/**
 * Bingo 九宮格資料
 * category 代表三個層面：健康與生態、工程與防護、社會與應用。
 * frontImage 是未答對前的負面／疑惑圖象。
 * backImage 是答對後翻開的正面／理解圖象。
 * correctOptionId 對應 options 裡正確答案的 id，選項每次開題會重新洗牌。
 */
const bingoCards = [
  {
    id: 1,
    category: '健康與生態層面',
    frontImage: '/images/bingo/bingo-card-1-negative.png',
    backImage: '/images/bingo/bingo-card-1-positive.png',
    alt: 'Bingo 題目 1',
    question: '這裡放第 1 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述，讓觀眾知道題目在問什麼。',
    correctOptionId: 'b',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放一個常見迷思。' },
      { id: 'b', text: '正確選項 B：這裡放正確答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放另一個常見迷思。' },
    ],
  },
  {
    id: 2,
    category: '工程與防護層面',
    frontImage: '/images/bingo/bingo-card-2-negative.png',
    backImage: '/images/bingo/bingo-card-2-positive.png',
    alt: 'Bingo 題目 2',
    question: '這裡放第 2 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'a',
    options: [
      { id: 'a', text: '正確選項 A：這裡放正確答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放錯誤答案。' },
    ],
  },
  {
    id: 3,
    category: '社會與應用層面',
    frontImage: '/images/bingo/bingo-card-3-negative.png',
    backImage: '/images/bingo/bingo-card-3-positive.png',
    alt: 'Bingo 題目 3',
    question: '這裡放第 3 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'c',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放錯誤答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '正確選項 C：這裡放正確答案。' },
    ],
  },
  {
    id: 4,
    category: '工程與防護層面',
    frontImage: '/images/bingo/bingo-card-4-negative.png',
    backImage: '/images/bingo/bingo-card-4-positive.png',
    alt: 'Bingo 題目 4',
    question: '這裡放第 4 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'b',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放錯誤答案。' },
      { id: 'b', text: '正確選項 B：這裡放正確答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放錯誤答案。' },
    ],
  },
  {
    id: 5,
    category: '健康與生態層面',
    frontImage: '/images/bingo/bingo-card-5-negative.png',
    backImage: '/images/bingo/bingo-card-5-positive.png',
    alt: 'Bingo 題目 5',
    question: '這裡放第 5 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'a',
    options: [
      { id: 'a', text: '正確選項 A：這裡放正確答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放錯誤答案。' },
    ],
  },
  {
    id: 6,
    category: '社會與應用層面',
    frontImage: '/images/bingo/bingo-card-6-negative.png',
    backImage: '/images/bingo/bingo-card-6-positive.png',
    alt: 'Bingo 題目 6',
    question: '這裡放第 6 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'c',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放錯誤答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '正確選項 C：這裡放正確答案。' },
    ],
  },
  {
    id: 7,
    category: '社會與應用層面',
    frontImage: '/images/bingo/bingo-card-7-negative.png',
    backImage: '/images/bingo/bingo-card-7-positive.png',
    alt: 'Bingo 題目 7',
    question: '這裡放第 7 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'b',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放錯誤答案。' },
      { id: 'b', text: '正確選項 B：這裡放正確答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放錯誤答案。' },
    ],
  },
  {
    id: 8,
    category: '健康與生態層面',
    frontImage: '/images/bingo/bingo-card-8-negative.png',
    backImage: '/images/bingo/bingo-card-8-positive.png',
    alt: 'Bingo 題目 8',
    question: '這裡放第 8 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'a',
    options: [
      { id: 'a', text: '正確選項 A：這裡放正確答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '錯誤選項 C：這裡放錯誤答案。' },
    ],
  },
  {
    id: 9,
    category: '工程與防護層面',
    frontImage: '/images/bingo/bingo-card-9-negative.png',
    backImage: '/images/bingo/bingo-card-9-positive.png',
    alt: 'Bingo 題目 9',
    question: '這裡放第 9 題題目文字。',
    description: '問題文字：這裡可以補充一小段情境描述。',
    correctOptionId: 'c',
    options: [
      { id: 'a', text: '錯誤選項 A：這裡放錯誤答案。' },
      { id: 'b', text: '錯誤選項 B：這裡放錯誤答案。' },
      { id: 'c', text: '正確選項 C：這裡放正確答案。' },
    ],
  },
]

const bingoLines = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  [1, 4, 7],
  [2, 5, 8],
  [3, 6, 9],
  [1, 5, 9],
  [3, 5, 7],
]

const categoryResultCodeMap = {
  健康與生態層面: '1',
  工程與防護層面: '2',
  社會與應用層面: '3',
}

const activeIntroSlide = computed(() => bingoIntroSlides[activeIntroIndex.value])

const activeQuestionCard = computed(() => {
  return bingoCards.find((card) => card.id === activeQuestionCardId.value) || null
})

const correctCardIds = computed(() => {
  return Object.entries(cardAnswerState.value)
    .filter(([, state]) => state.isCorrect)
    .map(([id]) => Number(id))
})

const correctCount = computed(() => correctCardIds.value.length)

const completedBingoLine = computed(() => {
  return bingoLines.find((line) => {
    return line.every((cardId) => correctCardIds.value.includes(cardId))
  }) || null
})

const canSubmitLineCheck = computed(() => {
  return correctCount.value >= 3 && completedBingoLine.value !== null
})

const totalStarCount = computed(() => {
  return (
    detailProgress.value.stage1 +
    detailProgress.value.stage2 +
    detailProgress.value.stage3 +
    detailProgress.value.stage4
  )
})

const categoryCounts = computed(() => {
  const counts = {
    健康與生態層面: 0,
    工程與防護層面: 0,
    社會與應用層面: 0,
  }

  correctCardIds.value.forEach((cardId) => {
    const card = bingoCards.find((item) => item.id === cardId)

    if (card && counts[card.category] !== undefined) {
      counts[card.category] += 1
    }
  })

  return counts
})

const categoryTypeCode = computed(() => {
  const entries = Object.entries(categoryCounts.value)
  const maxCount = Math.max(...entries.map(([, count]) => count))
  const topCategories = entries.filter(([, count]) => count === maxCount)

  if (topCategories.length === 3) {
    return '5'
  }

  if (topCategories.length === 2) {
    return '4'
  }

  return categoryResultCodeMap[topCategories[0][0]]
})

const starStageCode = computed(() => {
  if (totalStarCount.value >= 12) {
    return 'd'
  }

  if (totalStarCount.value >= 8) {
    return 'c'
  }

  if (totalStarCount.value >= 4) {
    return 'b'
  }

  return 'a'
})

const resultCode = computed(() => {
  return `${categoryTypeCode.value}-${starStageCode.value}`
})

const lineCheckButtonText = computed(() => {
  return lineCheckSubmitted.value ? '已提交連線' : '提交連線檢查'
})

const isReadySlide = computed(() => {
  return activeIntroIndex.value === bingoIntroSlides.length - 1
})

const bingoIntroStyle = computed(() => ({
  '--bingo-intro-bg': `url("${activeIntroSlide.value.image}")`,
}))

const bingoUnlocked = computed(() => {
  return (
    videoProgress.value.stage1 &&
    videoProgress.value.stage2 &&
    videoProgress.value.stage3 &&
    videoProgress.value.stage4
  )
})

const journeySteps = computed(() => [
  {
    id: 'stage1',
    title: '知識起點',
    subtitle: '- 輻射 -',
    path: '/stage1',
    image: '/images/home/journey-stage1.png',
    imageUnlocked: videoProgress.value.stage1,
    detailCount: detailProgress.value.stage1,
    isCurrent: false,
    isBingo: false,
  },
  {
    id: 'stage2',
    title: '化知識為力量',
    subtitle: '- 水池式反應爐 -',
    path: '/stage2',
    image: '/images/home/journey-stage2.png',
    imageUnlocked: videoProgress.value.stage2,
    detailCount: detailProgress.value.stage2,
    isCurrent: false,
    isBingo: false,
  },
  {
    id: 'stage3',
    title: '力量的痕跡',
    subtitle: '- 反應爐水池 -',
    path: '/stage3',
    image: '/images/home/journey-stage3.png',
    imageUnlocked: videoProgress.value.stage3,
    detailCount: detailProgress.value.stage3,
    isCurrent: false,
    isBingo: false,
  },
  {
    id: 'stage4',
    title: '自力量誕生的希望',
    subtitle: '- BNCT治療室 -',
    path: '/stage4',
    image: '/images/home/journey-stage4.png',
    imageUnlocked: videoProgress.value.stage4,
    detailCount: detailProgress.value.stage4,
    isCurrent: false,
    isBingo: false,
  },
  {
    id: 'bingo',
    title: '最終考驗',
    subtitle: '- Bingo問答 -',
    path: '/bingo',
    image: '/images/home/journey-bingo.png',
    imageUnlocked: bingoUnlocked.value,
    detailCount: 0,
    isCurrent: true,
    isBingo: true,
  },
])

function createBubbleItems(count) {
  return Array.from({ length: count }, (_, index) => {
    const size = Math.round(12 + Math.random() * 54)
    const duration = 8 + Math.random() * 10
    const delay = -(Math.random() * duration)
    const drift = Math.round(-46 + Math.random() * 92)

    return {
      id: index,
      style: {
        '--bubble-size': `${size}px`,
        '--bubble-left': `${Math.random() * 100}%`,
        '--bubble-duration': `${duration.toFixed(2)}s`,
        '--bubble-delay': `${delay.toFixed(2)}s`,
        '--bubble-drift': `${drift}px`,
        '--bubble-opacity': `${(0.22 + Math.random() * 0.28).toFixed(2)}`,
      },
    }
  })
}

function loadProgress() {
  videoProgress.value = {
    stage1: isTrue(localStorage.getItem(videoKeys.stage1)),
    stage2: isTrue(localStorage.getItem(videoKeys.stage2)),
    stage3: isTrue(localStorage.getItem(videoKeys.stage3)),
    stage4: isTrue(localStorage.getItem(videoKeys.stage4)),
  }

  detailProgress.value = {
    stage1: detailKeys.stage1.filter((key) => isTrue(localStorage.getItem(key))).length,
    stage2: detailKeys.stage2.filter((key) => isTrue(localStorage.getItem(key))).length,
    stage3: detailKeys.stage3.filter((key) => isTrue(localStorage.getItem(key))).length,
    stage4: detailKeys.stage4.filter((key) => isTrue(localStorage.getItem(key))).length,
  }
}

function runPressFeedback(key, action, delay = 150) {
  pressedItem.value = key

  if (pressFeedbackTimer) {
    clearTimeout(pressFeedbackTimer)
  }

  pressFeedbackTimer = setTimeout(() => {
    pressedItem.value = null
    action()
  }, delay)
}

function focusCurrentJourneyStep(behavior = 'smooth') {
  nextTick(() => {
    const axis = journeyAxisRef.value

    if (!axis) {
      return
    }

    const isMobile = window.matchMedia('(max-width: 760px)').matches

    if (!isMobile) {
      return
    }

    const currentStep = axis.querySelector(`[data-stage-id="${currentStageId}"]`)

    if (!currentStep) {
      return
    }

    const targetLeft =
      currentStep.offsetLeft - axis.clientWidth / 2 + currentStep.clientWidth / 2

    axis.scrollTo({
      left: Math.max(0, targetLeft),
      behavior,
    })
  })
}

function scrollToBingoContent() {
  nextTick(() => {
    bingoContentRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

function goToStep(step) {
  if (step.isBingo && !bingoUnlocked.value && step.path !== currentStagePath) {
    showBingoHint.value = true

    if (bingoHintTimer) {
      clearTimeout(bingoHintTimer)
    }

    bingoHintTimer = setTimeout(() => {
      showBingoHint.value = false
    }, 3000)

    return
  }

  runPressFeedback(`journey-${step.id}`, () => {
    if (step.path === currentStagePath) {
      scrollToBingoContent()
      return
    }

    if (step.isBingo) {
      router.push(step.path)
      return
    }

    router.push({
      path: step.path,
      hash: '#stage-title',
    })
  })
}

function handleJourneyImageError(stepId) {
  brokenJourneyImages.value = {
    ...brokenJourneyImages.value,
    [stepId]: true,
  }
}

function handleBingoImageError(cardId) {
  brokenBingoImages.value = {
    ...brokenBingoImages.value,
    [cardId]: true,
  }
}

function getBingoCardImage(card) {
  const isCorrect = cardAnswerState.value[card.id]?.isCorrect
  return isCorrect ? card.backImage : card.frontImage
}

function shuffleArray(array) {
  const copiedArray = [...array]

  for (let index = copiedArray.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const temporaryItem = copiedArray[index]
    copiedArray[index] = copiedArray[randomIndex]
    copiedArray[randomIndex] = temporaryItem
  }

  return copiedArray
}

function prepareQuestionOptions(card) {
  currentQuestionOptions.value = shuffleArray(card.options)
  selectedOptionId.value = null
  answerResult.value = null
}

function openBingoCard(card) {
  if (cardAnswerState.value[card.id]?.isCorrect) {
    return
  }

  runPressFeedback(`bingo-card-${card.id}`, () => {
    activeQuestionCardId.value = card.id
    prepareQuestionOptions(card)
  }, 110)
}

function closeQuestionModal() {
  activeQuestionCardId.value = null
  currentQuestionOptions.value = []
  selectedOptionId.value = null
  answerResult.value = null
}

function loadBingoAnswerState() {
  try {
    const savedState = localStorage.getItem(bingoAnswerStorageKey)

    if (!savedState) {
      return
    }

    cardAnswerState.value = JSON.parse(savedState)
  } catch (error) {
    cardAnswerState.value = {}
  }
}

function saveBingoAnswerState() {
  localStorage.setItem(
    bingoAnswerStorageKey,
    JSON.stringify(cardAnswerState.value),
  )
}

function selectQuestionOption(option) {
  const card = activeQuestionCard.value

  if (!card || answerResult.value) {
    return
  }

  selectedOptionId.value = option.id

  const isCorrect = option.id === card.correctOptionId
  answerResult.value = isCorrect ? 'correct' : 'wrong'

  if (isCorrect) {
    cardAnswerState.value = {
      ...cardAnswerState.value,
      [card.id]: {
        isCorrect: true,
      },
    }

    saveBingoAnswerState()
  }
}

function submitLineCheck() {
  if (!canSubmitLineCheck.value) {
    return
  }

  runPressFeedback('line-check-button', () => {
    showSubmitConfirm.value = true
  })
}

function cancelSubmitLineCheck() {
  showSubmitConfirm.value = false
}

function confirmSubmitLineCheck() {
  const resultPayload = {
    resultCode: resultCode.value,
    categoryTypeCode: categoryTypeCode.value,
    starStageCode: starStageCode.value,
    totalStars: totalStarCount.value,
    correctCardIds: correctCardIds.value,
    completedBingoLine: completedBingoLine.value,
    categoryCounts: categoryCounts.value,
    submittedAt: new Date().toISOString(),
  }

  localStorage.setItem(bingoAnswerStorageKey, JSON.stringify(cardAnswerState.value))
  localStorage.setItem(bingoResultStorageKey, JSON.stringify(resultPayload))
  localStorage.setItem(bingoSubmittedStorageKey, 'true')

  lineCheckSubmitted.value = true
  showSubmitConfirm.value = false

  router.push('/bingo-result')
}

function handleIntroScreenClick() {
  if (showBingoBoard.value || isReadySlide.value) {
    return
  }

  activeIntroIndex.value += 1
}

function showBingoBoardWithFeedback() {
  runPressFeedback('ready-button', () => {
    showBingoBoard.value = true

    nextTick(() => {
      bingoContentRef.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  })
}

function goHome() {
  runPressFeedback('home-button', () => {
    router.push({
      path: '/',
      hash: '#home-journey',
    })
  })
}

onMounted(() => {
  loadProgress()
  loadBingoAnswerState()

  if (isTrue(localStorage.getItem(bingoSubmittedStorageKey))) {
    router.replace('/bingo-result')
    return
  }

  window.addEventListener('focus', loadProgress)
  window.addEventListener('storage', loadProgress)

  focusCurrentJourneyStep('auto')

  window.setTimeout(() => {
    focusCurrentJourneyStep('auto')
  }, 250)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', loadProgress)
  window.removeEventListener('storage', loadProgress)

  if (bingoHintTimer) {
    clearTimeout(bingoHintTimer)
  }

  if (pressFeedbackTimer) {
    clearTimeout(pressFeedbackTimer)
  }
})
</script>

<template>
  <main class="stage-page bingo-page">
    <div class="background-bubbles" aria-hidden="true">
      <span
        v-for="bubble in bubbleItems"
        :key="bubble.id"
        class="bubble"
        :style="bubble.style"
      ></span>
    </div>

    <!-- 上方旅程軸 -->
    <section class="journey-section" aria-label="爐心漫遊旅程軸" ref="journeyAxisRef">
      <div class="journey-track">
        <div class="track-line" aria-hidden="true"></div>

        <button
          v-for="step in journeySteps"
          :key="step.id"
          class="journey-step"
          :class="{
            'is-current': step.isCurrent,
            'is-unlocked': step.imageUnlocked,
            'is-locked': step.isBingo && !bingoUnlocked,
            'is-pressed': pressedItem === `journey-${step.id}`,
          }"
          :data-stage-id="step.id"
          type="button"
          :aria-disabled="step.isBingo && !bingoUnlocked"
          @click="goToStep(step)"
        >
          <div class="card-box">
            <img
              v-if="step.imageUnlocked && !brokenJourneyImages[step.id]"
              class="card-image"
              :src="step.image"
              :alt="`${step.title}${step.subtitle}`"
              @error="handleJourneyImageError(step.id)"
            />

            <div v-else class="card-placeholder">
              <span v-if="step.isBingo && !bingoUnlocked" class="lock-icon">
                LOCK
              </span>
            </div>
          </div>

          <div v-if="!step.isBingo" class="star-row" aria-label="知識重點解鎖數量">
            <span
              v-for="starIndex in 3"
              :key="starIndex"
              class="star"
              :class="{ 'is-active': starIndex <= step.detailCount }"
            >
              ★
            </span>
          </div>

          <div v-else class="star-row star-row-empty" aria-hidden="true"></div>

          <div class="dot-wrap">
            <span v-if="step.isCurrent" class="current-flag" aria-hidden="true"></span>
            <span class="dot" aria-hidden="true"></span>
          </div>

          <div class="step-label">
            <span class="step-title">{{ step.title }}</span>
            <span class="step-subtitle">{{ step.subtitle }}</span>
          </div>
        </button>
      </div>

      <p v-if="showBingoHint" class="bingo-hint">
        需要先完成四個節點的影片觀看，才能進入最終 Bingo 問答。
      </p>
    </section>

    <!-- Bingo 主內容 -->
    <div
      ref="bingoContentRef"
      class="bingo-content-anchor"
      :class="{ 'has-modal-open': activeQuestionCard || showSubmitConfirm }"
    >
      <Transition name="bingo-screen-fade" mode="out-in">
        <!-- 前四頁：文字＋大張背景圖 -->
        <section
          v-if="!showBingoBoard"
          key="bingo-intro"
          class="bingo-intro"
          :class="{ 'is-clickable': !isReadySlide }"
          :style="bingoIntroStyle"
          aria-label="Bingo 問答前導說明"
          @click="handleIntroScreenClick"
        >
          <Transition name="intro-fade" mode="out-in">
            <div :key="activeIntroSlide.id" class="bingo-intro-content">
              <p
                v-for="line in activeIntroSlide.lines"
                :key="line"
              >
                {{ line }}
              </p>

              <p v-if="!isReadySlide" class="intro-click-hint">
                點擊畫面繼續
              </p>

              <button
                v-if="isReadySlide"
                class="bingo-ready-button"
                :class="{ 'is-pressed': pressedItem === 'ready-button' }"
                type="button"
                @click.stop="showBingoBoardWithFeedback"
              >
                我準備好了！
              </button>
            </div>
          </Transition>
        </section>

        <!-- 第五頁：Bingo 九宮格 -->
        <section
          v-else
          key="bingo-board"
          class="bingo-board-section"
          aria-label="Bingo 問答九宮格"
        >
          <div class="bingo-title-card">
            <p>最終考驗</p>
            <h1>- Bingo 問答 -</h1>
          </div>

          <div class="bingo-grid">
            <button
              v-for="card in bingoCards"
              :key="card.id"
              class="bingo-card"
              :class="{
                'is-solved': cardAnswerState[card.id]?.isCorrect,
                'is-pressed': pressedItem === `bingo-card-${card.id}`,
              }"
              type="button"
              :aria-label="card.alt"
              @click="openBingoCard(card)"
            >
              <img
                v-if="!brokenBingoImages[card.id]"
                :src="getBingoCardImage(card)"
                :alt="card.alt"
                @error="handleBingoImageError(card.id)"
              />

              <span v-else class="bingo-card-placeholder">
                Bingo {{ card.id }}
              </span>
            </button>
          </div>

          <p class="bingo-progress-text">
            目前答對 {{ correctCount }} / 9 題
          </p>

          <div class="bingo-board-actions">
            <button
              class="nav-button nav-button-home"
              :class="{ 'is-pressed': pressedItem === 'home-button' }"
              type="button"
              @click="goHome"
            >
              <span class="icon-slot" aria-hidden="true">
                <svg class="home-icon" viewBox="0 0 24 24" focusable="false">
                  <path
                    d="M3.5 10.8 12 3.5l8.5 7.3"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5.8 10.4v9.1h4.1v-5.2h4.2v5.2h4.1v-9.1"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>

              <span class="nav-button-text">回到首頁</span>
            </button>

            <button
              v-if="canSubmitLineCheck"
              class="nav-button nav-button-line-check"
              :class="{ 'is-pressed': pressedItem === 'line-check-button' }"
              type="button"
              @click="submitLineCheck"
            >
              <span class="icon-slot" aria-hidden="true">⌕</span>
              <span class="nav-button-text">{{ lineCheckButtonText }}</span>
            </button>
          </div>

          <Transition name="question-modal-fade">
            <div
              v-if="activeQuestionCard"
              class="question-modal-backdrop"
              role="dialog"
              aria-modal="true"
              aria-label="Bingo 題目視窗"
              @click.self="closeQuestionModal"
            >
              <article class="question-modal">
                <button
                  class="question-close-button"
                  type="button"
                  aria-label="關閉題目視窗"
                  @click="closeQuestionModal"
                >
                  ×
                </button>

                <h2>No.{{ activeQuestionCard.id }} 問題</h2>
                <p class="question-category">{{ activeQuestionCard.category }}</p>

                <div class="question-content-card">
                  <p class="question-text">{{ activeQuestionCard.question }}</p>
                  <p class="question-description">{{ activeQuestionCard.description }}</p>

                  <div class="question-options">
                    <button
                      v-for="(option, optionIndex) in currentQuestionOptions"
                      :key="option.id"
                      class="question-option"
                      :class="{
                        'is-selected': selectedOptionId === option.id,
                        'is-correct': answerResult === 'correct' && selectedOptionId === option.id,
                        'is-wrong': answerResult === 'wrong' && selectedOptionId === option.id,
                      }"
                      type="button"
                      @click="selectQuestionOption(option)"
                    >
                      <span class="option-label">
                        ({{ ['A', 'B', 'C'][optionIndex] }})
                      </span>
                      <span class="option-text">{{ option.text }}</span>
                      <span
                        v-if="selectedOptionId === option.id && answerResult"
                        class="option-result-icon"
                        aria-hidden="true"
                      >
                        {{ answerResult === 'correct' ? '✓' : '×' }}
                      </span>
                    </button>
                  </div>

                  <p v-if="answerResult === 'correct'" class="answer-feedback is-correct">
                    答對了！這張 Bingo 卡已翻開成正面圖象。
                  </p>

                  <p v-else-if="answerResult === 'wrong'" class="answer-feedback is-wrong">
                    答錯了，這張卡還不會翻開。關閉後可以重新進入，選項順序會重新打亂。
                  </p>

                  <button
                    v-if="answerResult"
                    class="question-return-button"
                    type="button"
                    @click="closeQuestionModal"
                  >
                    {{ answerResult === 'correct' ? '回到 Bingo 卡' : '再試一次' }}
                  </button>
                </div>
              </article>
            </div>
          </Transition>
        </section>
      </Transition>

      <Transition name="question-modal-fade">
        <div
          v-if="showSubmitConfirm"
          class="question-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="提交連線檢查確認視窗"
          @click.self="cancelSubmitLineCheck"
        >
          <article class="submit-confirm-modal">
            <h2>確定要現在提交檢查嗎？</h2>

            <p>
              一旦開始組裝，就無法回過頭瀏覽知識重點，以及答題了喔！
            </p>

            <button
              class="submit-confirm-button is-confirm"
              type="button"
              @click="confirmSubmitLineCheck"
            >
              確定，開始組裝吧！
            </button>

            <button
              class="submit-confirm-button is-cancel"
              type="button"
              @click="cancelSubmitLineCheck"
            >
              再等等好了
            </button>
          </article>
        </div>
      </Transition>

    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>指導單位：國立清華大學 王俊程、謝小芩、吳順吉、盧崇真 教授</p>
      <p>資料來源：國立清華大學 清華水池式反應爐</p>
      <p>網頁UI設計與程式撰寫：吳佳穎</p>
      <p>影片製作與資料蒐集撰寫：林沛妤、陳郁阡、張昕愛</p>
    </footer>
  </main>
</template>

<style scoped>
.stage-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  color: #ffffff;
  background:
    linear-gradient(
      180deg,
      #c9f3f6 0%,
      #9bd2ec 24%,
      #5fa5d7 48%,
      #1f61b2 72%,
      #0b3473 100%
    );
  overflow-x: hidden;
  font-family:
    "Noto Sans TC",
    "Microsoft JhengHei",
    "PingFang TC",
    system-ui,
    sans-serif;
}

.stage-page,
.stage-page * {
  box-sizing: border-box;
}

.background-bubbles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.stage-page > :not(.background-bubbles) {
  position: relative;
  z-index: 1;
}

.bubble {
  position: absolute;
  left: var(--bubble-left);
  bottom: calc(var(--bubble-size) * -1);
  width: var(--bubble-size);
  height: var(--bubble-size);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background:
    radial-gradient(
      circle at 34% 28%,
      rgba(255, 255, 255, 0.82),
      rgba(201, 255, 255, 0.32) 46%,
      rgba(255, 255, 255, 0) 72%
    );
  opacity: 0;
  animation: bubble-float var(--bubble-duration) ease-in infinite;
  animation-delay: var(--bubble-delay);
}

@keyframes bubble-float {
  0% {
    transform: translate3d(0, 0, 0) scale(0.65);
    opacity: 0;
  }

  14% {
    opacity: var(--bubble-opacity);
  }

  78% {
    opacity: var(--bubble-opacity);
  }

  100% {
    transform: translate3d(var(--bubble-drift), -112vh, 0) scale(1.08);
    opacity: 0;
  }
}

/* =========================
   Top Journey
========================= */

.journey-section {
  background: #062c68;
  padding: 42px 28px 48px;
  text-align: center;
}

.journey-track {
  position: relative;
  width: min(1420px, 94vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  column-gap: 58px;
  align-items: start;
}

.track-line {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 198px;
  height: 5px;
  background: #ffffff;
  border-radius: 999px;
  transform: translateY(-50%);
  z-index: 0;
}

.journey-step {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  border: 0;
  padding: 0;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
}

.card-box {
  width: 148px;
  height: 84px;
  border-radius: 7px;
  overflow: hidden;
  background: #d8d8d8;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.12);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0)),
    #d9d9d9;
  display: grid;
  place-items: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.lock-icon {
  color: rgba(15, 32, 62, 0.45);
  font-size: var(--font-journey-lock, 14px);
  font-weight: 900;
  letter-spacing: 0.16em;
}

.star-row {
  height: 34px;
  margin-top: -8px;
  display: flex;
  align-items: start;
  justify-content: center;
  gap: 9px;
  pointer-events: none;
}

.star-row-empty {
  visibility: hidden;
}

.star {
  color: #111600;
  font-size: var(--font-stage-journey-star, 22px);
  line-height: 1;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.22),
    0 2px 4px rgba(0, 0, 0, 0.35);
}

.star.is-active {
  color: #ffe934;
}

.dot-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  margin-top: 66px;
  display: grid;
  place-items: center;
}

.dot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.08);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.current-flag {
  position: absolute;
  left: 15px;
  bottom: 50px;
  width: 34px;
  height: 42px;
  background: transparent;
  border-left: 5px solid #fff032;
  border-radius: 4px;
}

.current-flag::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 30px;
  height: 22px;
  background: #fff032;
  clip-path: polygon(0 0, 100% 0, 78% 50%, 100% 100%, 0 100%);
}

.step-label {
  min-height: 64px;
  margin-top: 22px;
  color: #ffffff;
  font-size: var(--font-stage-step-label, 16px);
  line-height: 1.35;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.step-title,
.step-subtitle {
  display: block;
}

.journey-step:hover .card-box,
.journey-step:focus-visible .card-box {
  transform: translateY(-4px);
  box-shadow:
    0 8px 0 rgba(0, 0, 0, 0.12),
    0 14px 24px rgba(0, 0, 0, 0.2);
}

.journey-step.is-current .step-label {
  color: #fff032;
  font-weight: 800;
}

.journey-step.is-locked {
  opacity: 0.58;
}

.journey-step.is-locked:hover .card-box,
.journey-step.is-locked:focus-visible .card-box {
  transform: none;
  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.12);
}

.bingo-hint {
  width: fit-content;
  max-width: min(620px, 88vw);
  margin: 32px auto 0;
  padding: 12px 22px;
  border-radius: 999px;
  background: rgba(201, 255, 255, 0.16);
  color: #e8ffff;
  font-weight: 700;
  font-size: var(--font-bingo-hint, 16px);
  letter-spacing: 0.04em;
}

/* =========================
   Bingo Content
========================= */

.bingo-content-anchor {
  position: relative;
  z-index: 1;
  scroll-margin-top: 32px;
}

.bingo-content-anchor.has-modal-open {
  z-index: 80;
}

/* 前四頁：文字＋大圖 */
.bingo-intro {
  position: relative;
  min-height: clamp(580px, 68dvh, 780px);
  padding: 90px 20px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: transparent;
  text-align: center;
}

.bingo-intro::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(rgba(3, 14, 42, 0.32), rgba(3, 14, 42, 0.32)),
    var(--bingo-intro-bg);
  background-size: cover;
  background-position: center;
}

.bingo-intro-bubbles {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.bingo-intro.is-clickable {
  cursor: pointer;
}

.bingo-intro-content {
  position: relative;
  z-index: 2;
  width: min(940px, 88vw);
  color: #ffffff;
  font-size: clamp(18px, 2.1vw, 32px);
  line-height: 2;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-shadow:
    0 4px 14px rgba(0, 0, 0, 0.48),
    0 2px 0 rgba(0, 0, 0, 0.18);
}

.bingo-intro-content p {
  margin: 0 0 14px;
}

.intro-click-hint {
  margin-top: 42px !important;
  font-size: clamp(14px, 1.3vw, 18px);
  font-weight: 600;
  opacity: 0.82;
  letter-spacing: 0.12em;
}

.bingo-ready-button {
  width: min(360px, 72vw);
  min-height: 64px;
  margin-top: 34px;
  border: 0;
  border-radius: 8px;
  background: #c9fffb;
  color: #111827;
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow:
    0 7px 0 rgba(8, 28, 65, 0.28),
    0 18px 34px rgba(0, 20, 60, 0.18);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.bingo-ready-button:hover,
.bingo-ready-button:focus-visible {
  transform: translateY(-3px);
  background: #ffffff;
  box-shadow:
    0 9px 0 rgba(8, 28, 65, 0.28),
    0 22px 40px rgba(0, 20, 60, 0.24);
}

.bingo-ready-button.is-pressed {
  transform: scale(0.97);
  background: #ffffff;
  box-shadow:
    0 3px 0 rgba(8, 28, 65, 0.28),
    0 8px 18px rgba(0, 20, 60, 0.18);
}

/* 文字淡入淡出 */
.intro-fade-enter-active,
.intro-fade-leave-active {
  transition:
    opacity 0.36s ease,
    transform 0.36s ease,
    filter 0.36s ease;
}

.intro-fade-enter-from {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(4px);
}

.intro-fade-leave-to {
  opacity: 0;
  transform: translateY(-18px);
  filter: blur(4px);
}

.intro-fade-enter-to,
.intro-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

/* intro 切到九宮格 */
.bingo-screen-fade-enter-active,
.bingo-screen-fade-leave-active {
  transition: opacity 0.32s ease;
}

.bingo-screen-fade-enter-from,
.bingo-screen-fade-leave-to {
  opacity: 0;
}

.bingo-screen-fade-enter-to,
.bingo-screen-fade-leave-from {
  opacity: 1;
}

/* 第五頁：九宮格 */
.bingo-board-section {
  padding: 58px 20px 72px;
  text-align: center;
  scroll-margin-top: 32px;
}

.bingo-title-card {
  width: min(520px, 82vw);
  margin: 0 auto 42px;
  padding: 22px 20px 24px;
  border-radius: 8px;
  border: 5px solid #174ca4;
  background: #005d96;
  color: #ffffff;
  box-shadow: 0 6px 0 rgba(4, 38, 93, 0.22);
}

.bingo-title-card p {
  margin: 0 0 6px;
  font-size: clamp(16px, 1.5vw, 24px);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.bingo-title-card h1 {
  margin: 0;
  font-size: clamp(22px, 2.4vw, 38px);
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.bingo-grid {
  width: min(720px, 86vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(14px, 2vw, 28px);
}

.bingo-card {
  position: relative;
  aspect-ratio: 1 / 1;
  border: 0;
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
  background: #d9e8ff;
  color: #062c68;
  cursor: pointer;
  box-shadow:
    0 6px 0 rgba(8, 28, 65, 0.28),
    0 14px 26px rgba(0, 20, 60, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.bingo-card img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.bingo-card-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: clamp(16px, 2vw, 24px);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.bingo-card:hover,
.bingo-card:focus-visible {
  transform: translateY(-4px);
  filter: brightness(1.06);
  box-shadow:
    0 9px 0 rgba(8, 28, 65, 0.28),
    0 20px 34px rgba(0, 20, 60, 0.24);
}

.bingo-board-actions {
  margin-top: 140px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 56px;
  flex-wrap: wrap;
}


.bingo-card.is-solved {
  background: transparent;
}

.bingo-card.is-pressed {
  transform: scale(0.97);
  filter: brightness(1.08);
}

.bingo-progress-text {
  margin: 42px auto 0;
  color: #e8fbff;
  font-size: clamp(17px, 1.5vw, 24px);
  font-weight: 800;
  letter-spacing: 0.08em;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.26);
}

.nav-button-line-check .icon-slot {
  right: 36px;
}

.submit-confirm-modal {
  width: min(980px, 92vw);
  max-height: calc(100dvh - 48px);
  margin: auto 0;
  overflow-y: auto;
  padding: clamp(42px, 6vw, 72px);
  border-radius: 10px;
  background: #062c68;
  color: #ffffff;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(28px, 4vw, 44px);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.36);
}

.submit-confirm-modal h2 {
  max-width: 760px;
  margin: 0;
  font-size: clamp(28px, 3vw, 46px);
  line-height: 1.35;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-align: center;
}

.submit-confirm-modal p {
  max-width: 760px;
  margin: 0;
  font-size: clamp(18px, 1.8vw, 28px);
  line-height: 1.8;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-align: center;
}

.submit-confirm-button {
  width: min(760px, 78vw);
  min-height: 86px;
  margin: 0 auto;
  border: 0;
  border-radius: 8px;
  color: #111827;
  font-size: clamp(20px, 2vw, 30px);
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow:
    0 7px 0 rgba(8, 28, 65, 0.28),
    0 18px 34px rgba(0, 20, 60, 0.18);
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

.submit-confirm-button:hover,
.submit-confirm-button:focus-visible {
  transform: translateY(-3px);
  filter: brightness(1.04);
  box-shadow:
    0 9px 0 rgba(8, 28, 65, 0.28),
    0 22px 40px rgba(0, 20, 60, 0.24);
}

.submit-confirm-button.is-confirm {
  background: #b8ffaf;
}

.submit-confirm-button.is-cancel {
  background: #ffa4a4;
}

.question-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  padding: clamp(16px, 3vw, 32px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  background: rgba(0, 10, 36, 0.56);
  backdrop-filter: blur(3px);
}

.question-modal {
  position: relative;
  width: min(980px, 92vw);
  max-height: calc(100dvh - 48px);
  margin: auto 0;
  overflow-y: auto;
  padding: clamp(34px, 4vw, 58px);
  border-radius: 10px;
  background: #062c68;
  color: #ffffff;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
  text-align: center;
}

.question-modal h2 {
  margin: 0;
  font-size: clamp(26px, 3vw, 44px);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.question-category {
  margin: 12px 0 30px;
  font-size: clamp(15px, 1.4vw, 20px);
  font-weight: 800;
  color: #c9fffb;
  letter-spacing: 0.08em;
}

.question-close-button {
  position: absolute;
  top: 16px;
  right: 18px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
}

.question-content-card {
  width: min(760px, 100%);
  margin: 0 auto;
  padding: clamp(28px, 3.6vw, 48px);
  border-radius: 8px;
  background: #031f4a;
  text-align: left;
}

.question-text,
.question-description {
  margin: 0;
  font-size: clamp(15px, 1.3vw, 19px);
  line-height: 1.8;
  letter-spacing: 0.04em;
}

.question-description {
  margin-top: 10px;
  opacity: 0.88;
}

.question-options {
  margin-top: 44px;
  display: grid;
  gap: 18px;
}

.question-option {
  position: relative;
  min-height: 72px;
  padding: 18px 78px 18px 24px;
  border: 0;
  border-radius: 7px;
  background: #e8fbff;
  color: #111827;
  font-size: clamp(15px, 1.35vw, 20px);
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease,
    box-shadow 0.16s ease;
}

.question-option:hover,
.question-option:focus-visible {
  transform: translateY(-2px);
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
}

.question-option.is-correct {
  background: #61ff58;
  color: #061d0c;
}

.question-option.is-wrong {
  background: #ff4b4b;
  color: #111111;
}

.option-label {
  margin-right: 8px;
  font-weight: 900;
}

.option-result-icon {
  position: absolute;
  right: 26px;
  top: 50%;
  transform: translateY(-50%);
  font-size: clamp(34px, 4vw, 54px);
  font-weight: 900;
  line-height: 1;
}

.answer-feedback {
  margin: 28px 0 0;
  font-size: clamp(15px, 1.3vw, 19px);
  line-height: 1.7;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
}

.answer-feedback.is-correct {
  color: #82ff7a;
}

.answer-feedback.is-wrong {
  color: #ffb3b3;
}

.question-return-button {
  width: min(280px, 72vw);
  min-height: 54px;
  margin: 24px auto 0;
  border: 0;
  border-radius: 8px;
  background: #c9fffb;
  color: #111827;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.08em;
  display: block;
  cursor: pointer;
}

.question-modal-fade-enter-active,
.question-modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.question-modal-fade-enter-active .question-modal,
.question-modal-fade-leave-active .question-modal,
.question-modal-fade-enter-active .submit-confirm-modal,
.question-modal-fade-leave-active .submit-confirm-modal {
  transition: transform 0.22s ease;
}

.question-modal-fade-enter-from,
.question-modal-fade-leave-to {
  opacity: 0;
}

.question-modal-fade-enter-from .question-modal,
.question-modal-fade-leave-to .question-modal,
.question-modal-fade-enter-from .submit-confirm-modal,
.question-modal-fade-leave-to .submit-confirm-modal {
  transform: translateY(24px) scale(0.98);
}

/* =========================
   Buttons
========================= */

.nav-button {
  width: min(390px, 38vw);
  min-height: 82px;
  padding: 0 86px;
  border: 0;
  border-radius: 8px;
  background: #e8fbff;
  color: #111827;
  font-size: var(--font-stage-nav-button, 22px);
  font-weight: 500;
  letter-spacing: 0.06em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
  box-shadow:
    0 7px 0 rgba(8, 28, 65, 0.28),
    0 18px 34px rgba(0, 20, 60, 0.18);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.nav-button:hover,
.nav-button:focus-visible {
  transform: translateY(-3px);
  background: #ffffff;
  box-shadow:
    0 9px 0 rgba(8, 28, 65, 0.28),
    0 22px 40px rgba(0, 20, 60, 0.24);
}

.icon-slot {
  position: absolute;
  min-width: 44px;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
  font-size: var(--font-stage-nav-icon, 26px);
  line-height: 1;
  font-weight: 900;
  color: #000000;
}

.nav-button-home .icon-slot {
  left: 36px;
}

.home-icon {
  width: 1em;
  height: 1em;
  display: block;
}

.nav-button-text {
  display: inline-block;
  text-align: center;
}

.nav-button.is-pressed {
  transform: scale(0.97);
  background: #ffffff;
  box-shadow:
    0 3px 0 rgba(8, 28, 65, 0.28),
    0 8px 18px rgba(0, 20, 60, 0.18);
}

/* =========================
   Footer
========================= */

.footer {
  background: #062c68;
  padding: 54px 20px 48px;
  color: #dbe8ff;
  font-size: var(--font-footer, 15px);
  line-height: 1.55;
  letter-spacing: 0.04em;
}

.footer p {
  width: min(1080px, 92vw);
  margin: 0 auto 4px;
}

/* =========================
   Press Feedback
========================= */

@media (hover: none) and (pointer: coarse) {
  .journey-step:active .card-box {
    transform: scale(0.96);
    filter: brightness(1.08);
  }

  .journey-step:active .dot {
    transform: scale(1.18);
    box-shadow:
      0 0 0 6px rgba(201, 255, 255, 0.22),
      0 0 20px rgba(201, 255, 255, 0.65);
  }

  .bingo-ready-button:active,
  .nav-button:active {
    transform: scale(0.97);
    background: #ffffff;
    box-shadow:
      0 3px 0 rgba(8, 28, 65, 0.28),
      0 8px 18px rgba(0, 20, 60, 0.18);
  }

  .bingo-card:active {
    transform: scale(0.97);
    filter: brightness(1.08);
  }
}

.journey-step.is-pressed .card-box {
  transform: scale(0.96);
  filter: brightness(1.08);
}

.journey-step.is-pressed .dot {
  transform: scale(1.18);
  box-shadow:
    0 0 0 6px rgba(201, 255, 255, 0.22),
    0 0 20px rgba(201, 255, 255, 0.65);
}

/* =========================
   RWD
========================= */

@media (max-width: 980px) {
  .journey-section {
    padding: 42px 18px;
    overflow-x: auto;
    overflow-y: visible;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scroll-padding-inline: 24px;
  }

  .journey-track {
    width: 980px;
    min-width: 980px;
    column-gap: 38px;
  }

  .track-line {
    top: 192px;
  }

  .nav-button {
    width: min(360px, 42vw);
  }

  .nav-button-home .icon-slot {
    left: 28px;
  }
}

@media (max-width: 760px) {
  .journey-section {
    padding: 32px 16px;
  }

  .journey-track {
    width: 860px;
    min-width: 860px;
    column-gap: 28px;
  }

  .card-box {
    width: 128px;
    height: 76px;
  }

  .track-line {
    top: 190px;
  }

  .bingo-intro {
    min-height: 560px;
    padding: 72px 16px;
  }

  .bingo-intro-content {
    text-align: center;
    font-size: clamp(17px, 4.2vw, 24px);
    line-height: 1.9;
  }

  .bingo-grid {
    width: min(430px, 86vw);
    gap: 14px;
  }

  .nav-button {
    width: min(430px, 88vw);
  }

  .nav-button-home .icon-slot {
    left: 28px;
  }
}

@media (max-width: 520px) {
  .journey-track {
    width: 760px;
    min-width: 760px;
  }

  .card-box {
    width: 112px;
    height: 68px;
  }

  .track-line {
    top: 183px;
  }

  .bingo-intro {
    min-height: 520px;
    padding: 64px 16px;
  }

  .bingo-ready-button {
    min-height: 56px;
    font-size: 18px;
  }

  .bingo-board-section {
    padding: 44px 16px 58px;
  }

  .bingo-title-card {
    margin-bottom: 34px;
  }

  .bingo-grid {
    gap: 10px;
  }

  .nav-button {
    width: calc(100vw - 48px);
    max-width: 430px;
  }

  .bingo-board-actions {
    gap: 24px;
  }

  .question-modal-backdrop {
    padding: 16px;
  }

  .submit-confirm-modal {
  max-height: calc(100dvh - 32px);
  padding: 38px 22px;
  gap: 26px;
  }

  .submit-confirm-button {
    width: 100%;
    min-height: 64px;
    font-size: 20px;
  }

  .question-content-card {
    padding: 24px 18px;
  }

  .question-option {
    padding: 16px 58px 16px 18px;
  }

  .footer {
    padding: 38px 18px;
  }
}
</style>