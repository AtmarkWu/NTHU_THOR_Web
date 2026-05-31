<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentStageId = 'stage2'
const currentStagePath = '/stage2'
const previousStagePath = '/stage1'
const nextStagePath = '/stage3'

const stageAriaLabel = '節點二 水池式反應爐介紹'
const stageKicker = '化知識為力量'
const stageTitle = '- 水池式反應爐 -'

const componentRewardTitle = '獲得了組件【反應爐爐心】'

/**
 * YouTube 影片設定
 * 例如影片網址是：https://www.youtube.com/watch?v=AbCdEf12345
 * 那 youtubeVideoId 就填 AbCdEf12345
 */
const youtubeVideoId = 'zVFPwHnx_iw'
const youtubePlayerElementId = 'stage2-youtube-player'

/**
 * 看完影片後「獲得組件」彈窗背景圖。
 * 請放在 public/images/stage1/stage1-component-reward.png
 */
const componentRewardBgUrl = '/images/stage2/stage2-component-reward.png'
const stageMainImageUrl = '/images/stage2/stage2-main-image.png'
const isStageMainImageExpanded = ref(false)

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

const pointKeyMap = {
  point1: `thorWeb_${currentStageId}_point1_viewed`,
  point2: `thorWeb_${currentStageId}_point2_viewed`,
  point3: `thorWeb_${currentStageId}_point3_viewed`,
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

const viewedPoints = ref({
  point1: false,
  point2: false,
  point3: false,
})

const activePointId = ref(null)
const activePointVideoStarted = ref(false)
const showComponentRewardModal = ref(false)
const showBingoHint = ref(false)
const brokenJourneyImages = ref({})
const youtubePlayer = ref(null)
const pressedItem = ref(null)
const journeyAxisRef = ref(null)
const stageMainRef = ref(null)

const bubbleItems = ref(createBubbleItems(28))

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

function toggleStageMainImage() {
  const willExpand = !isStageMainImageExpanded.value
  isStageMainImageExpanded.value = willExpand

  /**
   * 因為主介紹區不再是影片，所以不會有 YouTube ended 事件。
   * 這裡改成：第一次點圖片放大時，視為完成節點介紹，觸發獲得組件。
   * 如果你不想點圖片就獲得組件，把下面這段 if 刪掉即可。
   */
  if (willExpand) {
    handleStageVideoEnded()
  }
}

function focusCurrentJourneyStep(behavior = 'auto') {
  nextTick(() => {
    const axis = journeyAxisRef.value

    if (!axis) {
      return
    }

    const shouldAutoFocus = window.matchMedia('(max-width: 980px)').matches

    if (!shouldAutoFocus) {
      return
    }

    const currentStep = axis.querySelector(`[data-stage-id="${currentStageId}"]`)

    if (!currentStep) {
      return
    }

    const axisRect = axis.getBoundingClientRect()
    const stepRect = currentStep.getBoundingClientRect()

    const targetLeft =
      axis.scrollLeft +
      (stepRect.left - axisRect.left) -
      axis.clientWidth / 2 +
      stepRect.width / 2

    axis.scrollTo({
      left: Math.max(0, targetLeft),
      behavior,
    })
  })
}

let bingoHintTimer = null
let pressFeedbackTimer = null

const isTrue = (value) => value === 'true' || value === '1'

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

  viewedPoints.value = {
    point1: isTrue(localStorage.getItem(pointKeyMap.point1)),
    point2: isTrue(localStorage.getItem(pointKeyMap.point2)),
    point3: isTrue(localStorage.getItem(pointKeyMap.point3)),
  }
}

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
    isCurrent: true,
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
    isCurrent: false,
    isBingo: true,
  },
])

