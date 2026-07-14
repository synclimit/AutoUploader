/**
 * Deterministic Local SEO Analyzer for Raynz PitStop
 * Calculates stable metrics based purely on text content.
 */

export const analyzeSEO = (metadata, keyword = "") => {
  const { title = "", description = "", tags = "" } = metadata;
  const kw = keyword.toLowerCase().trim();

  // 1. Title Analysis
  const titleLen = title.length;
  const titleLower = title.toLowerCase();
  
  let keywordPos = -1;
  let duplicateKeyword = false;
  if (kw) {
    keywordPos = titleLower.indexOf(kw);
    const kwMatches = titleLower.split(kw).length - 1;
    duplicateKeyword = kwMatches > 1;
  }
  
  // Emoji regex
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = title.match(emojiRegex);
  const emojiCount = emojis ? emojis.length : 0;
  
  const uppercaseCount = title.replace(/[^A-Z]/g, "").length;
  const lettersCount = title.replace(/[^a-zA-Z]/g, "").length;
  const uppercaseRatio = lettersCount > 0 ? (uppercaseCount / lettersCount) * 100 : 0;

  const titleAnalysis = {
    character_length: titleLen,
    keyword_position: keywordPos !== -1 ? (keywordPos < 15 ? 'Excellent (Front-loaded)' : 'Good') : 'Missing',
    duplicate_keyword: duplicateKeyword,
    emoji_count: emojiCount,
    uppercase_ratio: Math.round(uppercaseRatio)
  };

  // 2. Description Analysis
  const descLen = description.length;
  const descLower = description.toLowerCase();
  
  const keywordPresence = kw ? descLower.includes(kw) : false;
  const hasCTA = /(subscribe|like|comment|follow|check out|link below)/i.test(description);
  
  const hashtagMatches = description.match(/#[\w]+/g);
  const hashtagCount = hashtagMatches ? hashtagMatches.length : 0;
  
  const urlMatches = description.match(/https?:\/\/[^\s]+/g);
  const urlCount = urlMatches ? urlMatches.length : 0;

  const descriptionAnalysis = {
    character_count: descLen,
    keyword_presence: keywordPresence,
    cta_detection: hasCTA,
    hashtag_count: hashtagCount,
    url_count: urlCount
  };

  // 3. Tags Analysis
  const tagsArray = typeof tags === 'string' 
    ? tags.split(',').map(t => t.trim()).filter(Boolean)
    : (Array.isArray(tags) ? tags : []);
    
  const totalTags = tagsArray.length;
  const uniqueTags = new Set(tagsArray.map(t => t.toLowerCase()));
  const duplicateTags = totalTags - uniqueTags.size;
  
  let keywordCoverage = false;
  if (kw) {
    keywordCoverage = tagsArray.some(t => t.toLowerCase().includes(kw));
  }
  
  // Long-tail = more than 2 words
  const longTailCount = tagsArray.filter(t => t.split(' ').length >= 3).length;
  const longTailPercentage = totalTags > 0 ? (longTailCount / totalTags) * 100 : 0;

  const tagsAnalysis = {
    total_tags: totalTags,
    duplicate_tags: duplicateTags,
    keyword_coverage: keywordCoverage,
    long_tail_percentage: Math.round(longTailPercentage)
  };

  return {
    title: titleAnalysis,
    description: descriptionAnalysis,
    tags: tagsAnalysis
  };
};
