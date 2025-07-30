let creatingButton = false;

function createButton(onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cc-button-component cc-button-primary cc-button-xx-large cc-bg-primary cc-button-full chesskit-button';
  button.setAttribute('download', '');
  button.setAttribute('target', '_blank');
  button.style.marginTop = '12px';
  button.innerHTML = `<br/>
    <span class="cc-icon-glyph cc-icon-medium cc-button-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="28.75" height="28.75" viewBox="0 0 512 512"><path d="M176 48h160M118 304h276M208 48v93.48a64.1 64.1 0 0 1-9.88 34.18L73.21 373.49C48.4 412.78 76.63 464 123.08 464h265.84c46.45 0 74.68-51.22 49.87-90.51L313.87 175.66a64.1 64.1 0 0 1-9.87-34.18V48"/></svg>
    </span>
    <span>Analyze in Chesskit</span>
  `;
  button.addEventListener('click', onClick);
  return button;
}

function openChesskitWithPGN(pgn) {
  let orientation = 'white';
  const board = document.querySelector('wc-chess-board.board');
  if (board) {
    orientation = board.classList.contains('flipped') ? 'black' : 'white';
  }
  const msg = {
    type: 'OPEN_CHESSKIT_APP',
    payload: { pgn: pgn, orientation: orientation }
  };
  chrome.runtime.sendMessage(msg);
}

function capturePgn(shareLinkSelector) {
  const textareaSelector = '[id^="share-"] > div > div.cc-modal-body.cc-modal-sm > div > section > div > div:nth-child(2) > div.share-menu-tab-pgn-pgn-wrapper > textarea';
  const tabPgnSelector = '#tab-pgn';
  const closeModalSelector = '#share-modal > div > div.cc-modal-body.cc-modal-sm > header > button';

  document.querySelector(shareLinkSelector).click();

  const waitForTabPgn = setInterval(() => {
    tabPgnButton = document.querySelector(tabPgnSelector);
    if (tabPgnButton) {
      clearInterval(waitForTabPgn);
      tabPgnButton.click();
      const waitForTextarea = setInterval(() => {
        textarea = document.querySelector(textareaSelector);
        if (textarea) {
          clearInterval(waitForTextarea);
          const pgn = textarea.value;
          document.querySelector(closeModalSelector).click();
          openChesskitWithPGN(pgn);
        }
      }, 100);
    }
  }, 100);
}

function handleFirstPageType() {
  const el = document.querySelector('div.game-review-buttons-component > a');
  const btn = createButton(async () => {
    capturePgn('#board-layout-sidebar > div.sidebar-component > div.live-game-buttons-component > button.icon-font-chess.share.live-game-buttons-button');
  });
  el.insertAdjacentElement('afterend', btn);
}

function handleSecondPageType() {
  const el = document.querySelector('div.game-controls-primary-component');
  const btn = createButton(async () => {
    capturePgn('#board-layout-sidebar > div > div > div.game-controls-view-component > div.game-controls-secondary-component > div:nth-child(2) > button:nth-child(5)');
  });
  el.insertAdjacentElement('afterend', btn);
}

function handleThirdPageType() {
  const el = document.querySelector('div.game-sidebar-footer-component');
  const btn = createButton(async () => {
    capturePgn('#board-layout-sidebar > div > div.game-sidebar-footer-component > div.game-buttons-component.game-sidebar-footer-game-buttons > button:nth-child(4)');
  });
  el.insertAdjacentElement('beforebegin', btn);
}

function detectPageTypeAndInsert() {
  if (document.querySelector('.chesskit-button') || creatingButton) return;
  creatingButton = true;
  if (document.querySelector('div.game-review-buttons-component > a'))
    handleFirstPageType();
  else if (document.querySelector('div.game-controls-primary-component'))
    handleSecondPageType();
  else if (document.querySelector('div.game-sidebar-footer-component'))
    handleThirdPageType();
  creatingButton = false;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectPageTypeAndInsert);
} else {
  detectPageTypeAndInsert();
}

const observer = new MutationObserver(() => {
  detectPageTypeAndInsert();
});
observer.observe(document.body, { childList: true, subtree: true });