const knowledgePoints = [
  {
    id: 'point1',
    buttonText: '核分裂的由來',
    title: '中子會撞擊燃料進行核分裂',
    body:
      '核分裂的原理，是以慢中子精準撞擊燃料棒中的鈾-235原子核。當鈾原子核分裂時，會釋放巨大能量，並噴出 2~3 個新中子；這些中子繼續撞擊其他燃料，形成持續的核分裂連鎖反應。核分裂的原理，是以慢中子精準撞擊燃料棒中的鈾-235原子核。當鈾原子核分裂時，會釋放巨大能量，並噴出 2~3 個新中子；這些中子繼續撞擊其他燃料，形成持續的核分裂連鎖反應。\n\n而水池式反應爐運作時會產生「契倫可夫光」， 因為光在水中的傳播速度會變慢。此時，核分裂產生的高能帶電粒子，在水中的前進速度超越了水中的光速！這道藍光正是反應爐正在穩定運轉的證據。',
    media: {
      type: 'youtube',
      youtubeId: '2vD9HnyeMmw',
    },
  },
  {
    id: 'point2',
    buttonText: '控制棒的用途',
    title: '控制棒是反應爐的油門與煞車',
    body:
      '控制棒是由能強力吸收中子的材質（如硼、鎘）製成，如同「中子海綿」。若控制棒從核心抽離，中子數量便會變多，核反應隨之加速；但當控制棒插入核心，將會吸走中子，沒有中子撞擊燃料，連鎖反應就會減速或停止。當反應爐遇到任何異常狀況，控制棒會因重力在極短時間內自動全數掉落進入核心，瞬間強制熄火，確保絕對安全。',
    media: {
      type: 'youtube',
      youtubeId: 'E4W7tgMYG74',
    },
  },
  {
    id: 'point3',
    buttonText: '監測板的功能',
    title: '作為反應爐的「大腦」',
    body:
      '24小時嚴密把關，任何數據異常，系統會立刻報警並自動保護停機。一共有3大核心數據，用來分析監控，他們分別是：\n1.中子通量：看功率，確保核分裂穩定不超載。\n2.水溫與壓力：看水池，確保冷卻與輻射屏蔽正常。\n3.輻射劑量：看安全，確保廠房與校園絕對安全。',
    media: {
      type: 'image',
      src: '/images/stage2/stage2-point3-image.png',
      alt: '輻射防護補充圖片',
    },
  },
]


const supplementSection = {
  title: '前往下一站之前，補充點小知識吧',
  paragraphs: [
    '第一張圖片展示了我們日常生活中會接觸到輻射的途徑、劑量，第二張圖則是展示了，人體平常暴露在多少的背景輻射之下，快來看看有沒有哪一個途徑跟輻射量，是出乎你意料之外的呢？',
  ],
  images: [
    {
      src: '/images/stage2/stage2-supplement-1.png',
      alt: '水池式反應爐補充知識圖片 1',
    },
    {
      src: '/images/stage2/stage2-supplement-2.png',
      alt: '水池式反應爐補充知識圖片 2',
    },
  ],
}

const activePoint = computed(() => {
  return knowledgePoints.find((point) => point.id === activePointId.value)
})

const activePointYoutubeThumbUrl = computed(() => {
  if (!activePoint.value || activePoint.value.media?.type !== 'youtube') {
    return ''
  }

  return `https://img.youtube.com/vi/${activePoint.value.media.youtubeId}/hqdefault.jpg`
})

const activePointYoutubeEmbedUrl = computed(() => {
  if (!activePoint.value || activePoint.value.media?.type !== 'youtube') {
    return ''
  }

  return `https://www.youtube.com/embed/${activePoint.value.media.youtubeId}?rel=0&modestbranding=1&playsinline=1`
})

function playActivePointVideo() {
  activePointVideoStarted.value = true
}

const pageStyle = computed(() => ({
  '--component-reward-bg': `url("${componentRewardBgUrl}")`,
}))

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

function handleStageVideoEnded() {
  /**
   * 如果之前已經拿過組件，就不要重複跳彈窗。
   * 測試時如果想重新看到彈窗，可以清掉 localStorage。
   */
  if (isTrue(localStorage.getItem(videoKeys[currentStageId]))) {
    return
  }

  showComponentRewardModal.value = true
}

function closeComponentRewardModal() {
  showComponentRewardModal.value = false

  /**
   * 這裡才正式記錄影片已觀看。
   * 因此旅程軸圖片會在關閉彈窗後才顯示。
   */
  localStorage.setItem(videoKeys[currentStageId], 'true')

  /**
   * 清除 Stage1 圖片錯誤暫存，讓圖片重新嘗試顯示。
   */
  brokenJourneyImages.value = {
    ...brokenJourneyImages.value,
    [currentStageId]: false,
  }

  loadProgress()
}

function openPoint(point) {
  runPressFeedback(`knowledge-${point.id}`, () => {
    activePointVideoStarted.value = false
    activePointId.value = point.id
    localStorage.setItem(pointKeyMap[point.id], 'true')
    loadProgress()
  })
}

function closeKnowledgeModal() {
  activePointVideoStarted.value = false
  activePointId.value = null
}

