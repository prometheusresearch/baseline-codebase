import {configure} from '@kadira/storybook';

import './index.css';

function loadStories() {
  let stories = require.context('../src', true, /^\.\/.*\.story\.js/);
  for (let story of stories.keys()) {
    stories(story);
  }
}

configure(loadStories, module);
