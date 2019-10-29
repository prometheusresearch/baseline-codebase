/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    let error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
}

function parseJSON(response) {
  return response.json();
}

export function getJson(url) {
  return fetch(url, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json"
    }
  })
    .then(checkStatus)
    .then(parseJSON);
}

export function post(url, data) {
  let body = new FormData();
  Object.keys(data).forEach(key => {
    body.append(key, data[key]);
  });

  return fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json"
    },
    body
  })
    .then(checkStatus)
    .then(parseJSON);
}
