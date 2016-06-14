/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


function checkStatus(response) {
  if ((response.status >= 200) && (response.status < 300)) {
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
  return fetch(
    url,
    {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json'
      }
    }
  ).then(
    checkStatus
  ).then(
    parseJSON
  );
}

