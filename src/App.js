import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import './App.css';

function App() {
  const [richText, setRichText] = useState('');
  const [htmlText, setHtmlText] = useState('');
  const [highlightedHTML, setHighlightedHTML] = useState('');
  const [spamWords, setSpamWords] = useState([]);
  const [replacedContent, setReplacedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSpam, setCopiedSpam] = useState(false);
  const [copiedReplacedText, setCopiedReplacedText] = useState(false);
  const [highlightedHeight, setHighlightedHeight] = useState('auto');
  const [inputMethod, setInputMethod] = useState('editor');

  const highlightedRef = useRef(null);
  const spamRef = useRef(null);
  const replacedRef = useRef(null);
  const htmlTextareaRef = useRef(null);

  const checkSpamAndHighlight = async () => {
    const contentToCheck = inputMethod === 'editor' ? richText : htmlText;
    
    if (!contentToCheck.trim()) {
      alert('Please enter some text.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('https://spam-words-rewriter-backend.onrender.com/highlight-spam', { 
        text: contentToCheck,
        isHtml: true // Always treat as HTML since both inputs are HTML now
      });

      setHighlightedHTML(res.data.highlightedHtml);
      setReplacedContent(res.data.replacedHtml);
      setSpamWords(Array.isArray(res.data.spamWords) ? res.data.spamWords : []);
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
      const range = document.createRange();
      range.selectNodeContents(replacedRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('copy');
      setCopiedReplacedText(true);
      setTimeout(() => setCopiedReplacedText(false), 1500);
    }
  };

  const handleHtmlPaste = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) {
      setHtmlText(html);
    } else {
      const text = e.clipboardData.getData('text/plain');
      setHtmlText(text);
    }
  };

  const copyHTML = (content, setCopiedState) => {
    if (content) {
      navigator.clipboard.writeText(content)
        .then(() => {
          setCopiedState(true);
          setTimeout(() => setCopiedState(false), 1500);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          // Fallback for browsers that don't support clipboard API
          const textarea = document.createElement('textarea');
          textarea.value = content;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          setCopiedState(true);
          setTimeout(() => setCopiedState(false), 1500);
        });
    }
  };

  return (
  <div className="app-container">
    <h1 className="title">Spam Words Checker</h1>

    <div className="input-method-selector">
      <button 
        className={`method-button ${inputMethod === 'editor' ? 'active' : ''}`}
        onClick={() => setInputMethod('editor')}
      >
        Rich Text Editor
      </button>
      <button 
        className={`method-button ${inputMethod === 'html' ? 'active' : ''}`}
        onClick={() => setInputMethod('html')}
      >
        HTML Paste
      </button>
    </div>

    {inputMethod === 'editor' ? (
      <div className="editor-container">
        <CKEditor
          editor={ClassicEditor}
          data={richText}
          onChange={(event, editor) => {
            const data = editor.getData();
            setRichText(data);
          }}
          config={{
            toolbar: [
              'heading', '|',
              'bold', 'italic', 'bulletedList', 'numberedList', '|',
              'undo', 'redo'
            ],
            placeholder: 'Type or paste your content here...',
          }}
        />
      </div>
    ) : (
      <div className="html-paste-container">
        <textarea
          ref={htmlTextareaRef}
          className="html-textarea"
          rows="12"
          value={htmlText}
          onChange={(e) => setHtmlText(e.target.value)}
          onPaste={handleHtmlPaste}
          placeholder="Paste HTML content here (Ctrl+V)..."
        />
        <div className="html-preview" dangerouslySetInnerHTML={{ __html: htmlText }} />
      </div>
    )}

    <button className="action-button" onClick={checkSpamAndHighlight} disabled={loading}>
      {loading ? 'Checking...' : 'Highlight Spam Words'}
    </button>

    <div className="output-section">
      <div className="section-header">
        <h3>📍 Highlighted Spam Words:</h3>
        <div className="copy-buttons">
          <button 
            className="copy-button" 
            onClick={() => copyHTML(highlightedHTML, setCopiedEmail)}
          >
            Copy HTML
          </button>
          <button 
            className="copy-button copy-button-visual" 
            onClick={copyHighlightedEmail}
          >
            Copy Visual
          </button>
        </div>
      </div>
      {copiedEmail && <span className="copied-msg">✅ Copied!</span>}
      <div
        ref={highlightedRef}
        className="highlighted-output"
        dangerouslySetInnerHTML={{ __html: highlightedHTML }}
      />
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
      <div className="section-header">
        <h3>🔄 Replaced Text Without Spam Words:</h3>
        <div className="copy-buttons">
          <button 
            className="copy-button" 
            onClick={() => copyHTML(replacedContent, setCopiedReplacedText)}
          >
            Copy HTML
          </button>
          <button 
            className="copy-button copy-button-visual" 
            onClick={copyReplacedText}
          >
            Copy Visual
          </button>
        </div>
      </div>
      {copiedReplacedText && <span className="copied-msg">✅ Copied!</span>}
      <div
        ref={replacedRef}
        className="replaced-output"
        dangerouslySetInnerHTML={{ __html: replacedContent }}
      />
    </div>
  </div>
);
}

export default App;
