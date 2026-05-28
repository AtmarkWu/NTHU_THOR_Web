<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentStageId = 'stage1'
const currentStagePath = '/stage1'
const previousStagePath = null
const nextStagePath = '/stage2'

const stageAriaLabel = '節點一 輻射介紹'
const stageKicker = '知識起點'
const stageTitle = '- 輻射 -'

const componentRewardTitle = '獲得了組件【輻射警告標示】'

/**
 * YouTube 影片設定
 * 例如影片網址是：https://www.youtube.com/watch?v=AbCdEf12345
 * 那 youtubeVideoId 就填 AbCdEf12345
 */
const youtubeVideoId = '7Nn7NZI_LN4'
const youtubePlayerElementId = 'stage1-youtube-player'

/**
 * 看完影片後「獲得組件」彈窗背景圖。
 * 請放在 public/images/stage1/stage1-component-reward.png
 */
const componentRewardBgUrl = '/images/stage1/stage1-component-reward.png'

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
    isCurrent: true,
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
    isCurrent: false,
    isBingo: true,
  },
])

const knowledgePoints = [
  {
    id: 'point1',
    buttonText: '知識 1',
    title: '什麼是自然背景輻射？',
    body:
      '輻射並不只存在於反應爐。宇宙射線、土壤、岩石與空氣中，都可能存在微量的自然背景輻射。這些日常環境中的輻射通常非常微量，真正需要理解的是來源、類型與劑量。',
  },
  {
    id: 'point2',
    buttonText: '知識 2',
    title: '游離輻射與非游離輻射有什麼不同？',
    body:
      '我們生活中常見的手機、微波爐、電視多屬於非游離輻射，與核反應相關的游離輻射不同。不同種類的輻射能量不同，對人體的影響也不同，因此不能把所有「輻射」都視為同一種危險。',
  },
  {
    id: 'point3',
    buttonText: '知識 3',
    title: '輻射防護的三個原則',
    body:
      '輻射防護常用「時間、距離、屏蔽」來理解。停留時間越短、與來源距離越遠、屏蔽越完整，接受到的影響通常越低。警告標誌並不代表立即危險，而是代表此地需要被管理與監測。',
  },
]

const activePoint = computed(() => {
  return knowledgePoints.find((point) => point.id === activePointId.value)
})

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
    activePointId.value = point.id
    localStorage.setItem(pointKeyMap[point.id], 'true')
    loadProgress()
  })
}

function closeKnowledgeModal() {
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

onMounted(async () => {
  loadProgress()
  window.addEventListener('focus', loadProgress)
  window.addEventListener('storage', loadProgress)

  focusCurrentJourneyStep('auto')

  window.setTimeout(() => {
    focusCurrentJourneyStep('auto')
  }, 250)

  await loadYouTubeApi()
  createYouTubePlayer()
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
          xxxxxxxxxxxxxxxxxxxxxxxx介紹文字xxxxxxxxxxxxxxxxxxxxxxxx
        </p>
        <p>
          xxxxxxxxxxxxxxxxxxxxxxxx介紹文字xxxxxxxxxxxxxxxxxxxxxxxx
        </p>
        <p>
          xxxxxxxxxxxxxxxxxxxxxxxx介紹文字xxxxxxxxxxxxxxxxxxxxxxxx
        </p>
        <p>
          xxxxxxxxxxxxxxxxxxxxxxxx介紹文字xxxxxxxxxxxxxxxxxxxxxxxx
        </p>
      </div>

      <div class="video-card youtube-player-shell">
        <div :id="youtubePlayerElementId"></div>
      </div>
    </section>

    <!-- 知識重點補給站 -->
    <section class="knowledge-section" aria-label="知識重點補給站">
      <div class="knowledge-overlay">
        <h2>知識重點補給站</h2>

        <p class="knowledge-description">
          以下是影片中的 3 個知識重點，嘗試將他們的相關知識學習起來，讓模型升級吧！
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
    url("/images/stage1/stage1-knowledge-bg.png");
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
  width: min(320px, 29vw);
  padding: 0 68px;
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
  width: min(1040px, 82vw);
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  min-height: min(760px, 78vh);
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

  .nav-button {
    width: min(430px, 88vw);
  }

  .nav-button-prev .icon-slot,
  .nav-button-home .icon-slot {
    left: 28px;
  }

  .nav-button-next .icon-slot {
    right: 28px;
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

  .component-reward-modal,
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

  .nav-button {
    width: calc(100vw - 48px);
    max-width: 430px;
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
}
</style>