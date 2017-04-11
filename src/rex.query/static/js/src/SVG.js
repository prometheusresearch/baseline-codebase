/**
 * @flow
 */

export function rasterize(
  svg: string,
  size: {width: number, height: number},
): Promise<?string> {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const canvasCtx = canvas.getContext('2d');

  if (canvasCtx == null) {
    return Promise.resolve(null);
  }

  const img = document.createElement('img');
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(svg));

  return new Promise(resolve => {
    img.onload = () => {
      canvasCtx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

export function rasterizeElement(element: HTMLElement): Promise<?string> {
  const {width, height} = element.getBoundingClientRect();
  const data = new XMLSerializer().serializeToString(element);
  return rasterize(data, {width, height});
}
