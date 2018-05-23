/**
 * @flow
 */

import {TextEncoderLite as TextEncoder} from './vendor/TextEncoderLite';
import {fromByteArray} from 'base64-js';

type RasterizeConfig = {
  font?: string,
  dx?: number,
  dy?: number,
};

function utoa(string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(string);
  return fromByteArray(bytes);
}

export function renderToCanvas(
  svg: string,
  canvasCtx: CanvasRenderingContext2D,
  config: RasterizeConfig,
): Promise<?string> {
  if (config.font != null) {
    canvasCtx.font = config.font;
  }

  const img = document.createElement('img');
  img.setAttribute('src', 'data:image/svg+xml;base64,' + utoa(svg));

  return new Promise(resolve => {
    img.onload = () => {
      canvasCtx.drawImage(img, config.dx || 0, config.dy || 0);
      resolve();
    };
  });
}