function closeKnowledgeModalWithFeedback() {
  runPressFeedback('modal-close', () => {
    closeKnowledgeModal()
  }, 120)
}

function closeComponentRewardModalWithFeedback() {
  runPressFeedback('component-reward-modal', () => {
    closeComponentRewardModal()
  }, 120)
}

function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve()
      return
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    )

    const previousCallback = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') {
        previousCallback()
      }

      resolve()
    }

    if (!existingScript) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.body.appendChild(script)
    }
  })
}

function createYouTubePlayer() {
  if (!window.YT || !window.YT.Player) {
    return
  }

  youtubePlayer.value = new window.YT.Player(youtubePlayerElementId, {
    videoId: youtubeVideoId,
    playerVars: {
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
    },
    events: {
      onStateChange: handleYouTubeStateChange,
    },
  })
}

function handleYouTubeStateChange(event) {
  if (event.data === window.YT.PlayerState.ENDED) {
    handleStageVideoEnded()
  }
}

function scrollToStageTitle() {
  nextTick(() => {
    stageMainRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

function goToStep(step) {
  if (step.isBingo && !bingoUnlocked.value) {
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
      scrollToStageTitle()
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

function goPrevStage() {
  if (!previousStagePath) {
    return
  }

  runPressFeedback('prev-button', () => {
    router.push({
      path: previousStagePath,
      hash: '#stage-title',
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

function goNextStage() {
  runPressFeedback('next-button', () => {
    router.push({
      path: nextStagePath,
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

onMounted(() => {
  loadProgress()
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

  if (youtubePlayer.value && typeof youtubePlayer.value.destroy === 'function') {
    youtubePlayer.value.destroy()
  }
})
</script>

<template>
  <main class="stage-page" :style="pageStyle">
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

    <!-- 節點主內容 -->
    <section
      id="stage-title"
      ref="stageMainRef"
      class="stage-main"
      :aria-label="stageAriaLabel"
    >
      <div class="stage-title-card">
        <p class="stage-kicker">{{ stageKicker }}</p>
        <h1>{{ stageTitle }}</h1>
      </div>

      <div class="intro-text">
        <p>
          核電廠發電的原理，其實和火力發電一樣是「燒水產生蒸汽，推動發電機」，只不過火電廠是燒煤，而反應爐是靠「核分裂」來發熱。它的運作只靠 3 個主角：
        </p>
        <p>
          1. 燃料棒： 裡面的「鈾-235」受到中子撞擊會分裂，釋放出巨大的熱能。
        </p>
        <p>
          2. 冷卻水： 負責把熱量帶走，變成高壓蒸汽去推動發電機運轉。
        </p>
        <p>
          3. 控制棒： 像海綿一樣負責吸走中子，插得越深，核分裂就越慢，是控制發電功率與安全停機的關鍵。
        </p>
        <p>
          反應爐就是利用「控制棒」精準調整分裂速度，讓核燃料穩定放熱，把水燒開來發電。
        </p>
      </div>
      <button
        class="stage-main-image-card"
        :class="{ 'is-expanded': isStageMainImageExpanded }"
        type="button"
        aria-label="點擊放大或縮小水池式反應爐介紹圖片"
        @click="toggleStageMainImage"
      >
        <img
          :src="stageMainImageUrl"
          alt="水池式反應爐介紹圖"
        />
      </button>

      <p class="stage-main-image-hint">
        點一下圖片可獲得組件，並讓圖片放大，再點一次即可縮小
      </p>
    </section>

    <!-- 知識重點 -->
    <section class="knowledge-section" aria-label="知識重點寶庫">
      <div class="knowledge-overlay">
        <h2>知識重點寶庫</h2>

        <p class="knowledge-description">
          以下是影片中的 3 個知識重點，嘗試將他們的相關知識學習起來，加深對「水池式反應爐」的認識吧！
        </p>

        <div class="knowledge-buttons">
          <button
            v-for="point in knowledgePoints"
            :key="point.id"
            class="knowledge-button"
            :class="{
              'is-viewed': viewedPoints[point.id],
              'is-pressed': pressedItem === `knowledge-${point.id}`,
            }"
            type="button"
            @click="openPoint(point)"
          >
            <span class="knowledge-button-text">
              {{ point.buttonText }}
            </span>

            <span
              class="knowledge-check-icon"
              :class="{ 'is-visible': viewedPoints[point.id] }"
              aria-hidden="true"
            >
              ✓
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- 前往下一站前的補充小知識 -->
    <section class="supplement-section" aria-label="前往下一站之前的補充小知識">
      <h2>{{ supplementSection.title }}</h2>

      <div class="supplement-card">
        <div class="supplement-text">
          <p
            v-for="paragraph in supplementSection.paragraphs"
            :key="paragraph"
          >
            {{ paragraph }}
          </p>
        </div>

        <div class="supplement-image-list">
          <figure
            v-for="image in supplementSection.images"
            :key="image.src"
            class="supplement-image-wrap"
          >
            <img
              :src="image.src"
              :alt="image.alt"
            />
          </figure>
        </div>
      </div>
    </section>

    <!-- 下方按鈕 -->
    <section
      class="bottom-actions"
      :class="{ 'bottom-actions-three': previousStagePath && nextStagePath }"
      aria-label="頁面跳轉按鈕"
    >
      <button
        v-if="previousStagePath"
        class="nav-button nav-button-prev"
        :class="{ 'is-pressed': pressedItem === 'prev-button' }"
        type="button"
        @click="goPrevStage"
      >
        <span class="icon-slot" aria-hidden="true">◀</span>
        <span class="nav-button-text">退回上一站</span>
      </button>

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
        v-if="nextStagePath"
        class="nav-button nav-button-next"
        :class="{ 'is-pressed': pressedItem === 'next-button' }"
        type="button"
        @click="goNextStage"
      >
        <span class="nav-button-text">前往下一站</span>
        <span class="icon-slot" aria-hidden="true">▶</span>
      </button>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>指導單位：國立清華大學 王俊程、謝小芩、吳順吉、盧崇真 教授</p>
      <p>資料來源：國立清華大學 清華水池式反應爐</p>
      <p>網頁UI設計與程式撰寫：吳佳穎</p>
      <p>影片製作與資料蒐集撰寫：林沛妤、陳郁阡、張昕愛</p>
    </footer>
    <!-- 看完影片後：獲得組件彈窗 -->
    <Transition name="modal-pop" appear>
      <section
        v-if="showComponentRewardModal"
        class="modal-backdrop component-reward-backdrop"
        aria-label="獲得組件彈窗"
        @click="closeComponentRewardModalWithFeedback"
      >
        <div
          class="component-reward-modal"
          :class="{ 'is-pressed': pressedItem === 'component-reward-modal' }"
          role="dialog"
          aria-modal="true"
        >
          <div class="component-reward-text">
            <h2>{{ componentRewardTitle }}</h2>
            <p>點擊畫面關閉視窗</p>
          </div>
        </div>
      </section>
    </Transition>

    <!-- 知識重點彈窗 -->
    <Transition name="modal-pop" appear>
      <section
        v-if="activePoint"
        class="modal-backdrop knowledge-modal-backdrop"
        aria-label="知識重點彈窗"
        @click.self="closeKnowledgeModal"
      >
        <article class="knowledge-modal" role="dialog" aria-modal="true">
          <button
            class="modal-close"
            :class="{ 'is-pressed': pressedItem === 'modal-close' }"
            type="button"
            aria-label="關閉知識視窗"
            @click="closeKnowledgeModalWithFeedback"
          >
            <span class="modal-close-icon" aria-hidden="true"></span>
          </button>

          <h2>{{ activePoint.title }}</h2>

          <div class="knowledge-modal-content">
            <p>{{ activePoint.body }}</p>

            <div
              v-if="activePoint.media"
              class="knowledge-modal-media"
            >
              <template v-if="activePoint.media.type === 'youtube'">
                <button
                  v-if="!activePointVideoStarted"
                  class="knowledge-video-thumb"
                  type="button"
                  aria-label="播放知識重點影片"
                  @click="playActivePointVideo"
                >
                  <img
                    :src="activePointYoutubeThumbUrl"
                    :alt="`${activePoint.title} 影片縮圖`"
                  />

                  <span class="knowledge-video-play" aria-hidden="true">
                    ▶
                  </span>
                </button>

                <iframe
                  v-else
                  class="knowledge-video-frame"
                  :src="activePointYoutubeEmbedUrl"
                  title="知識重點影片"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </template>

              <img
                v-else-if="activePoint.media.type === 'image'"
                class="knowledge-modal-image"
                :src="activePoint.media.src"
                :alt="activePoint.media.alt || activePoint.title"
              />
            </div>
          </div>
        </article>
      </section>
    </Transition>
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

.stage-page > :not(.background-bubbles):not(.modal-backdrop) {
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
    radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.82), rgba(201, 255, 255, 0.32) 46%, rgba(255, 255, 255, 0) 72%);
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
  font-size: var(--font-journey-lock);
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
  font-size: var(--font-stage-journey-star);
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
  font-size: var(--font-stage-step-label);
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
  font-size: var(--font-bingo-hint);
  letter-spacing: 0.04em;
}

/* =========================
   Main Content
========================= */

.stage-main {
  padding: 46px 20px 70px;
  text-align: center;
  scroll-margin-top: 32px;
}

.stage-title-card {
  width: min(720px, 86vw);
  margin: 0 auto 44px;
  padding: 24px 20px 28px;
  border-radius: 16px;
  border: 6px solid #174ca4;
  background: #005d96;
  box-shadow: 0 6px 0 rgba(4, 38, 93, 0.22);
}

.stage-kicker {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: var(--font-stage-kicker);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.stage-title-card h1 {
  margin: 0;
  color: #ffffff;
  font-size: var(--font-stage-title);
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-shadow: 0 4px 0 rgba(0, 24, 80, 0.3);
}

.intro-text {
  width: min(940px, 88vw);
  margin: 0 auto 54px;
  color: #10172b;
  text-align: center;
  font-size: var(--font-stage-intro);
  line-height: 1.75;
  letter-spacing: 0.05em;
}

.intro-text p {
  margin: 0 0 8px;
}

.video-card {
  width: min(900px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  margin-inline: auto;
  border-radius: 18px;
  overflow: hidden;
  background: transparent;
  box-shadow: none;
}

.stage-main-image-card {
  width: min(900px, calc(100vw - 32px));
  max-width: calc(100vw - 32px);
  margin-inline: auto;
  padding: 0;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(6, 44, 104, 0.18);
  cursor: pointer;
  display: block;
  box-shadow:
    0 8px 0 rgba(8, 28, 65, 0.18),
    0 18px 34px rgba(0, 20, 60, 0.16);
  transition:
    width 0.28s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.stage-main-image-card:hover,
.stage-main-image-card:focus-visible {
  transform: translateY(-3px);
  box-shadow:
    0 10px 0 rgba(8, 28, 65, 0.18),
    0 24px 42px rgba(0, 20, 60, 0.22);
}

.stage-main-image-card img {
  width: 100%;
  max-height: min(680px, 68vh);
  display: block;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.14);
}

.stage-main-image-card.is-expanded {
  width: min(1180px, calc(100vw - 32px));
}

.stage-main-image-card.is-expanded img {
  max-height: calc(100dvh - 140px);
}

.stage-main-image-hint {
  margin: 18px auto 0;
  color: rgba(16, 23, 43, 0.72);
  font-size: clamp(14px, 1.2vw, 18px);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.youtube-player-shell {
  position: relative;
  aspect-ratio: 16 / 9;
}

/* 這是 YouTube API 還沒替換前的 div */
.youtube-player-shell > div {
  width: 100%;
  height: 100%;
}

/* 重點：YouTube 動態產生的 iframe 要用 :deep 才能被 scoped CSS 套到 */
.youtube-player-shell :deep(iframe) {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block;
  border: 0;
}

/* =========================
   Knowledge
========================= */

.knowledge-section {
  position: relative;
  background:
    linear-gradient(rgba(16, 52, 111, 0.4), rgba(16, 52, 111, 0.4)),
    url("/images/stage2/stage2-knowledge-bg.png");
  background-size: cover;
  background-position: center;
}

.knowledge-overlay {
  padding: 76px 20px 82px;
  text-align: center;
}

.knowledge-section h2 {
  margin: 0 0 30px;
  color: #ffffff;
  font-size: var(--font-stage-knowledge-title);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.knowledge-description {
  width: min(900px, 86vw);
  margin: 0 auto 48px;
  color: #ffffff;
  font-size: var(--font-stage-knowledge-description);
  line-height: 1.8;
  letter-spacing: 0.05em;
}

.knowledge-buttons {
  width: min(1120px, 92vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 120px;
}

.knowledge-button {
  position: relative;
  min-height: 82px;
  border: 0;
  border-radius: 8px;
  background: #e8fbff;
  color: #121826;
  font-size: var(--font-stage-knowledge-button);
  font-weight: 600;
  letter-spacing: 0.06em;
  box-shadow:
    0 6px 0 rgba(8, 28, 65, 0.28),
    0 14px 28px rgba(0, 20, 60, 0.18);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.knowledge-button-text {
  display: inline-block;
}

.knowledge-check-icon {
  position: absolute;
  right: 22px;
  top: 50%;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: #061d47;
  color: #fff27a;
  font-size: var(--font-stage-knowledge-check);
  font-weight: 900;
  transform: translateY(-50%) scale(0);
  opacity: 0;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}

.knowledge-check-icon.is-visible {
  transform: translateY(-50%) scale(1);
  opacity: 1;
}

.knowledge-button:hover,
.knowledge-button:focus-visible {
  transform: translateY(-3px);
  background: #ffffff;
  box-shadow:
    0 8px 0 rgba(8, 28, 65, 0.28),
    0 18px 32px rgba(0, 20, 60, 0.24);
}

.knowledge-button.is-viewed {
  background: #acff93;
}

/* =========================
   Supplement
========================= */

.supplement-section {
  padding: 78px 20px 36px;
  text-align: center;
}

.supplement-section h2 {
  width: min(900px, 88vw);
  margin: 0 auto 44px;
  color: #ffffff;
  font-size: clamp(28px, 4vw, 54px);
  line-height: 1.25;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-shadow:
    0 4px 0 rgba(0, 24, 80, 0.26),
    0 12px 28px rgba(0, 20, 60, 0.22);
}

.supplement-card {
  width: min(1040px, 90vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
  padding: clamp(28px, 5vw, 58px);
  border-radius: 20px;
  background: rgba(6, 44, 104, 0.34);
  box-shadow: 0 18px 44px rgba(0, 20, 60, 0.16);
}

.supplement-text {
  color: #ffffff;
  text-align: center;
  font-size: var(--font-stage-intro);
  line-height: 1.75;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.supplement-text p {
  margin: 0 0 18px;
}

.supplement-text p:last-child {
  margin-bottom: 0;
}

.supplement-image-wrap {
  margin: 0;
}

.supplement-image-wrap img {
  width: 100%;
  max-height: 520px;
  display: block;
  object-fit: contain;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.14);
}

.supplement-image-list {
  display: grid;
  gap: 24px;
}

.supplement-image-wrap {
  margin: 0;
}

.supplement-image-wrap img {
  width: 100%;
  max-height: 360px;
  display: block;
  object-fit: contain;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.14);
}

/* =========================
   Bottom Actions
========================= */

.bottom-actions {
  padding: 72px 20px;
  display: flex;
  justify-content: center;
  gap: min(14vw, 220px);
}

.nav-button {
  width: min(390px, 38vw);
  min-height: 82px;
  padding: 0 86px;
  border: 0;
  border-radius: 8px;
  background: #e8fbff;
  color: #111827;
  font-size: var(--font-stage-nav-button);
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

.bottom-actions-three {
  gap: 32px;
}

.bottom-actions-three .nav-button {
  width: min(340px, 30vw);
  padding: 0 76px;
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
  font-size: var(--font-stage-nav-icon);
  line-height: 1;
  font-weight: 900;
  color: #000000;
}

.home-icon {
  width: 1em;
  height: 1em;
  display: block;
}

.nav-button-prev .icon-slot,
.nav-button-home .icon-slot {
  left: 36px;
}

.nav-button-next .icon-slot {
  right: 36px;
}

.home-icon {
  width: 1em;
  height: 1em;
  display: block;
}

.nav-button-text {
  display: inline-block;
  text-align: center;
  white-space: nowrap;
}

/* =========================
   Modals
========================= */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: grid;
  place-items: center;
  background: rgba(0, 10, 38, 0.58);
}

/* 彈出視窗效果：用 Vue Transition 控制 */
.stage-page > .modal-backdrop {
  position: fixed;
  z-index: 999;
}

.modal-pop-enter-active,
.modal-pop-leave-active {
  transition: opacity 0.22s ease;
}

.modal-pop-enter-from,
.modal-pop-leave-to {
  opacity: 0;
}

.modal-pop-enter-to,
.modal-pop-leave-from {
  opacity: 1;
}

.modal-pop-enter-active .component-reward-modal,
.modal-pop-enter-active .knowledge-modal,
.modal-pop-leave-active .component-reward-modal,
.modal-pop-leave-active .knowledge-modal {
  transform-origin: center;
  transition:
    opacity 0.34s ease,
    transform 0.34s cubic-bezier(0.2, 0.9, 0.22, 1.18),
    filter 0.34s ease;
}

.modal-pop-enter-from .component-reward-modal,
.modal-pop-enter-from .knowledge-modal {
  opacity: 0;
  transform: translateY(26px) scale(0.82);
  filter: blur(4px);
}

.modal-pop-enter-to .component-reward-modal,
.modal-pop-enter-to .knowledge-modal {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.modal-pop-leave-to .component-reward-modal,
.modal-pop-leave-to .knowledge-modal {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
  filter: blur(2px);
}

/* 看完影片後：獲得組件 */
.component-reward-backdrop {
  cursor: pointer;
}

.component-reward-modal {
  width: min(1040px, 86vw);
  max-width: calc(100vw - 32px);
  height: min(860px, 84dvh);
  max-height: calc(100dvh - 32px);
  border-radius: 18px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background:
    linear-gradient(rgba(5, 11, 45, 0.42), rgba(5, 11, 45, 0.42)),
    var(--component-reward-bg);
  background-size: cover;
  background-position: center;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
}

.component-reward-text {
  width: 100%;
  padding: 36px 24px;
  text-align: center;
  background: rgba(8, 15, 42, 0.48);
  color: #ffffff;
  letter-spacing: 0.08em;
}

.component-reward-text h2 {
  margin: 0 0 22px;
  font-size: var(--font-component-reward-title);
  font-weight: 900;
}

.component-reward-text p {
  margin: 0;
  font-size: var(--font-component-reward-body);
  font-weight: 500;
}

/* 知識重點彈窗 */
.knowledge-modal-backdrop {
  padding: 32px 20px;
}

.knowledge-modal {
  position: relative;
  width: min(1040px, 82vw);
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  min-height: min(760px, 78vh);
  padding: 86px 54px 62px;
  border-radius: 18px;
  background: #06285f;
  color: #ffffff;
  overflow-y: auto;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
}

.modal-close {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #061d47;
  font-size: 0;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease;
}

.modal-close-icon {
  position: relative;
  display: block;
  width: 28px;
  height: 28px;
}

.modal-close-icon::before,
.modal-close-icon::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30px;
  height: 5px;
  border-radius: 999px;
  background: currentColor;
  transform-origin: center;
}

.modal-close-icon::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.modal-close-icon::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.knowledge-modal h2 {
  margin: 0 0 62px;
  text-align: center;
  font-size: var(--font-knowledge-modal-title);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.knowledge-modal-content {
  width: min(860px, 100%);
  max-width: 100%;
  min-height: 390px;
  margin: 0 auto;
  padding: 56px 62px;
  border-radius: 10px;
  background: #031b42;
  color: #ffffff;
  text-align: left;
  display: grid;
  gap: 36px;
  white-space: pre-line;
}

.knowledge-modal-media {
  width: 100%;
}

.knowledge-video-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: 0;
  border-radius: 12px;
  overflow: hidden;
  background: #000000;
  cursor: pointer;
  display: block;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.knowledge-video-thumb img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  filter: brightness(0.78);
  transition:
    transform 0.18s ease,
    filter 0.18s ease;
}

.knowledge-video-thumb:hover img,
.knowledge-video-thumb:focus-visible img {
  transform: scale(1.04);
  filter: brightness(0.95);
}

.knowledge-video-play {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 82px;
  height: 58px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.88);
  color: #062c68;
  font-size: 30px;
  font-weight: 900;
  transform: translate(-50%, -50%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.knowledge-video-frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  border: 0;
  border-radius: 12px;
  background: #000000;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.28);
}

.knowledge-modal-image {
  width: 100%;
  max-height: 520px;
  display: block;
  object-fit: contain;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
}

.knowledge-modal-content p {
  margin: 0;
  font-size: var(--font-knowledge-modal-body);
  line-height: 2;
  letter-spacing: 0.06em;
}

/* =========================
   Footer
========================= */

.footer {
  background: #062c68;
  padding: 54px 20px 48px;
  color: #dbe8ff;
  font-size: var(--font-footer);
  line-height: 1.55;
  letter-spacing: 0.04em;
}

.footer p {
  width: min(1080px, 92vw);
  margin: 0 auto 4px;
}

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

  .knowledge-button:active {
    transform: scale(0.97);
    background: #ffffff;
    box-shadow:
      0 3px 0 rgba(8, 28, 65, 0.28),
      0 8px 18px rgba(0, 20, 60, 0.18);
  }

  .knowledge-button.is-viewed:active {
    background: #fff27a;
  }

  .nav-button:active {
    transform: scale(0.97);
    background: #ffffff;
    box-shadow:
      0 3px 0 rgba(8, 28, 65, 0.28),
      0 8px 18px rgba(0, 20, 60, 0.18);
  }

  .modal-close:active {
    transform: scale(0.9);
    background: #fff27a;
  }

  .component-reward-modal:active {
    transform: scale(0.985);
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

.knowledge-button.is-pressed {
  transform: scale(0.97);
  background: #ffffff;
  box-shadow:
    0 3px 0 rgba(8, 28, 65, 0.28),
    0 8px 18px rgba(0, 20, 60, 0.18);
}

.knowledge-button.is-viewed.is-pressed {
  background: #fffdd0;
}

.nav-button.is-pressed {
  transform: scale(0.97);
  background: #ffffff;
  box-shadow:
    0 3px 0 rgba(8, 28, 65, 0.28),
    0 8px 18px rgba(0, 20, 60, 0.18);
}

.modal-close.is-pressed {
  transform: scale(0.9);
  background: #fff27a;
}

.component-reward-modal.is-pressed {
  transform: scale(0.985);
  filter: brightness(1.08);
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

  .bottom-actions {
    gap: 40px;
  }

  .nav-button {
    width: min(360px, 42vw);
  }

  .nav-button-prev .icon-slot,
  .nav-button-home .icon-slot {
    left: 28px;
  }

  .nav-button-next .icon-slot {
    right: 28px;
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

  .stage-main {
    padding: 40px 16px 56px;
  }

  .stage-title-card {
    width: min(620px, 90vw);
  }

  .intro-text {
    text-align: left;
  }

  .knowledge-buttons {
    grid-template-columns: 1fr;
    gap: 22px;
    width: min(420px, 88vw);
  }

  .bottom-actions {
    flex-direction: column;
    align-items: center;
    gap: 30px;
  }

  .nav-button,
  .bottom-actions-three .nav-button {
    width: min(430px, 88vw);
    padding: 0 82px;
  }

  .nav-button-prev .icon-slot,
  .nav-button-home .icon-slot {
    left: 28px;
  }

  .nav-button-next .icon-slot {
    right: 28px;
  }

  .supplement-section {
    padding: 58px 16px 24px;
  }

  .supplement-card {
    grid-template-columns: 1fr;
    width: min(520px, 90vw);
  }

  .supplement-text {
    text-align: left;
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

  .stage-title-card {
    border-width: 4px;
    padding: 20px 16px 22px;
  }

  .video-card {
    width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
    border-radius: 12px;
  }

  .knowledge-overlay {
    padding: 56px 16px 64px;
  }

  .knowledge-detail {
    padding: 24px 22px;
  }

  .bottom-actions {
    padding: 56px 16px;
  }

  .footer {
    padding: 38px 18px;
  }

  .component-reward-modal {
    width: calc(100vw - 32px);
    max-width: 430px;
    height: clamp(450px, 76dvh, 540px);
    min-height: 0;
    max-height: calc(100dvh - 48px);
    border-radius: 16px;
  }

  .knowledge-modal {
    width: calc(100vw - 32px);
    max-width: calc(100vw - 32px);
    min-height: auto;
    max-height: calc(100dvh - 32px);
  }

  .knowledge-modal {
    padding: 76px 22px 38px;
  }

  .modal-close {
    top: 18px;
    right: 18px;
    width: 44px;
    height: 44px;
  }

  .knowledge-modal h2 {
    margin-bottom: 36px;
  }

  .knowledge-modal-content {
    min-height: 280px;
    padding: 28px 20px;
  }

  .nav-button,
  .bottom-actions-three .nav-button {
    width: calc(100vw - 48px);
    max-width: 430px;
    padding: 0 76px;
  }

  .nav-button-prev .icon-slot,
  .nav-button-home .icon-slot {
    left: 28px;
  }

  .nav-button-next .icon-slot {
    right: 28px;
  }

  .component-reward-text {
    padding: 28px 18px;
  }

  .component-reward-text h2 {
    line-height: 1.45;
  }

  .knowledge-modal-content {
    gap: 24px;
  }

  .knowledge-video-play {
    width: 64px;
    height: 46px;
    font-size: 24px;
  }

  .stage-main-image-card,
  .stage-main-image-card.is-expanded {
    width: calc(100vw - 32px);
    border-radius: 12px;
  }

  .stage-main-image-card img,
  .stage-main-image-card.is-expanded img {
    max-height: none;
  }
}
</style>