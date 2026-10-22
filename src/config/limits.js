export const MAX_MOVIE_ID = 2_147_483_647;
export const MAX_FUNDING_ID = 9_223_372_036_854_775_807n;
export const MAX_FUNDING_AMOUNT = MAX_FUNDING_ID;

export const MOVIE_LIST_LIMIT = Object.freeze({ default: 20, max: 50 });
export const COMMENT_LIST_LIMIT = Object.freeze({ default: 10, max: 10 });
export const COMPARISON_COUNT = Object.freeze({ min: 2, max: 5 });
export const FUNDING_NICKNAME_MAX_LENGTH = 8;
export const COMMENT_MAX_LENGTH = 100;
export const PASSWORD_LENGTH = Object.freeze({ min: 8, max: 12 });
export const RANDOM_CURSOR_SEED_RANGE = 1_000_000_000;
