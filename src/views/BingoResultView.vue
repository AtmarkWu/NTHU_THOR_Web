<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const bingoResultStorageKey = 'thorWeb_bingo_result'
const bingoSubmittedStorageKey = 'thorWeb_bingo_submitted'

const resultData = ref(null)

const resultTypeText = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
}

const resultStarText = {
  a: 'a',
  b: 'b',
  c: 'c',
  d: 'd',
}

const defaultResultImage = '/images/bingo/bingo-result-placeholder.png'

const defaultNote = '※ 這座反應爐是由你在旅程中學習、Bingo挑戰中翻轉的大眾迷思面向，累積而成的想像中的反應爐！如與現實存在的反應爐雷同，純屬巧合'

const defaultDescription =
  '這裡是結果解說文字的保留位置。之後可以依照 5 種層面結果 × 4 種星星階段，替換成 20 種不同的正式文字。'

const resultCombinationContent = {
  '1-a': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '1-b': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '1-c': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '1-d': { image: defaultResultImage, note: defaultNote, description: defaultDescription },

  '2-a': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '2-b': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '2-c': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '2-d': { image: defaultResultImage, note: defaultNote, description: defaultDescription },

  '3-a': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '3-b': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '3-c': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '3-d': { image: defaultResultImage, note: defaultNote, description: defaultDescription },

  '4-a': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '4-b': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '4-c': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '4-d': { image: defaultResultImage, note: defaultNote, description: defaultDescription },

  '5-a': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '5-b': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '5-c': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
  '5-d': { image: defaultResultImage, note: defaultNote, description: defaultDescription },
}

const currentContent = computed(() => {
  if (!resultData.value) {
    return {
      image: defaultResultImage,
      note: defaultNote,
      description: defaultDescription,
    }
  }

  return resultCombinationContent[resultData.value.resultCode] || {
    image: defaultResultImage,
    note: defaultNote,
    description: defaultDescription,
  }
})

const resultTitle = computed(() => {
  if (!resultData.value) {
    return '自想像中誕生，與你共鳴的反應爐是「x y反應爐」'
  }

  const typeText = resultTypeText[resultData.value.categoryTypeCode]
  const starText = resultStarText[resultData.value.starStageCode]

  return `自想像中誕生，與你共鳴的反應爐是「${typeText} ${starText}反應爐」`
})

function goHome() {
  router.push({
    path: '/',
    hash: '#home-journey',
  })
}

function resetJourney() {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('thorWeb_stage') || key.startsWith('thorWeb_bingo')) {
      localStorage.removeItem(key)
    }
  })

  router.push('/')
}

function downloadResultImage() {
  const link = document.createElement('a')
  link.href = currentContent.value.image
  link.download = `bingo-result-${resultData.value?.resultCode || 'model'}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  const submitted = localStorage.getItem(bingoSubmittedStorageKey)

  if (submitted !== 'true') {
    router.replace('/bingo')
    return
  }

  try {
    const savedResult = localStorage.getItem(bingoResultStorageKey)

    if (!savedResult) {
      router.replace('/bingo')
      return
    }

    resultData.value = JSON.parse(savedResult)
  } catch (error) {
    router.replace('/bingo')
  }
})
</script>

<template>
  <main class="result-page">
    <section class="result-hero">
      <h1>組裝完成！</h1>
      <h2>{{ resultTitle }}</h2>

      <img
        class="result-image"
        :src="currentContent.image"
        alt="Bingo 結果反應爐模型"
      />

      <p class="result-note">
        {{ currentContent.note }}
      </p>

      <p class="result-description">
        {{ currentContent.description }}
      </p>
    </section>

    <section class="result-actions">
      <button class="result-button" type="button" @click="resetJourney">
        再次展開新旅程
      </button>

      <button class="result-button" type="button" @click="goHome">
        回到首頁
      </button>

      <button class="result-button" type="button" @click="downloadResultImage">
        儲存模型結果
      </button>
    </section>

    <footer class="footer">
      <p>指導單位：國立清華大學</p>
      <p>資料來源：國立清華大學反應爐</p>
      <p>網頁UI設計與程式撰寫：吳佳穎</p>
      <p>影片製作與資料蒐集：林沛妤、陳郁阡、張昕愛</p>
    </footer>
  </main>
</template>

<style scoped>
.result-page {
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
  font-family:
    "Noto Sans TC",
    "Microsoft JhengHei",
    "PingFang TC",
    system-ui,
    sans-serif;
}

.result-hero {
  padding: 88px 20px 72px;
  text-align: center;
}

.result-hero h1 {
  margin: 0 0 26px;
  font-size: clamp(28px, 3vw, 46px);
  font-weight: 900;
  letter-spacing: 0.1em;
}

.result-hero h2 {
  width: min(900px, 88vw);
  margin: 0 auto 44px;
  font-size: clamp(26px, 3vw, 48px);
  line-height: 1.7;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
}

.result-image {
  width: min(440px, 70vw);
  display: block;
  margin: 0 auto 54px;
}

.result-note,
.result-description {
  width: min(900px, 86vw);
  margin: 0 auto;
  font-size: clamp(17px, 1.45vw, 24px);
  line-height: 2;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.result-description {
  margin-top: 32px;
}

.result-actions {
  padding: 24px 20px 82px;
  display: flex;
  justify-content: center;
  gap: 80px;
  flex-wrap: wrap;
}

.result-button {
  width: min(300px, 82vw);
  min-height: 82px;
  border: 0;
  border-radius: 8px;
  background: #e8fbff;
  color: #111827;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.06em;
  box-shadow:
    0 7px 0 rgba(8, 28, 65, 0.28),
    0 18px 34px rgba(0, 20, 60, 0.18);
  cursor: pointer;
}

.footer {
  background: #062c68;
  padding: 54px 20px 48px;
  color: #dbe8ff;
  font-size: 15px;
  line-height: 1.55;
  letter-spacing: 0.04em;
}

.footer p {
  width: min(1080px, 92vw);
  margin: 0 auto 4px;
}

@media (max-width: 760px) {
  .result-actions {
    gap: 28px;
  }

  .result-button {
    width: min(430px, 88vw);
  }
}
</style>