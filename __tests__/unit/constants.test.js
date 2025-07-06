// Simple test to verify constants are correctly defined
import * as constants from '../../js/constants.js';

describe('Constants', () => {
  test('TTS server address should be defined', () => {
    expect(constants.TTS_SERVER_ADDRESS).toBeDefined();
    expect(constants.TTS_SERVER_ADDRESS).toContain('http://');
  });
  
  test('GIB server address should be defined', () => {
    expect(constants.GIB_SERVER_ADDRESS).toBeDefined();
    expect(constants.GIB_SERVER_ADDRESS).toContain('http://');
  });

  test('VOX command constants should be defined', () => {
    expect(constants.VOX_CMD_CUT).toBeDefined();
    expect(constants.VOX_CMD_COPY).toBeDefined();
    expect(constants.VOX_CMD_PASTE).toBeDefined();
  });

  test('Search URLs should be defined', () => {
    expect(constants.SEARCH_URL_GOOGLE).toBeDefined();
    expect(constants.SEARCH_URL_DDG).toBeDefined();
    expect(constants.SEARCH_URL_PHIND).toBeDefined();
    expect(constants.SEARCH_URL_PERPLEXITY).toBeDefined();
    expect(constants.SEARCH_URL_GOOGLE_SCHOLAR).toBeDefined();
  });
});