import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [highlightedHTML, setHighlightedHTML] = useState('');
  const [spamWords, setSpamWords] = useState([]);
  const [replacedText, setReplacedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSpam, setCopiedSpam] = useState(false);
  const [copiedReplacedText, setCopiedReplacedText] = useState(false);
  const [highlightedHeight, setHighlightedHeight] = useState('auto');

  const highlightedRef = useRef(null);
  const spamRef = useRef(null);
  const replacedRef = useRef(null);

  const checkSpamAndHighlight = async () => {
    if (!text.trim()) {
      alert('Please enter some text.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('https://spam-words-rewriter-backend.onrender.com/highlight-spam', { text });
      setHighlightedHTML(
        res.data.highlightedText.replace(
          /<mark>/g,
          '<mark style="background-color: #ffcccc; color: black;">'
        )
      );
      setSpamWords(Array.isArray(res.data.spamWords) ? res.data.spamWords : []);
      setReplacedText(res.data.replacedText);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to check spam words.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (highlightedRef.current) {
      setHighlightedHeight(`${highlightedRef.current.clientHeight}px`);
    }
  }, [highlightedHTML]);

  const copyHighlightedEmail = () => {
    if (highlightedRef.current) {
      const range = document.createRange();
      range.selectNodeContents(highlightedRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    }
  };

  const copySpamWords = () => {
    if (spamRef.current) {
      spamRef.current.select();
      document.execCommand('copy');
      setCopiedSpam(true);
      setTimeout(() => setCopiedSpam(false), 1500);
    }
  };

  const copyReplacedText = () => {
    if (replacedRef.current) {
      replacedRef.current.select();
      document.execCommand('copy');
      setCopiedReplacedText(true);
      setTimeout(() => setCopiedReplacedText(false), 1500);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">📧 Spam Words Checker</h1>

      <textarea
        className="input-textarea"
        rows="12"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your email content here..."
      />

      <button className="action-button" onClick={checkSpamAndHighlight} disabled={loading}>
        {loading ? 'Checking...' : 'Highlight Spam Words'}
      </button>

      <div className="output-section">
        <h3>📍 Highlighted Spam Words:</h3>
        <div
          ref={highlightedRef}
          className="highlighted-output"
          style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit' }}
          dangerouslySetInnerHTML={{ __html: highlightedHTML }}
        />
        <button className="copy-button" onClick={copyHighlightedEmail}>
          Copy Highlighted Email
        </button>
        {copiedEmail && <span className="copied-msg">✅ Copied!</span>}
      </div>

      <div className="output-section">
        <h3>🚨 Spam Words Found:</h3>
        {spamWords.length > 0 ? (
          <>
            <textarea
              ref={spamRef}
              className="spam-textarea"
              value={spamWords.join(', ')}
              readOnly
            />
            <button className="copy-button" onClick={copySpamWords}>
              Copy Spam Words
            </button>
            {copiedSpam && <span className="copied-msg">✅ Copied!</span>}
          </>
        ) : (
          <p className="no-spam-message">No spam words detected</p>
        )}
      </div>

      <div className="output-section">
        <h3>🔄 Replaced Text Without Spam Words:</h3>
        <textarea
          ref={replacedRef}
          className="spam-textarea"
          style={{ height: highlightedHeight }}
          value={replacedText}
          readOnly
        />
        <button className="copy-button" onClick={copyReplacedText}>
          Copy Replaced Text
        </button>
        {copiedReplacedText && <span className="copied-msg">✅ Copied!</span>}
      </div>
    </div>
  );
}

export default App;
