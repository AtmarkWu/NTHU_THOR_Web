<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const logoUrl = '/images/home/nthu-thorweb-logo.png'

/**
 * 每個節點「看過影片」後，Home 旅程軸的灰色卡片會變成對應圖片。
 * 這些圖片請之後放到 public/images/home/。
 */
const stageCardImages = {
  stage1: '/images/home/journey-stage1.png',
  stage2: '/images/home/journey-stage2.png',
  stage3: '/images/home/journey-stage3.png',
  stage4: '/images/home/journey-stage4.png',
  bingo: '/images/home/journey-bingo.png',
}

/**
 * 四個節點的觀看進度。
 * 之後每個 Stage 頁面看完影片時，請寫入 localStorage：
 * localStorage.setItem('thorWeb_stage1_videoWatched', 'true')
 */
const videoProgress = ref({
  stage1: false,
  stage2: false,
  stage3: false,
  stage4: false,
})

/**
 * 四個節點各 3 個知識重點，共 12 個。
 * 如果使用者看過該重點，就在對應 Stage 頁面寫入：
 * localStorage.setItem('thorWeb_stage1_point1_viewed', 'true')
 */
const detailProgress = ref({
  stage1: 0,
  stage2: 0,
  stage3: 0,
  stage4: 0,
})

const showBingoHint = ref(false)
const pressedItem = ref(null)

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

let bingoHintTimer = null
let pressFeedbackTimer = null

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
    image: stageCardImages.stage1,
    imageUnlocked: videoProgress.value.stage1,
    detailCount: detailProgress.value.stage1,
    isBingo: false,
  },
  {
    id: 'stage2',
    title: '化知識為力量',
    subtitle: '- 水池式反應爐 -',
    path: '/stage2',
    image: stageCardImages.stage2,
    imageUnlocked: videoProgress.value.stage2,
    detailCount: detailProgress.value.stage2,
    isBingo: false,
  },
  {
    id: 'stage3',
    title: '力量的痕跡',
    subtitle: '- 反應爐水池 -',
    path: '/stage3',
    image: stageCardImages.stage3,
    imageUnlocked: videoProgress.value.stage3,
    detailCount: detailProgress.value.stage3,
    isBingo: false,
  },
  {
    id: 'stage4',
    title: '自力量誕生的希望',
    subtitle: '- BNCT治療室 -',
    path: '/stage4',
    image: stageCardImages.stage4,
    imageUnlocked: videoProgress.value.stage4,
    detailCount: detailProgress.value.stage4,
    isBingo: false,
  },
  {
    id: 'bingo',
    title: '最終考驗',
    subtitle: '- Bingo問答 -',
    path: '/bingo',
    image: stageCardImages.bingo,
    imageUnlocked: bingoUnlocked.value,
    detailCount: 0,
    isBingo: true,
  },
])

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

function startJourney() {
  runPressFeedback('start-button', () => {
    router.push({
      path: '/stage1',
      hash: '#stage-title',
    })
  })
}

