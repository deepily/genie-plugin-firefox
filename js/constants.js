export const TTS_SERVER = "http://127.0.0.1:5002";
export const GIB_SERVER = "http://127.0.0.1:7999";

export const EDITOR_URL = "http://127.0.0.1:8080/genie-plugin-firefox/html/editor-quill.html";
export const CONSTANTS_URL = "http://127.0.0.1:8080/genie-plugin-firefox/js/constants.js";
export const GOOGLE_SEARCH_URL = "https://www.google.com/search";
export const DDG_SEARCH_URL = "https://www.duckduckgo.com/";

export const ZOOM_INCREMENT = 0.075;
export const MAX_ZOOM = 5;
export const MIN_ZOOM = 0.3;
export const DEFAULT_ZOOM = 1;

export const CMD_SEARCH_DDG     = "search";
export const CMD_SEARCH_GOOGLE  = "search google";
export const VOX_CMD_SEARCH_DDG_CLIPBOARD    = "search using clipboard";
export const VOX_CMD_SEARCH_GOOGLE_CLIPBOARD = "search google using clipboard";
export const VOX_CMD_CUT            = "cut";
export const VOX_CMD_COPY           = "copy";
export const VOX_CMD_PASTE          = "paste";
export const VOX_CMD_DELETE         = "delete";
export const VOX_CMD_SELECT_ALL     = "select all";
export const VOX_EDIT_COMMANDS      = [ VOX_CMD_CUT, VOX_CMD_COPY, VOX_CMD_PASTE, VOX_CMD_DELETE, VOX_CMD_SELECT_ALL ];

export const VOX_CMD_TAB_CLOSE      = "close this tab";
export const VOX_CMD_TAB_BACK       = "backward";
export const VOX_CMD_TAB_FORWARD    = "forward";
export const VOX_CMD_TAB_REFRESH    = "refresh";
export const CMD_OPEN_NEW_TAB       = "open new tab";
export const VOX_TAB_COMMANDS       = [ VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_CLOSE, CMD_OPEN_NEW_TAB ];

export const VOX_CMD_OPEN_EDITOR    = "open editor";

export const VOX_CMD_PROOFREAD      = "proofread";
export const VOX_CMD_VIEW_CONSTANTS = "view constan";

export const MULTIMODAL_EDITOR  = "multimodal editor";
export const COMMAND_MODE       = "command"
export const TRANSCRIPTION_MODE = "transcription"