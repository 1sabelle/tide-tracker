<div align="center">

# 🌊 Tide 🌙

*a gentle little cycle tracker that keeps your secrets*

`～～～ ebb ～～～ flow ～～～ ebb ～～～ flow ～～～`

**[tide.belle.fyi](https://tide.belle.fyi)**

</div>

---

Tide is a small, calm period and cycle tracker dressed in the deep navy of
*Cuiviénen Night*, the lake where the elves first woke under the stars. ✨

It runs entirely in your browser. No account, no server, no ads, no one
peeking. Your data never leaves your device unless you export it yourself. 🔒

## 🌸 What it does

- 🩸 **Logs your days**: flow, cramps, symptoms, painkillers, mood, notes and unprotected sex
- 🔮 **Predicts what's next**: your next period (with an earliest/latest window), fertile window,
  ovulation and possible implantation days, all learned from your own cycles
- 🗓️ **Shows it on a calendar** with tiny marks for everything you've logged, and the day editor
  doubles as the legend
- 🍼 **Estimates pregnancy likelihood** for each cycle from the days you logged, based on
  published per-day conception rates
- 📊 **Finds your patterns**: a heatmap of what tends to happen on which cycle day
  (hello, day-26 headaches 👋)
- 📜 **Keeps a history** of past periods, and lets you add old ones in one go
- 💾 **Exports and imports** your data as JSON for backups

## 🔒 Your data stays yours

Everything is saved in your browser's local storage. That means:

- 🙈 nobody else can see it, not even the person hosting the site
- 📴 it works offline
- 📱 it lives on **one device**, so export a backup now and then
- 🍎 on iPhone, **add Tide to your Home Screen** so Safari doesn't tidy your data away

Syncing between devices (end-to-end encrypted) is planned. See
[docs/sync-spec.md](docs/sync-spec.md). 🌱

## 🛠️ Run it yourself

```sh
npm install
npm run dev     # 🌊 start a local server
npm test        # 🧪 run the tests
npm run build   # 📦 build static files into dist/
```

It's a static site (React + Vite), so `dist/` can go on any static host.
Tide lives on Cloudflare Pages and redeploys on every push to `main`. 🚀

## 💜 A gentle note

Tide's predictions are calendar estimates, lovingly calculated but still just guesses.
**Please don't use them for contraception**, and talk to a doctor if something feels off. 🩺

<div align="center">

---

made with 🫖 and a lot of periwinkle

🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌑

</div>
