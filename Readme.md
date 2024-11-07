Original [**online** package](https://www.npmjs.com/package/online). [MIT License](https://github.com/leeli0/online-new/blob/main/LICENSE)

Track online user activity with redis.

## Example

```js
import online from 'online-new';
import {createClient} from 'redis';

const db = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

// use the given redis client
const onlineDb = online(db);

// later in middleware or somewhere in your
// application add these calls to track activity:
await onlineDb.add(user.id);

// get users active in the last 10 minutes
await users = onlineDb.last(10);
```

## API

### Online.add(id)

  Add a user `id` to the active minute-level set.

### Online.clear()

  Clear all activity tracking, useful for tests etc.

### Online.last(n)

  Get activity in the last `n` minutes.
