# `rex-widget/data`

Data fetching library which binds rex's ports, queries and custom request
handlers to React components.

Example code:

```
import {useFetch, port} from 'rex-widget/data'

function ShowUsers(props) {
  // Start fetching data.
  let users = useFetch(port('/api/users').limit(props.limit))

  // Handle updating state
  if (users.updating) {
    return <div>Loading...</div>
  }

  // Handle no-data case
  if (users.data == null) {
    return <div>No users found.</div>
  }

  return <div>{users.data.map(user => <div>{user.name}</div>)}</div>
}
```

Note that in the example above the request is only being sent if either:

1. This is the first render
2. Request parameters has changed since the last render

This means that each re-render of the component won't send a network request.
