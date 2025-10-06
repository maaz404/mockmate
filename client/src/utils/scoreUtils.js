import { classifyScore, getScoreFg, getScoreBg } from "../design-system/tokens";

export const scoreLabel = (score) => classifyScore(score).text;
export const scoreFgClass = (score) => getScoreFg(score);
export const scoreBgClass = (score) => getScoreBg(score);
