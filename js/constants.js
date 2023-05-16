export const VOX_CMD_CUT            = "cut";
export const VOX_CMD_COPY           = "copy";
export const VOX_CMD_PASTE          = "paste from clipboard";
export const VOX_CMD_DELETE         = "delete";
export const VOX_CMD_SELECT_ALL     = "select all";
export const VOX_EDIT_COMMANDS   = [ VOX_CMD_CUT, VOX_CMD_COPY, VOX_CMD_PASTE, VOX_CMD_DELETE, VOX_CMD_SELECT_ALL ];

export const VOX_CMD_TAB_CLOSE      = "close this tab";
export const VOX_CMD_TAB_BACK       = "backward";
export const VOX_CMD_TAB_FORWARD    = "forward";
export const VOX_CMD_TAB_REFRESH    = "refresh";
export const VOX_CMD_OPEN_NEW_TAB   = "open new tab";
export const VOX_TAB_COMMANDS    = [ VOX_CMD_TAB_BACK, VOX_CMD_TAB_FORWARD, VOX_CMD_TAB_REFRESH, VOX_CMD_TAB_CLOSE, VOX_CMD_OPEN_NEW_TAB ];

export const VOX_CMD_OPEN_EDITOR    = "open editor";
export const VOX_CMD_OPEN_URL_BUCKET= "open url bucket";
export const VOX_CMD_PROOFREAD      = "proofread";
export const VOX_CMD_PROOFREAD_STEM = "proof";
export const VOX_CMD_VIEW_CONSTANTS = "view constan";

export const VOX_CMD_ZOOM_IN        = "zoom"
export const VOX_CMD_ZOOM_OUT       = "zoom out";
export const VOX_CMD_ZOOM_RESET     = "zoom reset"

export const VOX_CMD_MODE_RESET     = "reset";
export const VOX_CMD_MODE_EXIT      = "exit";

export const VOX_CMD_SEARCH_DDG              = "search";
export const VOX_CMD_SEARCH_GOOGLE           = "search google";
export const VOX_CMD_SEARCH_GOOGLE_SCHOLAR   = "search google scholar";
export const VOX_CMD_SEARCH_CLIPBOARD_DDG    = "search using clipboard";
export const VOX_CMD_SEARCH_CLIPBOARD_GOOGLE = "search google using clipboard";

export const MULTIMODAL_CONTACT_INFO  = "multimodal contact information";
export const MULTIMODAL_TEXT_PYTHON   = "multimodal python punctuation";
export const MULTIMODAL_TEXT_EMAIL    = "multimodal text email"
export const STEM_MULTIMODAL_EDITOR   = "multimodal editor";
export const STEM_MULTIMODAL_AI_FETCH = "multimodal ai fetch"
export const MODE_TRANSCRIPTION       = "transcription"
export const MODE_COMMAND             = "command"

export const TTS_SERVER_ADDRESS        = "http://127.0.0.1:5002";
export const GIB_SERVER_ADDRESS        = "http://127.0.0.1:7999";

export const EDITOR_URL                = "http://127.0.0.1:8080/genie-plugin-firefox/html/editor-quill.html";
export const BUCKET_URL                = "http://127.0.0.1:8080/genie-plugin-firefox/html/blank.html";
export const CONSTANTS_URL             = "http://127.0.0.1:8080/genie-plugin-firefox/js/constants.js";
export const SEARCH_URL_GOOGLE         = "https://www.google.com/search";
export const SEARCH_URL_GOOGLE_SCHOLAR = "https://scholar.google.com/scholar"
export const SEARCH_URL_DDG            = "https://www.duckduckgo.com/";

export const ZOOM_INCREMENT = 0.075;
export const ZOOM_MAX       = 5;
export const ZOOM_MIN       = 0.3;
export const ZOOM_DEFAULT   = 1;