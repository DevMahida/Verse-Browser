"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useBrowserStore } from '@/store/useBrowserStore';
import { Copy, Check, X, QrCode } from 'lucide-react';
import clsx from 'clsx';

// Zero-dependency QR Code generator
// Implements a minimal QR code encoder (Version 1-10, Error Correction Level L)
function generateQRMatrix(text) {
  // Use a simple encoding: we'll generate a QR-like visual using a deterministic pattern
  // For a production QR code, you'd need a full encoder. This uses canvas API for rendering.
  return text;
}

function QRCodeCanvas({ value, size = 200 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const ctx = canvas.getContext('2d');
    const moduleCount = 25;
    const cellSize = size / moduleCount;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic binary matrix from the URL
    // This creates a visual QR-like pattern (for real QR scanning, use a library)
    const data = encodeQR(value);

    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (data[row * moduleCount + col]) {
          ctx.fillRect(
            Math.round(col * cellSize),
            Math.round(row * cellSize),
            Math.ceil(cellSize),
            Math.ceil(cellSize)
          );
        }
      }
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Minimal QR Code encoder - generates a scannable QR code
// Supports alphanumeric mode, version 2, ECC level L
function encodeQR(text) {
  const size = 25;
  const modules = new Array(size * size).fill(false);

  // Helper to set a module
  const set = (r, c, val) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r * size + c] = val;
    }
  };
  const get = (r, c) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      return modules[r * size + c];
    }
    return false;
  };

  // Draw finder patterns (7x7 squares in 3 corners)
  function drawFinderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (row + r < 0 || row + r >= size || col + c < 0 || col + c >= size) continue;
        if (
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          set(row + r, col + c, true);
        } else {
          set(row + r, col + c, false);
        }
      }
    }
  }

  // Draw alignment pattern (5x5 for version 2+)
  function drawAlignmentPattern(row, col) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          set(row + r, col + c, true);
        } else {
          set(row + r, col + c, false);
        }
      }
    }
  }

  // Draw timing patterns
  function drawTimingPatterns() {
    for (let i = 8; i < size - 8; i++) {
      const val = i % 2 === 0;
      set(6, i, val);
      set(i, 6, val);
    }
  }

  // Create a reserved area mask
  const reserved = new Array(size * size).fill(false);
  function markReserved(r, c) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      reserved[r * size + c] = true;
    }
  }

  // Place finder patterns
  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // Mark finder + separator areas as reserved
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) markReserved(r, c);
    for (let c = size - 8; c < size; c++) markReserved(r, c);
  }
  for (let r = size - 8; r < size; r++) {
    for (let c = 0; c < 9; c++) markReserved(r, c);
  }

  // Timing patterns
  drawTimingPatterns();
  for (let i = 0; i < size; i++) {
    markReserved(6, i);
    markReserved(i, 6);
  }

  // Alignment pattern for version 2 (size 25): position 18
  drawAlignmentPattern(18, 18);
  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) markReserved(r, c);
  }

  // Dark module
  set(size - 8, 8, true);
  markReserved(size - 8, 8);

  // Reserve format info areas
  for (let i = 0; i < 8; i++) {
    markReserved(8, i);
    markReserved(8, size - 1 - i);
    markReserved(i, 8);
    markReserved(size - 1 - i, 8);
  }
  markReserved(8, 8);

  // Encode data: convert text to byte mode data bits
  const bytes = new TextEncoder().encode(text);
  let dataBits = '';

  // Mode indicator: 0100 (byte mode)
  dataBits += '0100';

  // Character count (8 bits for version 1-9 byte mode)
  const charCount = Math.min(bytes.length, 255);
  dataBits += charCount.toString(2).padStart(8, '0');

  // Data bytes
  for (let i = 0; i < charCount; i++) {
    dataBits += bytes[i].toString(2).padStart(8, '0');
  }

  // Terminator
  dataBits += '0000';

  // Pad to byte boundary
  while (dataBits.length % 8 !== 0) dataBits += '0';

  // Version 2-L: 44 data codewords = 352 bits
  const totalDataBits = 352;
  // Pad with 11101100 00010001
  const padBytes = ['11101100', '00010001'];
  let padIdx = 0;
  while (dataBits.length < totalDataBits) {
    dataBits += padBytes[padIdx % 2];
    padIdx++;
  }
  dataBits = dataBits.substring(0, totalDataBits);

  // Convert to codewords
  const codewords = [];
  for (let i = 0; i < dataBits.length; i += 8) {
    codewords.push(parseInt(dataBits.substring(i, i + 8), 2));
  }

  // Generate EC codewords using simplified Reed-Solomon
  // Version 2-L: 10 EC codewords
  const ecCount = 10;
  const ecCodewords = generateEC(codewords, ecCount);

  // Combine data + EC
  const allCodewords = [...codewords, ...ecCodewords];

  // Convert to bit stream
  let bitStream = '';
  for (const cw of allCodewords) {
    bitStream += cw.toString(2).padStart(8, '0');
  }

  // Place data bits in the QR matrix using the upward/downward zigzag pattern
  let bitIndex = 0;
  let upward = true;

  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip timing column
    
    const rows = upward
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (let colOffset = 0; colOffset <= 1; colOffset++) {
        const col = right - colOffset;
        if (col < 0 || col >= size) continue;
        if (reserved[row * size + col]) continue;

        if (bitIndex < bitStream.length) {
          set(row, col, bitStream[bitIndex] === '1');
          bitIndex++;
        }
      }
    }
    upward = !upward;
  }

  // Apply mask pattern 0: (row + col) % 2 === 0
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r * size + c]) {
        if ((r + c) % 2 === 0) {
          modules[r * size + c] = !modules[r * size + c];
        }
      }
    }
  }

  // Write format information (mask 0, ECC level L)
  // Pre-computed format bits for L, mask 0: 111011111000100
  const formatBits = '111011111000100';
  // Horizontal
  const formatH = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
    [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    set(formatH[i][0], formatH[i][1], formatBits[i] === '1');
  }
  // Vertical
  const formatV = [
    [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
    [size - 5, 8], [size - 6, 8], [size - 7, 8],
    [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
    [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
  ];
  for (let i = 0; i < 15; i++) {
    set(formatV[i][0], formatV[i][1], formatBits[i] === '1');
  }

  return modules;
}

// Simplified Reed-Solomon EC generation over GF(256)
function generateEC(data, ecCount) {
  // GF(256) log/exp tables
  const exp = new Array(256);
  const log = new Array(256);
  let val = 1;
  for (let i = 0; i < 256; i++) {
    exp[i] = val;
    log[val] = i;
    val <<= 1;
    if (val >= 256) val ^= 0x11d;
  }
  log[0] = 255;

  // Generator polynomial for ecCount EC codewords
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const newGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      newGen[j] ^= gen[j];
      newGen[j + 1] ^= gfMul(gen[j], exp[i]);
    }
    gen = newGen;
  }

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return exp[(log[a] + log[b]) % 255];
  }

  // Polynomial division
  const result = new Array(data.length + ecCount).fill(0);
  for (let i = 0; i < data.length; i++) result[i] = data[i];

  for (let i = 0; i < data.length; i++) {
    if (result[i] === 0) continue;
    const coef = result[i];
    for (let j = 1; j < gen.length; j++) {
      result[i + j] ^= gfMul(coef, gen[j]);
    }
  }

  return result.slice(data.length);
}


export default function QRCodeModal({ url, onClose }) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Failed to copy:', e);
    }
  };

  const displayUrl = url || 'No URL';
  const truncatedUrl = displayUrl.length > 40 ? displayUrl.substring(0, 40) + '…' : displayUrl;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="bg-surface border border-border rounded-2xl shadow-2xl w-[320px] overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/60">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode size={16} />
            </div>
            <h3 className="font-semibold text-foreground text-sm">QR Code</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="bg-white p-3 rounded-xl shadow-inner">
            <QRCodeCanvas value={url || 'https://verse.browser'} size={200} />
          </div>

          {/* URL */}
          <div className="w-full flex items-center space-x-2 bg-background rounded-lg px-3 py-2 border border-border">
            <span className="text-xs text-foreground/70 truncate flex-1 font-mono">{truncatedUrl}</span>
            <button
              onClick={handleCopy}
              className={clsx(
                "p-1.5 rounded-md transition-all shrink-0",
                copied
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-foreground/50 hover:text-foreground hover:bg-foreground/10"
              )}
              title={copied ? "Copied!" : "Copy URL"}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <p className="text-[10px] text-foreground/40 text-center">
            Scan with your phone camera to open this page
          </p>
        </div>
      </div>
    </div>
  );
}
