/* i18n.js — 全站中英双语切换引擎（wqnlll 游戏中心）
   用法：每个页面在 <head> 引入 <script src="i18n.js"></script>（须在游戏内联脚本之前）
   - 静态文案：元素加 data-i18n="key"（META 元素改 content，其余用 innerHTML）
   - JS 动态文案：window._t('key', {占位:值})；语言切换用 window.I18N.onLangChange(cb) 重绘 */
(function () {
  'use strict';
  var LS_KEY = 'wqnlll_lang';

  /* ===== 翻译字典：key -> {zh, en} =====
     值可含受信任内联 HTML；{name} 占位符由 _t() 替换 */
  var DICT = {
    /* ---------- 三个游戏页共用 ---------- */
    'common.score':     { zh: '分数',          en: 'Score' },
    'common.level':     { zh: '关卡',          en: 'Level' },
    'common.lives':     { zh: '生命',          en: 'Lives' },
    'common.enemies':   { zh: '敌军',          en: 'Enemies' },
    'common.base':      { zh: '基地',          en: 'Base' },
    'common.gameOver':  { zh: '游戏结束',      en: 'Game Over' },
    'common.restart':   { zh: '再来一局',      en: 'Play Again' },
    'common.startGame': { zh: '开始游戏',      en: 'Start Game' },
    'common.moreGames': { zh: '🎮 更多游戏',   en: '🎮 More Games' },
    'common.backHome':  { zh: '← 返回首页 · 更多游戏', en: '← Back to Home · More Games' },
    'common.statsLabel':{ zh: '本页被访问 ',          en: 'This page: ' },
    'common.statsUnit': { zh: ' 次',                  en: ' views' },

    /* ---------- index.html 首页 ---------- */
    'index.title':      { zh: 'wqnlll · 游戏中心 | 英语打砖块 + 坦克大战', en: 'wqnlll · Game Center | English Brick Breaker + Tank Battle' },
    'index.desc':       { zh: '免费在线小游戏中心 · 英语打砖块学单词 + 坦克大战 · 手机电脑都能玩 · 无需下载！Free browser games — learn English while playing!', en: 'Free online games center · English Brick Breaker to learn words + Tank Battle · Works on mobile & desktop · No download! 免费在线小游戏中心！' },
    'index.keywords':   { zh: '在线游戏,英语学习,打砖块,坦克大战,免费游戏,HTML5游戏,小学生英语,english learning game,brick breaker,browser game,free online games', en: 'free online games,english learning,brick breaker,tank battle,browser game,html5 game,在线游戏,英语学习,打砖块,坦克大战' },
    'index.ogTitle':    { zh: 'wqnlll 游戏中心 · 英语打砖块 + 坦克大战 | Free Online Games', en: 'wqnlll Game Center · English Brick Breaker + Tank Battle | Free Online Games' },
    'index.ogDesc':     { zh: '免费在线小游戏：打砖块学英语单词 + 经典坦克大战。手机电脑都能玩，一键即玩无需下载！Learn English while breaking bricks!', en: 'Free browser games: break bricks & learn English words + classic Tank Battle. Play on mobile or desktop — click to play, no download! 免费在线小游戏！' },
    'index.twTitle':    { zh: 'wqnlll 游戏中心 · 免费在线小游戏', en: 'wqnlll Game Center · Free Online Games' },
    'index.twDesc':     { zh: '打砖块学英语 + 坦克大战！免费在线玩，无需下载。', en: 'Break bricks & learn English + Tank Battle! Free online, no download.' },
    'index.subtitle':   { zh: '· 游 戏 中 心 ·', en: '· G A M E  C E N T E R ·' },
    'index.welcome':    { zh: '欢迎来到 <span>wqnlll 游戏中心</span>', en: 'Welcome to <span>wqnlll Game Center</span>' },
    'index.intro1':     { zh: '这里收集了由我独立开发制作的免费在线小游戏，无需下载、无需安装，打开网页即点即玩。所有游戏都经过精心优化，无论是电脑还是手机，都能流畅运行。', en: 'Here are the free online games I built independently. No download, no install — just open the page and play. Every game is optimized to run smoothly on both desktop and mobile.' },
    'index.intro2':     { zh: '我们的英语打砖块游戏将背单词和经典打砖块玩法巧妙结合，让小朋友在游戏中不知不觉记住英语单词。坦克大战系列则还原了经典红白机体验，手机版还专门为触屏操作做了适配。', en: 'Our English Brick Breaker combines vocabulary learning with the classic brick-breaker gameplay, so kids memorize English words effortlessly while playing. The Tank Battle series recreates the classic NES experience, with the mobile version fully adapted for touch controls.' },
    'index.feat1':      { zh: '🆓 <strong>完全免费</strong> · 无内购', en: '🆓 <strong>100% Free</strong> · No purchases' },
    'index.feat2':      { zh: '📱 <strong>全平台支持</strong> · 电脑手机都能玩', en: '📱 <strong>All Platforms</strong> · Desktop & mobile' },
    'index.feat3':      { zh: '⚡ <strong>即点即玩</strong> · 无需下载安装', en: '⚡ <strong>Click & Play</strong> · No download' },
    'index.feat4':      { zh: '🎯 <strong>寓教于乐</strong> · 边玩游戏边学英语', en: '🎯 <strong>Learn & Play</strong> · English while gaming' },
    'index.featGames':  { zh: '🎮 精选<span>游戏</span>', en: '🎮 Featured <span>Games</span>' },
    'index.tagStudy':   { zh: '学习',           en: 'Learning' },
    'index.tagEnglish': { zh: '英语',           en: 'English' },
    'index.tagFun':     { zh: '趣味',           en: 'Fun' },
    'index.brickName':  { zh: '英语打砖块',     en: 'English Brick Breaker' },
    'index.brickDesc':  { zh: '打碎砖块学英语单词！每个砖块都标有英文单词和中文翻译，打碎时自动朗读发音。', en: 'Break bricks to learn English words! Every brick shows an English word with Chinese translation, and speaks it out loud when broken.' },
    'index.brickDetail':{ zh: '🎯 8大主题 200+ 核心词汇 &nbsp;|&nbsp; 🔊 真人发音跟读 &nbsp;|&nbsp; 📊 分数激励系统 &nbsp;|&nbsp; 👶 适合小学生及英语初学者 &nbsp;|&nbsp; 🧱 经典打砖块玩法，上手零门槛', en: '🎯 8 topics, 200+ core words &nbsp;|&nbsp; 🔊 Real pronunciation &nbsp;|&nbsp; 📊 Score system &nbsp;|&nbsp; 👶 For kids & beginners &nbsp;|&nbsp; 🧱 Classic gameplay, easy to start' },
    'index.tagPhone':   { zh: '手机',           en: 'Mobile' },
    'index.tagTouch':   { zh: '触屏',           en: 'Touch' },
    'index.tagAnywhere':{ zh: '随时随地',       en: 'Anywhere' },
    'index.tankmName':  { zh: '坦克大战 · 手机版', en: 'Tank Battle · Mobile' },
    'index.tankmDesc':  { zh: '专为手机触屏优化的坦克大战，虚拟摇杆 + 开火按钮，随时随地掏出手机就能来一局。', en: 'Tank Battle optimized for mobile touch screens — virtual joystick + fire button. Pick up your phone and play anytime, anywhere.' },
    'index.tankmDetail':{ zh: '📱 虚拟方向键触控 &nbsp;|&nbsp; 🔥 一键开火 &nbsp;|&nbsp; 🛡️ 保护基地 &nbsp;|&nbsp; 🎯 多波敌军挑战 &nbsp;|&nbsp; 📊 实时分数统计', en: '📱 Virtual D-pad &nbsp;|&nbsp; 🔥 One-tap fire &nbsp;|&nbsp; 🛡️ Protect the base &nbsp;|&nbsp; 🎯 Multiple enemy waves &nbsp;|&nbsp; 📊 Live score' },
    'index.tagClassic': { zh: '经典',           en: 'Classic' },
    'index.tagKeyboard':{ zh: '键盘',           en: 'Keyboard' },
    'index.tankName':   { zh: '坦克大战',       en: 'Tank Battle' },
    'index.tankDesc':   { zh: '经典俯视角坦克射击游戏，还原红白机时代的纯粹乐趣。用键盘操控，保护基地、消灭敌军。', en: 'Classic top-down tank shooter that recreates the pure fun of the NES era. Use the keyboard to protect your base and destroy enemies.' },
    'index.tankDetail': { zh: '⌨️ WASD 移动 + 空格开火 &nbsp;|&nbsp; 🛡️ 守护基地 &nbsp;|&nbsp; 🎯 逐关推进 &nbsp;|&nbsp; 🏆 高分挑战 &nbsp;|&nbsp; 🎮 经典红白机体验', en: '⌨️ WASD move + Space fire &nbsp;|&nbsp; 🛡️ Defend the base &nbsp;|&nbsp; 🎯 Level by level &nbsp;|&nbsp; 🏆 High score &nbsp;|&nbsp; 🎮 Classic NES feel' },
    'index.howtoTitle': { zh: '📖 使用说明',     en: '📖 How to Play' },
    'index.howto1':     { zh: '点击任意游戏卡片，进入游戏页面。', en: 'Click any game card to open its page.' },
    'index.howto2':     { zh: '英语打砖块：用键盘 ← → 移动挡板，空格键发射小球。打碎砖块得分，同时学习单词发音和释义。', en: 'English Brick Breaker: use ← → to move the paddle and Space to launch the ball. Break bricks to score while learning word pronunciation and meaning.' },
    'index.howto3':     { zh: '坦克大战（电脑版）：WASD 移动坦克，空格键开火。消灭所有敌军坦克并保护基地。', en: 'Tank Battle (PC): move with WASD, fire with Space. Destroy all enemy tanks and protect your base.' },
    'index.howto4':     { zh: '坦克大战（手机版）：屏幕虚拟摇杆控制方向，点击开火按钮射击。专为触屏优化。', en: 'Tank Battle (Mobile): control with the on-screen joystick and tap the fire button. Built for touch screens.' },
    'index.howto5':     { zh: '所有游戏数据存储在本地浏览器中，不会上传到任何服务器。', en: 'All game data is stored locally in your browser and never uploaded to any server.' },
    'index.mathHow':    { zh: '三年级数学闯关：选择关卡开始口算答题，限时闯关越往后越难；联机对战需电脑运行本地服务器。', en: 'Grade 3 Math Challenge: pick a level and answer mental-math questions; levels get harder. PvP needs a PC running the local server.' },
    'index.rtsHow':     { zh: '红警RTS：左键拖框选兵，右键点敌人攻击、点空地移动；采矿造兵，拆掉敌方基地获胜。', en: 'Red Alert RTS: left-drag to select units, right-click to attack or move; mine gold, build, and destroy the enemy base to win.' },
    'index.tagMath':    { zh: '数学',           en: 'Math' },
    'index.tagMental':  { zh: '口算',           en: 'Mental' },
    'index.tagAdventure':{ zh: '闯关',          en: 'Adventure' },
    'index.mathName':   { zh: '三年级数学闯关',  en: 'Grade 3 Math Challenge' },
    'index.mathDesc':   { zh: '加减乘除口算闯关 + 限时挑战，还能同 Wi-Fi 联机对战！手机电脑都能玩，即点即玩。', en: 'Timed mental-math levels plus PvP battles over the same Wi-Fi! Play on mobile or desktop — click and play.' },
    'index.mathDetail': { zh: '➕ 加减乘除口算 &nbsp;|&nbsp; ⏱ 限时闯关 &nbsp;|&nbsp; 👥 联机对战 &nbsp;|&nbsp; 📱 手机电脑都能玩 &nbsp;|&nbsp; 🎓 贴近三年级课程', en: '➕ Mental math &nbsp;|&nbsp; ⏱ Timed levels &nbsp;|&nbsp; 👥 PvP battles &nbsp;|&nbsp; 📱 Mobile &amp; desktop &nbsp;|&nbsp; 🎓 3rd-grade aligned' },
    'index.tagStrategy':{ zh: '策略',           en: 'Strategy' },
    'index.tagRedAlert':{ zh: '红警',           en: 'RTS' },
    'index.rtsName':    { zh: '红警RTS · 网页版红色警戒', en: 'Red Alert RTS' },
    'index.rtsDesc':    { zh: '红警2风格的网页即时战略！采矿造兵、双阵营超级武器，单机打 AI。电脑键鼠 + 手机触屏都能玩。', en: 'A Red Alert 2-style web RTS! Mine gold, build an army, deploy super weapons, and fight the AI. Keyboard/mouse and touch both work.' },
    'index.rtsDetail':  { zh: '🏰 基地建造 &nbsp;|&nbsp; 🚜 自动采矿经济 &nbsp;|&nbsp; 🛡️ 双阵营超武 &nbsp;|&nbsp; 🤖 单机打AI &nbsp;|&nbsp; 🖥📱 键鼠触屏都能玩', en: '🏰 Base building &nbsp;|&nbsp; 🚜 Auto mining &nbsp;|&nbsp; 🛡️ Super weapons &nbsp;|&nbsp; 🤖 vs AI &nbsp;|&nbsp; 🖥📱 Desktop &amp; mobile' },
    'index.footAbout':  { zh: '关于本站',       en: 'About' },
    'index.footPrivacy':{ zh: '隐私政策',       en: 'Privacy' },
    'index.footerText': { zh: '🎮 wqnlll 游戏中心 · 用爱发电 · 持续更新中', en: '🎮 wqnlll Game Center · Made with love · Always updating' },

    /* ---------- about.html 关于 ---------- */
    'about.title':      { zh: '关于本站 · wqnlll 游戏中心', en: 'About · wqnlll Game Center' },
    'about.desc':       { zh: '关于 wqnlll 游戏中心 —— 一个独立开发者制作的免费在线小游戏网站', en: 'About wqnlll Game Center — free online browser games built by an indie developer' },
    'about.back':       { zh: '← 返回首页',     en: '← Back to Home' },
    'about.h1':         { zh: '关于本站',       en: 'About' },
    'about.hello':      { zh: '👋 你好！',       en: '👋 Hello!' },
    'about.hello1':     { zh: '欢迎来到 <strong>wqnlll 游戏中心</strong>！这是一个由个人独立开发维护的免费在线小游戏网站。', en: 'Welcome to <strong>wqnlll Game Center</strong>! This is a free online browser-games site developed and maintained independently by one person.' },
    'about.hello2':     { zh: '我们的初衷很简单：<span class="highlight">用有趣的方式帮助小朋友学习英语，同时提供一些经典的休闲小游戏，让大家在忙碌之余放松一下。</span>', en: 'Our goal is simple: <span class="highlight">help kids learn English in a fun way, while offering classic casual games so everyone can relax after a busy day.</span>' },
    'about.gamesTitle': { zh: '🎯 我们的游戏',   en: '🎯 Our Games' },
    'about.gamesIntro': { zh: '目前收录了以下游戏：', en: 'We currently offer these games:' },
    'about.games1':     { zh: '<strong>英语打砖块</strong> —— 将小学英语单词融入经典打砖块玩法。每个砖块都是一张单词卡（英文 + 中文），打碎时自动朗读发音。覆盖 8 大主题 200+ 核心词汇，让背单词不再枯燥。适合小学生和英语初学者。', en: '<strong>English Brick Breaker</strong> — merges primary-school English words into classic brick-breaker gameplay. Every brick is a flashcard (English + Chinese) that speaks aloud when broken. Covers 8 topics and 200+ core words to make memorizing fun. Great for kids and beginners.' },
    'about.games2':     { zh: '<strong>坦克大战（电脑版）</strong> —— 经典俯视角射击游戏，WASD 移动 + 空格开火，保护基地、消灭敌军。致敬红白机时代的经典之作。', en: '<strong>Tank Battle (PC)</strong> — a classic top-down shooter. Move with WASD, fire with Space, protect your base, and destroy enemies. A tribute to the NES classics.' },
    'about.games3':     { zh: '<strong>坦克大战（手机版）</strong> —— 为手机触屏专门优化的版本，虚拟摇杆操控，随时随地来一局。核心玩法与电脑版一致，操作方式更适合移动端。', en: '<strong>Tank Battle (Mobile)</strong> — optimized for mobile touch screens with a virtual joystick. Same core gameplay as the PC version, with controls built for phones.' },
    'about.games4':     { zh: '<strong>三年级数学闯关</strong> —— 加减乘除口算闯关游戏，限时挑战逐关变难，还能同 Wi-Fi 联机对战。贴近三年级课程，手机电脑都能玩。', en: '<strong>Grade 3 Math Challenge</strong> — a mental-math game of mixed addition, subtraction, multiplication and division. Timed levels get harder as you advance, and you can battle a friend over the same Wi-Fi. Aligned with the 3rd-grade curriculum; plays on mobile and desktop.' },
    'about.games5':     { zh: '<strong>红警RTS · 网页版红色警戒</strong> —— 红警2风格的网页即时战略游戏：采矿造兵、双阵营超级武器，单机打 AI。键鼠和触屏都能玩。', en: '<strong>Red Alert RTS</strong> — a Red Alert 2 style web real-time strategy game. Mine gold, build an army, deploy super weapons and fight the AI in single-player. Works with keyboard/mouse and touch.' },
    'about.whyTitle':   { zh: '💡 为什么做这个网站', en: '💡 Why We Built This' },
    'about.why1':       { zh: '作为一个开发者，我一直觉得学习编程最好的方式就是动手做项目。这些游戏是我在学习和实践中一步步打磨出来的。把它们免费分享出来，既是对自己技能的检验，也希望能给其他人带来一些乐趣和帮助。', en: 'As a developer, I believe the best way to learn programming is to build real projects. These games were polished one step at a time through learning and practice. Sharing them for free tests my skills and, I hope, brings others some fun and help.' },
    'about.why2':       { zh: '特别是英语打砖块这个游戏，灵感来自于看到小朋友背单词很痛苦——与其死记硬背，不如在游戏中自然习得。每打碎一块砖，就记住一个单词，这种即时反馈让学习变得轻松愉快。', en: 'English Brick Breaker in particular was inspired by watching kids struggle to memorize words — instead of rote learning, why not learn naturally through play? Every brick you break is a word you remember; that instant feedback makes learning easy and fun.' },
    'about.techTitle':  { zh: '🛠 技术栈',       en: '🛠 Tech Stack' },
    'about.tech':       { zh: '本网站所有游戏均使用原生 HTML5 + CSS + JavaScript 开发，不依赖任何前端框架。游戏画布基于 HTML5 Canvas API 渲染，音效使用 Web Audio API / Speech Synthesis API。托管在 GitHub Pages 上，通过 HTTPS 提供安全访问。', en: 'All games here are built with plain HTML5 + CSS + JavaScript, with no front-end frameworks. Game graphics render on the HTML5 Canvas API, and audio uses the Web Audio API / Speech Synthesis API. Hosted on GitHub Pages with secure HTTPS.' },
    'about.contactTitle':{ zh: '📬 联系与反馈', en: '📬 Contact & Feedback' },
    'about.contactIntro':{ zh: '如果你有任何建议、Bug 反馈，或者想合作开发新游戏，欢迎通过以下方式联系：', en: 'Have suggestions, bug reports, or want to collaborate on new games? Reach me via:' },
    'about.contactGh':  { zh: 'GitHub：<a href="https://github.com/wqnlll" target="_blank" rel="noopener">https://github.com/wqnlll</a>', en: 'GitHub: <a href="https://github.com/wqnlll" target="_blank" rel="noopener">https://github.com/wqnlll</a>' },
    'about.contactIssues':{ zh: 'Issues：<a href="https://github.com/wqnlll/wqnlll.github.io/issues" target="_blank" rel="noopener">提交反馈</a>', en: 'Issues: <a href="https://github.com/wqnlll/wqnlll.github.io/issues" target="_blank" rel="noopener">Submit feedback</a>' },
    'about.contactEnd': { zh: '我会持续更新和添加新游戏，敬请期待！', en: 'I keep updating and adding new games — stay tuned!' },

    /* ---------- privacy.html 隐私政策 ---------- */
    'privacy.title':    { zh: '隐私政策 · wqnlll 游戏中心', en: 'Privacy Policy · wqnlll Game Center' },
    'privacy.h1':       { zh: '隐私政策',       en: 'Privacy Policy' },
    'privacy.updated':  { zh: '最后更新日期：2026年8月2日', en: 'Last updated: August 2, 2026' },
    'privacy.s1Title':  { zh: '1. 我们收集什么信息', en: '1. What information we collect' },
    'privacy.s1':       { zh: '<strong>我们不主动收集任何个人信息。</strong>wqnlll 游戏中心是一个纯静态网站，所有游戏数据（如分数、关卡进度）仅存储在您浏览器的本地存储（localStorage）中，不会上传到任何服务器。', en: '<strong>We do not actively collect any personal information.</strong> wqnlll Game Center is a purely static website. All game data (e.g. scores, level progress) is stored only in your browser’s localStorage and is never uploaded to any server.' },
    'privacy.s2Title':  { zh: '2. 第三方服务',   en: '2. Third-party services' },
    'privacy.s2Intro':  { zh: '本网站可能使用以下第三方服务：', en: 'This website may use the following third-party services:' },
    'privacy.s2Google': { zh: '<strong>Google AdSense</strong>：用于展示广告。Google 可能使用 Cookie 来投放基于用户兴趣的广告。详情请参阅 <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google 隐私政策</a>。', en: '<strong>Google AdSense</strong>: serves ads. Google may use cookies to show interest-based ads. See the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a> for details.' },
    'privacy.s2GitHub': { zh: '<strong>GitHub Pages</strong>：本网站托管在 GitHub Pages 上。GitHub 可能收集基本的技术日志。详情请参阅 <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">GitHub 隐私声明</a>。', en: '<strong>GitHub Pages</strong>: this site is hosted on GitHub Pages. GitHub may collect basic technical logs. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noopener">GitHub Privacy Statement</a> for details.' },
    'privacy.s3Title':  { zh: '3. Cookie',       en: '3. Cookies' },
    'privacy.s3':       { zh: 'Google AdSense 可能在您的设备上放置 Cookie 以提供个性化广告。您可以通过浏览器设置禁用 Cookie，或访问 <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google 广告设置</a> 来管理广告偏好。', en: 'Google AdSense may place cookies on your device to serve personalized ads. You can disable cookies in your browser settings, or manage your ad preferences at <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ad Settings</a>.' },
    'privacy.s4Title':  { zh: '4. 儿童隐私',     en: '4. Children’s privacy' },
    'privacy.s4':       { zh: '本网站的部分内容（如英语打砖块游戏）面向儿童。我们不会有意收集 13 岁以下儿童的个人信息。如果您是家长且认为我们收集了您孩子的信息，请联系我们。', en: 'Some content on this site (such as the English Brick Breaker game) is aimed at children. We do not knowingly collect personal information from children under 13. If you are a parent and believe we have collected your child’s information, please contact us.' },
    'privacy.s5Title':  { zh: '5. 数据安全',     en: '5. Data security' },
    'privacy.s5':       { zh: '由于本网站为纯静态网站，不设后端服务器和数据库，您的游戏数据仅保存在您自己的设备上。清除浏览器缓存或数据将导致游戏进度丢失。', en: 'Because this is a purely static website with no backend servers or databases, your game data is kept only on your own device. Clearing your browser cache or data will erase your game progress.' },
    'privacy.s6Title':  { zh: '6. 联系我们',     en: '6. Contact us' },
    'privacy.s6':       { zh: '如果您对隐私政策有任何疑问，请通过以下方式联系：', en: 'If you have any questions about this Privacy Policy, please contact us at:' },
    'privacy.s6Li':     { zh: 'GitHub Issues：<a href="https://github.com/wqnlll/wqnlll.github.io/issues" target="_blank" rel="noopener">https://github.com/wqnlll/wqnlll.github.io/issues</a>', en: 'GitHub Issues: <a href="https://github.com/wqnlll/wqnlll.github.io/issues" target="_blank" rel="noopener">https://github.com/wqnlll/wqnlll.github.io/issues</a>' },
    'privacy.s7Title':  { zh: '7. 政策更新',     en: '7. Policy updates' },
    'privacy.s7':       { zh: '我们可能会不定期更新本隐私政策。更新后会在本页面发布，并在页面顶部标注更新日期。', en: 'We may update this Privacy Policy from time to time. When updated, it will be published on this page with the revision date shown at the top.' },

    /* ---------- 英语打砖块 ---------- */
    'brick.title':      { zh: '小学英语打砖块 · 学单词神器', en: 'English Brick Breaker — Learn 200+ English Words by Playing' },
    'brick.desc':       { zh: '免费在线学英语单词：打砖块记单词，真人发音自动朗读，8大主题200+词汇，小学生必备！', en: 'Learn English words online for free: break bricks and memorize words with real pronunciation. 8 topics, 200+ words — perfect for kids!' },
    'brick.ogTitle':    { zh: '小学英语打砖块 · 一边打砖块一边学英语单词', en: 'English Brick Breaker · Learn English words while breaking bricks' },
    'brick.ogDesc':     { zh: '200+ 小学英语单词，8 大主题，自动朗读发音！打砖块学英语，孩子越玩越上瘾。免费在线玩，无需下载。', en: '200+ primary-school English words across 8 topics with auto-pronunciation! Break bricks and learn — kids will love it. Free to play online, no download.' },
    'brick.twTitle':    { zh: '小学英语打砖块 · 学单词神器', en: 'English Brick Breaker · Word Master' },
    'brick.twDesc':     { zh: '200+ 单词，自动朗读，手机电脑都能玩！免费！', en: '200+ words with auto audio, playable on mobile & desktop. Free!' },
    'brick.startSub':   { zh: '打碎砖块学英语单词！适合小学生<br>每个砖块都有 <span class="highlight">英文 + 中文翻译</span><br>打碎时自动朗读发音 + 美式口语例句！', en: 'Break bricks to learn English words! Made for kids<br>Every brick shows <span class="highlight">English + Chinese</span><br>Speaks the word + a natural sample sentence when broken!' },
    'brick.sentence':   { zh: '例句',           en: 'Ex.' },
    'brick.name':       { zh: '📚 小学英语打砖块', en: '📚 English Brick Breaker' },
    'brick.startSub1':  { zh: '打碎砖块学英语单词！适合小学生', en: 'Break bricks to learn English words! Made for kids' },
    'brick.startSub2':  { zh: '每个砖块都有 英文 + 中文翻译', en: 'Every brick shows English + Chinese' },
    'brick.startSub3':  { zh: '打碎时自动朗读发音！', en: 'Speaks the word aloud when broken!' },
    'brick.startBtn':   { zh: '开始学习',       en: 'Start Learning' },
    'brick.learnMode':  { zh: '🔤 先学单词',    en: '🔤 Learn Words First' },
    'brick.learnTitle': { zh: '学习本关单词',   en: 'Learn This Level' },
    'brick.learnTip':   { zh: '点卡片翻面看释义 · 点喇叭听发音', en: 'Tap card to flip · Tap speaker to hear' },
    'brick.learnStart': { zh: '开始游戏 ▶',     en: '▶ Start Game' },
    'brick.learnPrev':  { zh: '← 上一个',       en: '← Prev' },
    'brick.learnNext':  { zh: '下一个 →',       en: 'Next →' },
    'brick.feature5':   { zh: '<strong>学习模式</strong>：开打前先用闪卡预习本关单词，边听边记，学完再上阵', en: '<strong>Learn mode</strong>: preview this level’s words with flashcards before you play — listen and memorize first' },
    'brick.shareFriend':{ zh: '📤 分享给朋友',   en: '📤 Share with Friends' },
    'brick.winTitle':   { zh: '太棒了!',         en: 'Awesome!' },
    'brick.nextLevel':  { zh: '下一关',         en: 'Next Level' },
    'brick.shareScore': { zh: '📤 分享战绩',     en: '📤 Share Score' },
    'brick.ctrlDesktop':{ zh: '💻 ← → 移动 空格 发射', en: '💻 ← → Move · Space Launch' },
    'brick.ctrlMobile': { zh: '📱 滑动移动 · 点击发射', en: '📱 Swipe to move · Tap to launch' },
    'brick.infoTitle':  { zh: '📚 英语打砖块 · 学单词神器', en: '📚 English Brick Breaker · Learn Words' },
    'brick.infoDesc':   { zh: '将小学英语单词和经典打砖块玩法巧妙结合，让孩子在游戏中不知不觉记住单词！', en: 'Combines primary-school English words with classic brick-breaker gameplay, so kids memorize words effortlessly while playing!' },
    'brick.featuresTitle':{ zh: '🎯 核心特色',   en: '🎯 Key Features' },
    'brick.feature1':   { zh: '<strong>8 大主题</strong>：动物、食物、颜色、数字、家庭成员、身体部位、学校用品、日常用品', en: '<strong>8 topics</strong>: Animals, Food, Colors, Numbers, Family, Body, School, Daily Items' },
    'brick.feature2':   { zh: '<strong>200+ 核心词汇</strong>：覆盖小学阶段常用英语单词，每个砖块都是英文 + 中文翻译', en: '<strong>200+ core words</strong>: covering common primary-school vocabulary. Every brick is English + Chinese' },
    'brick.feature3':   { zh: '<strong>真人发音</strong>：打碎砖块时自动朗读英语发音和美式口语例句，帮助建立正确的语音印象和语感', en: '<strong>Real pronunciation</strong>: speaks the English word and a natural American example sentence when you break a brick, building correct sound and sentence sense' },
    'brick.feature4':   { zh: '<strong>分数激励</strong>：打碎砖块获得分数，每关结束展示成绩，激励不断挑战', en: '<strong>Score rewards</strong>: earn points for each brick broken, with results shown at the end of every level to keep you going' },
    'brick.howTitle':   { zh: '🕹 玩法说明',     en: '🕹 How to Play' },
    'brick.how1':       { zh: '<strong>电脑端</strong>：← → 方向键移动挡板，空格键发射小球', en: '<strong>Desktop</strong>: move the paddle with ← → and launch the ball with Space' },
    'brick.how2':       { zh: '<strong>手机端</strong>：左右滑动移动挡板，点击屏幕发射小球', en: '<strong>Mobile</strong>: swipe left/right to move the paddle, tap to launch the ball' },
    'brick.how3':       { zh: '用挡板接住小球，让小球击碎砖块。每块砖都是一张单词卡！', en: 'Bounce the ball with your paddle to smash bricks. Every brick is a vocabulary card!' },
    'brick.how4':       { zh: '<strong>3 条生命</strong>，小球掉落即失去一条命。清空所有砖块进入下一关', en: 'You have <strong>3 lives</strong>. Lose one when the ball falls. Clear all bricks to advance to the next level' },
    'brick.audienceTitle':{ zh: '👶 适合人群',   en: '👶 Who It’s For' },
    'brick.audience':   { zh: '小学生、英语初学者、想通过趣味方式复习单词的任何年龄段学习者。', en: 'Kids, English beginners, and learners of any age who want to review words in a fun way.' },
    'brick.paused':     { zh: '暂停',           en: 'Paused' },
    'brick.tapContinue':{ zh: '点击继续',       en: 'Tap to Continue' },
    'brick.finalScore': { zh: '最终得分: {score}', en: 'Final Score: {score}' },
    'brick.winMsg':     { zh: '得分: {score} | 学了 {n} 个{topic}单词!', en: 'Score: {score} | Learned {n} {topic} words!' },
    'brick.shareTitle': { zh: '小学英语打砖块',  en: 'English Brick Breaker' },
    'brick.shareText':  { zh: '🎮 小学英语打砖块 · 200+单词自动朗读！免费在线玩，一起来学英语吧！', en: '🎮 English Brick Breaker · 200+ words with audio! Free to play online — let’s learn English together!' },
    'brick.copied':     { zh: '✅ 已复制链接！', en: '✅ Link copied!' },

    /* ---------- 坦克大战（桌面 + 手机共用） ---------- */
    'tank.title':       { zh: '坦克大战',       en: 'Tank Battle — Classic NES Tank Shooter | Free Online Game' },
    'tank.mobileTitle': { zh: '🎮 坦克大战',    en: '🎮 Tank Battle' },
    'tank.mobilePageTitle':{ zh: '坦克大战 · 手机版', en: 'Tank Battle Mobile — Touch Tank Shooter | Free Online Game' },
    'tank.controls':    { zh: 'WASD/方向键移动 空格射击 保护基地 消灭所有敌军', en: 'WASD/Arrows move · Space shoot · Protect base · Destroy all enemies' },
    'tank.mobileControls':{ zh: '方向键移动 · 开火按钮射击', en: 'D-pad to move · Fire button to shoot' },
    'tank.baseDestroyed':{ zh: '基地被毁！',     en: 'Base Destroyed!' },
    'tank.fire':        { zh: '开 火',         en: 'FIRE' },
    'tank.infoTitle':   { zh: '🎮 坦克大战 · 经典版', en: '🎮 Tank Battle · Classic' },
    'tank.infoDesc':    { zh: '经典俯视角坦克射击游戏，还原红白机时代的纯粹乐趣。用键盘操控坦克，在砖墙迷宫中与敌军周旋！', en: 'A classic top-down tank shooter that recreates the pure fun of the NES era. Drive your tank with the keyboard and duel enemies through brick mazes!' },
    'tank.featuresTitle':{ zh: '🎯 核心特色',   en: '🎯 Key Features' },
    'tank.feature1':    { zh: '<strong>经典玩法</strong>：致敬 FC 红白机经典，俯视角迷宫射击', en: '<strong>Classic gameplay</strong>: a tribute to the FC/NES classics — top-down maze shooting' },
    'tank.feature2':    { zh: '<strong>键盘操控</strong>：WASD 移动 + 空格开火，手感流畅', en: '<strong>Keyboard controls</strong>: move with WASD, fire with Space — smooth and responsive' },
    'tank.feature3':    { zh: '<strong>基地保卫战</strong>：基地有 3 点生命值，被击中即损失，归零则游戏结束', en: '<strong>Base defense</strong>: your base has 3 HP. It takes damage when hit, and the game ends at zero' },
    'tank.feature4':    { zh: '<strong>多波敌军</strong>：每关多辆敌军坦克，逐关难度递增', en: '<strong>Enemy waves</strong>: multiple enemy tanks per level, with difficulty rising each round' },
    'tank.controlsTitle':{ zh: '🕹 操控说明',   en: '🕹 Controls' },
    'tank.ctrl1':       { zh: '<strong>W</strong> / ↑：向上移动', en: '<strong>W</strong> / ↑: move up' },
    'tank.ctrl2':       { zh: '<strong>S</strong> / ↓：向下移动', en: '<strong>S</strong> / ↓: move down' },
    'tank.ctrl3':       { zh: '<strong>A</strong> / ←：向左移动', en: '<strong>A</strong> / ←: move left' },
    'tank.ctrl4':       { zh: '<strong>D</strong> / →：向右移动', en: '<strong>D</strong> / →: move right' },
    'tank.ctrl5':       { zh: '<strong>空格键</strong>：发射炮弹', en: '<strong>Space</strong>: fire a shell' },
    'tank.tipTitle':    { zh: '💡 小贴士',      en: '💡 Tips' },
    'tank.tip':         { zh: '利用砖墙作为掩体，不要待在开阔地带。优先保护基地——消灭靠近基地的敌军是第一优先级！', en: 'Use brick walls as cover; don’t stay in open ground. Prioritize your base — destroy enemies that get close!' },
    'tank.mobileInfoTitle':{ zh: '📱 坦克大战 · 手机版', en: '📱 Tank Battle · Mobile' },
    'tank.mobileInfoDesc':{ zh: '专为手机触屏优化的坦克大战，随时随地掏出手机就能来一局！', en: 'Tank Battle optimized for mobile touch screens — pick up your phone and play anytime, anywhere!' },
    'tank.mobileFeature1':{ zh: '<strong>虚拟摇杆操控</strong>：屏幕底部方向键，直觉式操作，上手零门槛', en: '<strong>Virtual D-pad</strong>: intuitive on-screen controls at the bottom of the screen — zero learning curve' },
    'tank.mobileFeature2':{ zh: '<strong>一键开火</strong>：大号开火按钮，战斗中不会误触', en: '<strong>One-tap fire</strong>: a large fire button that won’t be mis-tapped in battle' },
    'tank.mobileFeature3':{ zh: '<strong>经典玩法</strong>：保护基地、消灭敌军坦克，还原红白机经典体验', en: '<strong>Classic gameplay</strong>: protect the base and destroy enemy tanks — the NES classic experience' },
    'tank.mobileFeature4':{ zh: '<strong>即时反馈</strong>：实时分数、生命值、敌军数量一目了然', en: '<strong>Instant feedback</strong>: live score, lives, and enemy count at a glance' },
    'tank.mobileHowTitle':{ zh: '🕹 玩法说明',  en: '🕹 How to Play' },
    'tank.mobileHow1':  { zh: '屏幕底部方向键（▲◀▶▼）控制坦克移动', en: 'Move your tank with the on-screen D-pad (▲◀▶▼) at the bottom' },
    'tank.mobileHow2':  { zh: '点击「开火」按钮发射炮弹', en: 'Tap the FIRE button to shoot' },
    'tank.mobileHow3':  { zh: '消灭所有敌军坦克并保护基地不被摧毁', en: 'Destroy all enemy tanks and keep your base intact' },
    'tank.mobileHow4':  { zh: '基地有 3 点生命值，被击中即损失一点', en: 'Your base has 3 HP; each hit costs one point' },
    'tank.mobileTip':   { zh: '手机版同时支持键盘操作（连接蓝牙键盘时），WASD 移动 + 空格开火。也支持电脑浏览器访问，用键盘玩。', en: 'The mobile version also supports keyboards (when a Bluetooth keyboard is connected): WASD to move + Space to fire. It also works in a desktop browser with a keyboard.' },

    /* ---------- 新游戏页共用导航 ---------- */
    'common.backCenter':{ zh: '← 游戏中心',   en: '← Game Center' },
    'common.navAbout':  { zh: '关于',         en: 'About' },
    'common.navPrivacy':{ zh: '隐私',         en: 'Privacy' },

    /* ---------- 三年级数学闯关 ---------- */
    'math.title':   { zh: '三年级数学闯关 · 免费在线口算练习 | Grade 3 Math Game', en: 'Grade 3 Math Challenge — Free Mental Math Game for Kids' },
    'math.desc':    { zh: '三年级数学闯关 · 免费在线口算练习小游戏！加减乘除计时闯关，还能同 Wi-Fi 联机对战。手机电脑都能玩，无需下载。Grade 3 Math Challenge — free mental math game.', en: 'Grade 3 Math Challenge — a free online mental-math game! Timed + − × ÷ levels plus PvP over the same Wi-Fi. Works on mobile & desktop, no download. 三年级数学闯关免费口算游戏。' },
    'math.keywords':{ zh: '三年级数学,口算,数学练习,小学数学,在线游戏,加减乘除,数学小游戏,教育游戏,grade 3 math,mental math,math game,educational game', en: 'grade 3 math,mental math,math game,educational game,free online math,三年级数学,口算,加减乘除' },
    'math.ogTitle': { zh: '三年级数学闯关 · 免费在线口算练习 | Grade 3 Math Game', en: 'Grade 3 Math Challenge · Free Mental Math Game' },
    'math.ogDesc':  { zh: '加减乘除口算闯关 + 计时挑战 + 同 Wi-Fi 联机对战，手机电脑都能玩，免费无需下载！', en: 'Timed mental-math levels + PvP battles over the same Wi-Fi! Free, no download, mobile & desktop.' },
    'math.twTitle': { zh: '三年级数学闯关 · 免费口算游戏', en: 'Grade 3 Math Challenge · Free Math Game' },
    'math.twDesc':  { zh: '加减乘除口算闯关，还能联机对战！免费在线玩。', en: 'Timed mental math + PvP battles. Play free online!' },
    'math.h1':      { zh: '🎮 三年级数学闯关', en: '🎮 Grade 3 Math Challenge' },
    'math.h1en':    { zh: 'Grade 3 Math Challenge — Free Online Mental Math Game', en: '三年级数学闯关 · 免费在线口算练习' },
    'math.sub':     { zh: '结合课程进度的加减乘除口算闯关游戏：答对晋级、限时挑战、越闯越难。打开即玩，电脑和手机都能用，还能和同一 Wi-Fi 的小伙伴来一局联机对战。', en: 'A mental-math adventure aligned with school curriculum: answer fast, clear timed levels, and the difficulty ramps up. Click to play on desktop or mobile — or battle a friend over the same Wi-Fi!' },
    'math.openNew': { zh: '↗ 在新窗口打开游戏', en: '↗ Open game in new window' },
    'math.featuresTitle':{ zh: '🎯 核心特色', en: '🎯 Key Features' },
    'math.f1':      { zh: '<strong>口算练习</strong>：加减乘除混合出题，贴近三年级课程', en: '<strong>Mental math</strong>: a mix of + − × ÷ aligned with the 3rd-grade curriculum' },
    'math.f2':      { zh: '<strong>计时闯关</strong>：限时答题，越往后题目越难，挑战反应力', en: '<strong>Timed levels</strong>: answer before the clock runs out; questions get harder as you advance' },
    'math.f3':      { zh: '<strong>逐关推进</strong>：由易到难闯关升级，答对越多得分越高', en: '<strong>Progressive levels</strong>: easy to hard, more correct answers earn more stars' },
    'math.f4':      { zh: '<strong>联机对战</strong>：同一 Wi-Fi 下两人实时抢答对战', en: '<strong>PvP battle</strong>: race a friend in real time over the same Wi-Fi' },
    'math.f5':      { zh: '<strong>轻快音乐</strong>：八音盒《小星星》背景音乐 + 答对答错音效，可一键开关', en: '<strong>Cheerful music</strong>: a music-box Twinkle Twinkle background plus correct/wrong sounds, one-tap toggle' },
    'math.f6':      { zh: '<strong>即点即玩</strong>：手机电脑都能玩，无需下载安装', en: '<strong>Click &amp; play</strong>: works on mobile and desktop, no download' },
    'math.howTitle':{ zh: '🕹 玩法说明', en: '🕹 How to Play' },
    'math.how1':    { zh: '打开页面选择关卡即可开始，在输入区作答并「提交」', en: 'Pick a level to start, type your answer and hit Submit' },
    'math.how2':    { zh: '答对进入下一题；答错会显示正确答案提示', en: 'Correct answers advance you; wrong ones reveal the right answer' },
    'math.how3':    { zh: '时间条走完或生命值耗尽，本关结束并结算分数', en: 'The level ends when the timer runs out or you lose all lives, then your score is tallied' },
    'math.how4':    { zh: '<strong>联机对战</strong>：电脑双击「启动联机服务器.bat」运行本地服务器，手机连同一 Wi-Fi 打开页面、一人建房间一人输入房间号加入', en: '<strong>PvP</strong>: on the PC run "启动联机服务器.bat" to start the local server; a phone on the same Wi-Fi opens the page and joins by room code' },
    'math.tipTitle':{ zh: '💡 小贴士', en: '💡 Tips' },
    'math.tip':     { zh: '单机模式打开页面直接就能玩，不需要服务器。右上角 🎵/🔊 按钮可开关背景音乐和音效，设置会自动记住，下次打开还是你选的。', en: 'Solo mode works right away — no server needed. Use the 🎵/🔊 buttons to toggle music and sound; your choice is remembered.' },

    /* ---------- 红警RTS ---------- */
    'rts.title':    { zh: '红警RTS · 网页版红色警戒 | Web Red Alert Strategy Game', en: 'Red Alert RTS — Free Web Real-Time Strategy Game' },
    'rts.desc':     { zh: '红警RTS · 网页版红色警戒！红警2风格的免费在线即时战略游戏：基地建造、采矿经济、兵种对战、超级武器，单机打 AI。电脑手机都能玩，无需下载。Web Red Alert style RTS strategy game.', en: 'Red Alert RTS — a free browser real-time strategy game in the style of Red Alert 2: base building, mining economy, unit combat and super weapons, vs AI in single player. Desktop & mobile, no download. 红警2风格网页即时战略。' },
    'rts.keywords': { zh: '红警,红色警戒,即时战略,RTS,坦克大战,战略游戏,网页游戏,免费在线游戏,red alert,real time strategy,browser game,online strategy game', en: 'red alert,real time strategy,rts,strategy game,browser game,free online strategy,红警,即时战略,坦克大战' },
    'rts.ogTitle':  { zh: '红警RTS · 网页版红色警戒 | Web Red Alert Strategy Game', en: 'Red Alert RTS · Web Strategy Game' },
    'rts.ogDesc':   { zh: '红警2风格的免费网页即时战略：采矿赚钱、造兵推线、双阵营超武，单机打 AI。电脑手机都能玩！', en: 'A Red Alert 2-style browser RTS: mine gold, build units, push the front, deploy super weapons, and fight the AI. Desktop & mobile!' },
    'rts.twTitle':  { zh: '红警RTS · 网页版红色警戒', en: 'Red Alert RTS · Web Strategy Game' },
    'rts.twDesc':   { zh: '红警2风格免费网页 RTS，单机打 AI，电脑手机都能玩！', en: 'Red Alert 2-style web RTS, fight the AI, works on desktop & mobile!' },
    'rts.h1':       { zh: '⚔️ 红警RTS · 网页版红色警戒', en: '⚔️ Red Alert RTS' },
    'rts.h1en':     { zh: 'Web Red Alert — Free Online Real-Time Strategy Game', en: '网页版红色警戒 · 免费在线即时战略' },
    'rts.sub':      { zh: '红警 2 风格的免费网页即时战略游戏：采矿车自动采金搞经济、造兵造建筑推过去、双阵营超级武器定胜负。单机打 AI，难度会随你的连胜自动提升。电脑键鼠和手机触屏都能玩。', en: 'A free browser RTS in the style of Red Alert 2: harvesters mine gold automatically, build an army and push, and settle it with faction super weapons. Fight the AI in single player — difficulty rises with your win streak. Keyboard/mouse and touch both work.' },
    'rts.openNew':  { zh: '↗ 在新窗口打开游戏', en: '↗ Open game in new window' },
    'rts.open3d':   { zh: '🟦 试试 3D 渲染模式', en: '🟦 Try 3D mode' },
    'rts.featuresTitle':{ zh: '🎯 核心特色', en: '🎯 Key Features' },
    'rts.f1':       { zh: '<strong>红警2风格 RTS</strong>：基地建造 + 采矿经济 + 兵种对战 + 双阵营超级武器', en: '<strong>Red Alert 2-style RTS</strong>: base building + mining economy + unit combat + faction super weapons' },
    'rts.f2':       { zh: '<strong>单机打 AI</strong>：你是蓝方盟军，打红方苏军 AI，难度随连胜提升', en: '<strong>Fight the AI</strong>: you play Allied Blue against Soviet Red; difficulty rises with wins' },
    'rts.f3':       { zh: '<strong>自动采矿经济</strong>：采矿车自动往返采金送钱，多造几辆 = 更多收入', en: '<strong>Auto mining</strong>: harvesters shuttle gold automatically — more harvesters, more income' },
    'rts.f4':       { zh: '<strong>8 个兵种</strong>：采矿车/轻坦/重坦/光棱坦克/磁暴坦克/幻影坦克/超时空军团兵/入侵者战机', en: '<strong>8 units</strong>: Harvester, Light Tank, Heavy Tank, Prism Tank, Tesla Tank, Mirage Tank, Chrono Legionnaire, Harrier' },
    'rts.f5':       { zh: '<strong>双阵营超武</strong>：超时空传送仪 / 铁幕装置，战局翻盘利器', en: '<strong>Super weapons</strong>: Chronosphere / Iron Curtain — game-changers' },
    'rts.f6':       { zh: '<strong>PC + 手机</strong>：键鼠和触屏同一套代码都能玩，3D 渲染模式可切换', en: '<strong>PC + mobile</strong>: one codebase for keyboard/mouse and touch, with an optional 3D render mode' },
    'rts.howTitle': { zh: '🕹 玩法说明', en: '🕹 How to Play' },
    'rts.how1':     { zh: '开局你有一套基地 + <strong>2 辆采矿车</strong> + 1 辆轻坦，采矿车自己在赚钱，不用管它', en: 'You start with a base, <strong>2 harvesters</strong> and a light tank; the harvesters mine money on their own' },
    'rts.how2':     { zh: '用<strong>左下角按钮造兵</strong>，攒钱顺序建议：轻坦 → 重坦 → 光棱/磁暴', en: '<strong>Build units</strong> with the bottom-left buttons; suggested order: Light Tank → Heavy Tank → Prism/Tesla' },
    'rts.how3':     { zh: '左键<strong>拖框框选</strong>一片部队；右键点到敌人身上 = 攻击，点到空地 = 移动', en: 'Left-<strong>drag a box</strong> to select units; right-click an enemy to attack, right-click ground to move' },
    'rts.how4':     { zh: '把敌方 AI 的<strong>基地拆掉</strong>就赢；自己的基地被打掉就输', en: '<strong>Win by destroying</strong> the enemy AI base; lose if your own base falls' },
    'rts.how5':     { zh: '选中单位后按 <strong>A</strong> 可强制攻击指定位置（拆建筑清矿场很好用）', en: 'With units selected, press <strong>A</strong> to force-attack a spot (great for demolishing buildings)' },
    'rts.tipTitle': { zh: '💡 小贴士', en: '💡 Tips' },
    'rts.tip':      { zh: '网站版是<strong>单机 AI 对战</strong>，打开即玩、不需要服务器。滚轮缩放、方向键平移视野；地图、建筑、兵种的详细数值见游戏内玩法指南。想试 3D 渲染点上面的「3D 渲染模式」，设备不支持时会自动回退到 2D。', en: 'The site version is <strong>single-player vs AI</strong> — click and play, no server needed. Scroll to zoom, arrows to pan; full unit/building stats are in the in-game guide. Try 3D mode above — it falls back to 2D automatically if unsupported.' }
  };

  /* ===== 语言检测 ===== */
  var I18N_LANG = detectLang();
  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem(LS_KEY); } catch (e) {}
    if (saved === 'zh' || saved === 'en') return saved;
    var nl = String(navigator.language || navigator.userLanguage || '').toLowerCase();
    return nl.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  /* ===== 翻译函数 ===== */
  function t(key, vars) {
    var e = DICT[key];
    if (!e) return key;
    var s = (I18N_LANG in e) ? e[I18N_LANG] : e.zh;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return (k in vars) ? String(vars[k]) : m; });
    return s;
  }

  function setLangAttr() {
    document.documentElement.setAttribute('lang', I18N_LANG === 'zh' ? 'zh-CN' : 'en');
  }

  /* ===== 应用翻译到所有 data-i18n 元素 ===== */
  function applyI18n() {
    var els = document.querySelectorAll('[data-i18n]'), i, el, key, val;
    for (i = 0; i < els.length; i++) {
      el = els[i]; key = el.getAttribute('data-i18n');
      if (!DICT[key]) continue;
      val = (I18N_LANG in DICT[key]) ? DICT[key][I18N_LANG] : DICT[key].zh;
      if (el.tagName === 'META') el.setAttribute('content', val);
      else el.innerHTML = val;
    }
    var og = document.querySelector('meta[property="og:locale"]');
    if (og) og.setAttribute('content', I18N_LANG === 'zh' ? 'zh_CN' : 'en_US');
    setLangAttr();
  }

  /* ===== 语言切换 + 回调 ===== */
  var _cbs = [];
  function onLangChange(fn) { if (typeof fn === 'function') _cbs.push(fn); }

  function switchLang(lang) {
    I18N_LANG = (lang === 'zh') ? 'zh' : 'en';
    try { localStorage.setItem(LS_KEY, I18N_LANG); } catch (e) {}
    setLangAttr();
    applyI18n();
    updateToggle();
    for (var i = 0; i < _cbs.length; i++) { try { _cbs[i](I18N_LANG); } catch (e) {} }
  }

  /* ===== 切换按钮 + CSS 注入 ===== */
  var _btn = null;
  function injectCss() {
    var st = document.createElement('style');
    st.textContent =
      '#i18n-toggle{position:fixed;top:10px;right:10px;z-index:999999999;' +
      'font:12px/1 "Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;padding:8px 12px;' +
      'border-radius:16px;border:1px solid rgba(0,0,0,.15);background:rgba(255,255,255,.94);' +
      'color:#333;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);' +
      'transition:transform .15s;user-select:none;-webkit-user-select:none}' +
      '#i18n-toggle:hover{transform:translateY(-1px)}' +
      '@media(max-width:600px){#i18n-toggle{top:8px;right:8px;padding:7px 10px;font-size:11px}}' +
      /* 避让游戏页 header 右侧统计标签，避免遮挡 */
      'body.i18n-has-toggle header .stats,body.i18n-has-toggle .header .stats,body.i18n-has-toggle header .stat{margin-right:56px}';
    document.head.appendChild(st);
  }
  function updateToggle() {
    if (_btn) _btn.textContent = I18N_LANG === 'zh' ? '🌐 English' : '🌐 中文';
  }
  function createToggle() {
    injectCss();
    document.body.classList.add('i18n-has-toggle');
    _btn = document.createElement('button');
    _btn.type = 'button'; _btn.id = 'i18n-toggle';
    _btn.addEventListener('click', function () { switchLang(I18N_LANG === 'zh' ? 'en' : 'zh'); });
    document.body.appendChild(_btn);
    updateToggle();
  }

  /* ===== 对外 API ===== */
  window._t = t;
  window.I18N = {
    lang: function () { return I18N_LANG; },
    switchLang: switchLang,
    onLangChange: onLangChange,
    t: t
  };

  setLangAttr();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { createToggle(); applyI18n(); });
  } else {
    createToggle(); applyI18n();
  }
})();
