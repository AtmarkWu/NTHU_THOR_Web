<template>
  <main class="stage-page">
    <h1>節點 2｜反應爐</h1>
    <p>這裡之後會放輻射的介紹影片與知識重點。</p>

    <RouterLink to="/" class="back-link">
      回首頁
    </RouterLink>
  </main>
</template>

<style scoped>
.stage-page {
  min-height: 100vh;
  padding: 80px 24px;
  background: #c9f3f6;
  color: #222;
  text-align: center;
  font-family:
    "Noto Sans TC",
    "Microsoft JhengHei",
    sans-serif;
}

h1 {
  color: #4a1974;
  font-size: 2.4rem;
  margin-bottom: 24px;
}

p {
  font-size: 1.2rem;
  margin-bottom: 36px;
}

.back-link {
  display: inline-block;
  padding: 14px 28px;
  border-radius: 999px;
  background: #123f92;
  color: white;
  text-decoration: none;
  font-weight: 700;
}
</style>