import { WindowPane, CutPiece, CutStrip, CutSheet } from "./types";

const OVERLAP = 1; // extra inch per piece for overlap/trimming

function toPiece(w: WindowPane, rollWidth: number): CutPiece {
  const pw = w.width + OVERLAP;
  const ph = w.height + OVERLAP;
  const fits = pw <= rollWidth;
  const fitsRotated = ph <= rollWidth;

  if (!fits && fitsRotated) {
    return {
      windowId: w.id,
      windowName: w.name,
      pieceWidth: ph,
      pieceHeight: pw,
      rotated: true,
      quantity: w.quantity,
    };
  }
  return {
    windowId: w.id,
    windowName: w.name,
    pieceWidth: pw,
    pieceHeight: ph,
    rotated: false,
    quantity: w.quantity,
  };
}

export function buildCutSheet(windows: WindowPane[], materialWidth: 60 | 72): CutSheet {
  // Expand by quantity into individual pieces
  const allPieces: CutPiece[] = [];
  for (const w of windows) {
    const piece = toPiece(w, materialWidth);
    for (let i = 0; i < w.quantity; i++) {
      allPieces.push({ ...piece, quantity: 1 });
    }
  }

  // Sort descending by height (longest cuts first)
  allPieces.sort((a, b) => b.pieceHeight - a.pieceHeight);

  // Greedy strip packing
  const strips: CutStrip[] = [];

  for (const piece of allPieces) {
    // Try to fit in an existing strip with the same height
    const compatible = strips.find(
      (s) =>
        Math.abs(s.stripLength - piece.pieceHeight) < 0.5 &&
        s.usedWidth + piece.pieceWidth <= materialWidth
    );
    if (compatible) {
      compatible.pieces.push({ piece, xOffset: compatible.usedWidth });
      compatible.usedWidth += piece.pieceWidth;
      compatible.wasteWidth = materialWidth - compatible.usedWidth;
    } else {
      strips.push({
        stripLength: piece.pieceHeight,
        pieces: [{ piece, xOffset: 0 }],
        usedWidth: piece.pieceWidth,
        wasteWidth: materialWidth - piece.pieceWidth,
      });
    }
  }

  const totalLengthIn = strips.reduce((sum, s) => sum + s.stripLength, 0);
  const usedAreaIn2 = allPieces.reduce((sum, p) => sum + p.pieceWidth * p.pieceHeight, 0);
  const totalAreaIn2 = totalLengthIn * materialWidth;

  return {
    materialWidth,
    totalLength: totalLengthIn,
    totalLengthFt: totalLengthIn / 12,
    strips,
    totalSqFt: usedAreaIn2 / 144,
    totalLinFt: totalLengthIn / 12,
    efficiency: totalAreaIn2 > 0 ? (usedAreaIn2 / totalAreaIn2) * 100 : 0,
  };
}

export function calcWindowSqFt(windows: WindowPane[]): number {
  return windows.reduce((sum, w) => sum + (w.width * w.height * w.quantity) / 144, 0);
}
