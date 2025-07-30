let creatingButton = false;

function createButton(onClick) {
  const button = document.createElement('button');
  button.classList.add('chesskit-button');
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '8px';
  button.style.marginBottom = '10px';
  button.style.padding = '8px 12px';
  button.style.backgroundColor = 'var(--m-secondary_bg--mix-30)';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.addEventListener('mouseenter', () => {
    button.style.filter = 'brightness(1.1)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.filter = 'none';
  });

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  icon.setAttribute('width', '20');
  icon.setAttribute('height', '20');
  icon.setAttribute('viewBox', '0 0 512 512');
  icon.innerHTML = `<path d="M176 48h160M118 304h276M208 48v93.48a64.1 64.1 0 0 1-9.88 34.18L73.21 373.49C48.4 412.78 76.63 464 123.08 464h265.84c46.45 0 74.68-51.22 49.87-90.51L313.87 175.66a64.1 64.1 0 0 1-9.87-34.18V48"/>`;
  icon.style.fill = 'white';
  icon.style.flexShrink = '0';

  const text = document.createElement('span');
  text.textContent = 'Analyze in Chesskit';

  button.appendChild(icon);
  button.appendChild(text);
  button.addEventListener('click', onClick);

  return button;
}

function openChesskitWithPGN(pgn) {
  const msg = {
    type: 'OPEN_CHESSKIT_APP',
    payload: { pgn: pgn, orientation: document.querySelector('.cg-wrap.manipulable.orientation-white') ? 'white' : 'black' }
  };
  chrome.runtime.sendMessage(msg);
}

function insertButtonBeforeCeval(onClick) {
  const cevalEl = document.querySelector('#main-wrap > main > div.analyse__tools > div.ceval');
  if (!cevalEl || cevalEl.previousSibling?.classList?.contains('chesskit-button')) return;
  const button = createButton(onClick);
  cevalEl.parentElement.insertBefore(button, cevalEl);
}

function simulateRealClick(el) {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
    const evt = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });
    el.dispatchEvent(evt);
  });
}

function handleFirstPageType() {
  const el = document.querySelector('#main-wrap > main > div.round__app.variant-standard > div.rcontrols > div > a');

  const button = createButton(async () => {
    const link = document.querySelector('#main-wrap > main > div.round__app.variant-standard > div.rcontrols > div > a');
    const url = link?.href;
    const win = window.open(url, '_blank');
    win.onload = () => {
      const pgnEl = win.document.querySelector('#main-wrap > main > div.analyse__underboard > div.analyse__underboard__panels > div.fen-pgn > div.pgn');
      if (pgnEl) {
        pgn = pgnEl.textContent.trim();
        win.close();
        openChesskitWithPGN(pgn);
      } else {
        win.close();
        console.log('PGN panel not found.');
      }
    };
  });
  button.classList.add('chesskit-button');
  el.parentElement.insertBefore(button, el);
}

function handleSecondPageType() {
  insertButtonBeforeCeval(async () => {
    simulateRealClick(document.querySelector('#main-wrap > main > div.analyse__underboard > div.study__buttons > div > span.share'));
    setTimeout(async () => {
      try {
        const downloadButton = document.querySelector(
          '#main-wrap > main > div.analyse__underboard > div.study__share > div.downloads > a:nth-child(5)'
        );
        if (!downloadButton) {
          alert('Download button not found.');
          return;
        }
        downloadButton.click();
        setTimeout(async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (!text) alert('Clipboard is empty');
            else openChesskitWithPGN(text);
          } catch (err) {
            alert('Failed to read clipboard: ' + err.message);
          }
        }, 300);

      } catch (err) {
        alert('Failed to read clipboard: ' + err.message);
      }
    }, 300);
  });
}

function handleThirdPageType() {
  insertButtonBeforeCeval(() => {
    const pgnEl = document.querySelector(
      '#main-wrap > main > div.analyse__underboard > div.analyse__underboard__panels > div.fen-pgn > div.pgn'
    );
    if (pgnEl) {
      openChesskitWithPGN(pgnEl.textContent.trim());
    } else {
      alert('PGN panel not found.');
    }
  });
}

function detectPageTypeAndInsert() {
  if (document.querySelector('.chesskit-button') || creatingButton) return;
  creatingButton = true;
  if (document.querySelector('#main-wrap > main > div.round__app.variant-standard > div.rcontrols > div > a'))
    handleFirstPageType();
  else if (document.querySelector('#main-wrap > main > div.analyse__underboard > div.study__buttons > div > span.share'))
    handleSecondPageType();
  else if (document.querySelector('#main-wrap > main > div.analyse__controls.analyse-controls'))
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