onMounted(() => {
  loadProgress()

  /**
   * 從其他頁面回到首頁時，重新讀取 localStorage。
   */
  window.addEventListener('focus', loadProgress)
  window.addEventListener('storage', loadProgress)
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
  <main class="home-page">
    <div class="background-bubbles" aria-hidden="true">
      <span
        v-for="bubble in bubbleItems"
        :key="bubble.id"
        class="bubble"
        :style="bubble.style"
      ></span>
    </div>
    <!-- Logo + 標題 -->
    <section class="top-section">
      <img class="logo" :src="logoUrl" alt="NTHU THOR Web Logo" />

      <h1 class="main-title">
        解構原子：不再神秘的爐心漫遊
      </h1>
    </section>

    <!-- 圖片底 + 介紹文字 -->
    <section class="intro-hero" aria-label="網站介紹">
      <div class="intro-overlay">
        <div class="intro-text">
          <p>
            反應爐一定危險嗎？輻射只能讓人害怕嗎？
          </p>

          <p>
            那些看不懂的水池、管線、螢幕數字與醫療設備，
            背後其實藏著一套可以被理解的科學流程喔。
          </p>

          <p>
            本網站將帶你走過四個節點：輻射、反應爐、反應爐水池、BNCT治療室。
            你可以觀看每個節點的介紹影片，並瀏覽知識重點，
            深入了解大眾最容易好奇或擔心的問題。
          </p>

          <p>
            在節點探索過程中，你將解鎖並獲得反應爐組件。
            完成四個節點的影片觀看，並通過最終的 Bingo 問答後，
            便能組裝出一座小反應爐模型！
          </p>

          <p>
            若解鎖更多知識重點補給站的內容，模型也會越大型越精緻；
            當 12 個重點全部解鎖，完整的清華大學水池式反應爐也將被組裝完成。
          </p>

          <p class="intro-final">
            每一次點擊，都是一次理解。每一個組件，都是一個疑問被解開的證明。
          </p>
        </div>
      </div>
    </section>

    <!-- 開始按鈕 -->
    <section class="start-section" aria-label="開始漫遊">
      <button
        class="start-button"
        :class="{ 'is-pressed': pressedItem === 'start-button' }"
        type="button"
        @click="startJourney"
      >
        點擊並開始你的爐心漫遊，從恐懼走向理解吧！
      </button>

      <p class="or-text">或者...</p>
      <p class="jump-text">點擊下方旅程軸的任一點，進行跳轉！</p>
    </section>

    <!-- 旅程軸 -->
    <section
      id="home-journey"
      class="journey-section"
      aria-label="爐心漫遊旅程軸"
    >
      <h2 class="journey-title">爐心漫遊旅程軸</h2>

      <div class="journey-track">
        <div class="track-line" aria-hidden="true"></div>

        <button
          v-for="step in journeySteps"
          :key="step.id"
          class="journey-step"
          :class="{
            'is-unlocked': step.imageUnlocked,
            'is-locked': step.isBingo && !bingoUnlocked,
            'is-pressed': pressedItem === `journey-${step.id}`,
          }"
          type="button"
          :aria-disabled="step.isBingo && !bingoUnlocked"
          @click="goToStep(step)"
        >
          <div class="card-box">
            <img
              v-if="step.imageUnlocked"
              class="card-image"
              :src="step.image"
              :alt="step.title + step.subtitle"
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

          <div class="dot" aria-hidden="true"></div>

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
.home-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  color: #ffffff;
  background:
    linear-gradient(
      180deg,
      #c9f3f6 0%,
      #9bd2ec 18%,
      #5fa5d7 38%,
      #1f61b2 62%,
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

.home-page,
.home-page * {
  box-sizing: border-box;
}

.background-bubbles {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.home-page > :not(.background-bubbles) {
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
   Top Logo + Title
========================= */

.top-section {
  background: transparent;
  padding: 24px 20px 18px;
  text-align: center;
}

.logo {
  width: min(260px, 62vw);
  height: auto;
  display: block;
  margin: 0 auto 28px;
}

.main-title {
  margin: 0;
  color: #4a1974;
  font-size: var(--font-home-main-title);
  font-weight: 900;
  letter-spacing: 0.08em;
  text-shadow:
    0 4px 0 rgba(38, 53, 97, 0.18),
    0 2px 8px rgba(55, 32, 94, 0.28);
}

/* =========================
   Intro Hero
========================= */

.intro-hero {
  min-height: 390px;
  background-image: url("/images/home/home-hero-bg.png");
  background-size: cover;
  background-position: center;
}

.intro-overlay {
  min-height: 390px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 42px 20px;
}

.intro-text {
  width: min(1080px, 92vw);
  text-align: center;
  color: #f4f8ff;
  font-size: var(--font-home-intro);
  line-height: 2.05;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.intro-text p {
  margin: 0 0 12px;
}

.intro-final {
  margin-top: 18px !important;
  font-weight: 800;
}

/* =========================
   Start Button
========================= */

.start-section {
  background: transparent;
  padding: 40px 20px 32px;
  text-align: center;
}

.start-button {
  width: min(630px, 86vw);
  min-height: 76px;
  padding: 18px 28px;
  border: 0;
  border-radius: 10px;
  background: #c9ffff;
  color: #0b0b14;
  font-size: var(--font-home-start-button);
  font-weight: 900;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow:
    0 6px 0 rgba(19, 52, 91, 0.22),
    0 16px 32px rgba(0, 35, 80, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.start-button:hover {
  transform: translateY(-3px);
  background: #e3ffff;
  box-shadow:
    0 8px 0 rgba(19, 52, 91, 0.22),
    0 22px 42px rgba(0, 35, 80, 0.24);
}

.start-button:active {
  transform: translateY(1px);
  box-shadow:
    0 3px 0 rgba(19, 52, 91, 0.22),
    0 10px 20px rgba(0, 35, 80, 0.18);
}

.or-text {
  margin: 36px 0 18px;
  font-size: var(--font-home-or-text);
  font-weight: 300;
  letter-spacing: 0.08em;
}

.jump-text {
  margin: 0;
  font-size: var(--font-home-jump-text);
  font-weight: 800;
  letter-spacing: 0.08em;
}

/* =========================
   Journey
========================= */

.journey-section {
  background: #123f92;
  padding: 54px 20px 64px;
  text-align: center;
  scroll-margin-top: 32px;
}

.journey-title {
  margin: 0 0 70px;
  font-size: var(--font-home-journey-title);
  font-weight: 900;
  letter-spacing: 0.08em;
}

.journey-track {
  position: relative;
  width: min(1120px, 94vw);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  column-gap: 38px;
  align-items: start;
}

.track-line {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 148px;
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
  gap: 0;
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
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.16);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0)),
    #d9d9d9;
  display: grid;
  place-items: center;
}

.card-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.lock-icon {
  color: rgba(15, 32, 62, 0.42);
  font-size: var(--font-journey-lock);
  font-weight: 900;
  letter-spacing: 0.12em;
}

.star-row {
  height: 38px;
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
  color: #181c03;
  font-size: var(--font-home-journey-star);
  line-height: 1;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.25),
    0 2px 3px rgba(0, 0, 0, 0.35);
  transition:
    transform 0.18s ease,
    color 0.18s ease;
}

.star.is-active {
  color: #ffe266;
  transform: scale(1.08);
}

.dot {
  width: 24px;
  height: 24px;
  margin-top: 22px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.step-label {
  min-height: 60px;
  margin-top: 30px;
  color: #ffffff;
  font-size: var(--font-home-step-label);
  line-height: 1.35;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.step-title,
.step-subtitle {
  display: block;
}

.journey-step:hover .card-box,
.journey-step:focus-visible .card-box {
  transform: translateY(-5px);
  box-shadow:
    0 7px 0 rgba(0, 0, 0, 0.16),
    0 14px 24px rgba(0, 0, 0, 0.2);
}

.journey-step:hover .dot,
.journey-step:focus-visible .dot {
  box-shadow:
    0 0 0 5px rgba(201, 255, 255, 0.24),
    0 0 20px rgba(201, 255, 255, 0.7);
}

.start-button.is-pressed {
  transform: scale(0.97);
  background: #e3ffff;
  box-shadow:
    0 3px 0 rgba(19, 52, 91, 0.22),
    0 10px 20px rgba(0, 35, 80, 0.18);
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

.journey-step.is-locked {
  opacity: 0.58;
}

.journey-step.is-locked:hover .card-box,
.journey-step.is-locked:focus-visible .card-box {
  transform: none;
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.16);
}

.bingo-hint {
  width: fit-content;
  max-width: min(620px, 88vw);
  margin: 42px auto 0;
  padding: 14px 22px;
  border-radius: 999px;
  background: rgba(201, 255, 255, 0.15);
  color: #e8ffff;
  font-weight: 700;
  font-size: var(--font-bingo-hint);
  letter-spacing: 0.04em;
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
  .start-button:active {
    transform: scale(0.97);
    background: #e3ffff;
    box-shadow:
      0 3px 0 rgba(19, 52, 91, 0.22),
      0 10px 20px rgba(0, 35, 80, 0.18);
  }

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
}

/* =========================
   RWD
========================= */

@media (max-width: 900px) {
  .intro-hero,
  .intro-overlay {
    min-height: auto;
  }

  .intro-overlay {
    padding: 34px 18px;
  }

  .intro-text {
    line-height: 1.8;
    letter-spacing: 0.03em;
  }

  .journey-section {
    padding-top: 42px;
  }

  .journey-title {
    margin-bottom: 42px;
  }

  .journey-track {
    width: min(520px, 92vw);
    grid-template-columns: 1fr;
    row-gap: 34px;
  }

  .track-line {
    left: 155px;
    right: auto;
    top: 36px;
    bottom: 36px;
    width: 4px;
    height: auto;
    transform: translateX(-50%);
  }

  .journey-step {
    grid-template-columns: 120px 42px 1fr;
    grid-template-rows: auto auto;
    column-gap: 14px;
    align-items: center;
    text-align: left;
  }

  .card-box {
    grid-column: 1;
    grid-row: 1 / span 2;
    width: 118px;
    height: 72px;
  }

  .star-row {
    grid-column: 1;
    grid-row: 2;
    height: 24px;
    margin-top: 46px;
    gap: 5px;
  }

  .dot {
    grid-column: 2;
    grid-row: 1 / span 2;
    margin: 0;
  }

  .step-label {
    grid-column: 3;
    grid-row: 1 / span 2;
    min-height: auto;
    margin-top: 0;
    text-align: center;
    justify-self: center;
  }

  .journey-step:hover .card-box,
  .journey-step:focus-visible .card-box {
    transform: translateY(-2px);
  }
}

@media (max-width: 560px) {
  .top-section {
    padding: 20px 14px 14px;
  }

  .logo {
    width: min(220px, 74vw);
    margin-bottom: 22px;
  }

  .main-title {
    line-height: 1.35;
    letter-spacing: 0.04em;
  }

  .intro-text {
    text-align: left;
    line-height: 1.75;
  }

  .start-section {
    padding: 34px 16px 30px;
  }

  .start-button {
    width: 100%;
    min-height: 68px;
    padding: 16px 18px;
    line-height: 1.5;
  }

  .journey-track {
    width: 100%;
  }

  .journey-step {
    grid-template-columns: 104px 34px 1fr;
    column-gap: 10px;
  }

  .card-box {
    width: 104px;
    height: 64px;
  }

  .track-line {
    left: 131px;
    top: 32px;
    bottom: 32px;
  }

  .dot {
    width: 20px;
    height: 20px;
  }

  .footer {
    padding: 38px 18px;
  }
}
</style>