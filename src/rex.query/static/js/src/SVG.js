/**
 * @flow
 */

import {TextEncoderLite as TextEncoder} from './vendor/TextEncoderLite';
import {fromByteArray} from 'base64-js';

type RasterizeConfig = {
  width: number,
  height: number,
  font?: string,
};

function utoa(string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(string);
  return fromByteArray(bytes);
}

export function rasterize(svg: string, config: RasterizeConfig): Promise<?string> {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;

  const canvasCtx = canvas.getContext('2d');

  if (canvasCtx == null) {
    return Promise.resolve(null);
  }

  if (config.font != null) {
    canvasCtx.font = config.font;
  }

  const img = document.createElement('img');
  img.setAttribute('src', 'data:image/svg+xml;base64,' + utoa(svg));

  return new Promise(resolve => {
    img.onload = () => {
      canvasCtx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

type RasterizeElementConfig = {
  font?: string,
};

export function rasterizeElement(
  element: HTMLElement,
  config?: RasterizeElementConfig = {},
): Promise<?string> {
  const {width, height} = element.getBoundingClientRect();
  const data = new XMLSerializer().serializeToString(element);
  return rasterize(data, {...config, width, height});
}
