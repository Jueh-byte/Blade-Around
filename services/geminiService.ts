// Local quote service - No API Key required!
// This is safer for client-side games and has zero cost/latency.

const JIUMOZHI_QUOTES = {
  lowScore: [
    "能和小僧打成平手，世上没有几人... 但你显然不是其中之一。",
    "你的内力如此浅薄，练什么武功都是白费！",
    "这就倒下了？小僧还没使出火焰刀的三成火候！",
    "北乔峰南慕容？哼，我看你连丐帮的一袋弟子都不如！",
    "以你的资质，便是去少林寺烧火，怕是也嫌太慢。",
    "真是井底之蛙，不知天高地厚！",
  ],
  mediumScore: [
    "有点意思，你的招式中竟然依稀有少林七十二绝技的影子。",
    "不错，能接小僧几招，你在中原武林也算排得上号了。",
    "天龙寺的六脉神剑也不过如此，你的剑法倒有几分火候。",
    "小僧看你骨骼惊奇，不如把你的武功秘籍交出来，小僧指点你一二？",
    "虽比不上乔峰，但也算是一条好汉。",
  ],
  highScore: [
    "妙极！妙极！世间竟然还有如此精妙的武学！",
    "佩服！除了乔峰，你是第二个让小僧感到棘手的对手！",
    "你的修为已臻化境，小僧这火焰刀竟然奈何不了你！",
    "没想到中原武林藏龙卧虎，小僧今日算是开了眼界！",
    "这般身手，怕是连扫地僧也要让你三分！",
  ]
};

export const getMartialArtsWisdom = async (score: number, level: number): Promise<string> => {
  // Simulate a short delay to make it feel like "meditating"
  await new Promise(resolve => setTimeout(resolve, 600));

  let pool = JIUMOZHI_QUOTES.lowScore;

  if (score > 2000) {
    pool = JIUMOZHI_QUOTES.highScore;
  } else if (score > 500) {
    pool = JIUMOZHI_QUOTES.mediumScore;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};